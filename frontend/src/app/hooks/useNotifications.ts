import { useMemo, useState, useEffect } from 'react';
import { useLiveData } from '../data/liveData'; 
import { useSettings } from '../contexts/SettingsContext';

export type NotificationAlert = {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: string;
};

// 🛑 IMPORTANT: Update these constants before deploying!
const CURRENT_VERSION = "v1.0.0"; 
const GITHUB_REPO = "your-github-username/your-repository-name"; // e.g., "johndoe/inventory-app"

export function useNotifications() {
  const { data } = useLiveData();
  const { settings } = useSettings();
  
  // State to hold the fetched GitHub update alert
  const [updateAlert, setUpdateAlert] = useState<NotificationAlert | null>(null);

  // Background fetch to GitHub API for latest release
  useEffect(() => {
    // Only fetch if a repo is set
    if (GITHUB_REPO.includes("your-github-username")) return;

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then((res) => res.json())
      .then((githubData) => {
        // If the latest tag (e.g., v0.2.0) doesn't match our current version, trigger an alert!
        if (githubData.tag_name && githubData.tag_name !== CURRENT_VERSION) {
          setUpdateAlert({
            id: 'sys-update-gh',
            title: 'New Update Available 🚀',
            message: `Version ${githubData.tag_name} is ready to download! You are currently running ${CURRENT_VERSION}. Check GitHub for release notes.`,
            type: 'info',
            timestamp: new Date().toISOString(),
          });
        }
      })
      .catch((err) => console.log("Silent fail on update check (offline or rate limited):", err));
  }, []);

  const notifications = useMemo(() => {
    const alerts: NotificationAlert[] = [];

    // 1. Inject the GitHub Update Alert if it exists
    if (updateAlert) {
      alerts.push(updateAlert);
    }

    // 2. Dynamic Inventory Scanning
    data.products.forEach((product) => {
      const warningLevel = product.reorderLevel * (1 + (settings.lowStockThreshold / 100));

      if (product.stock <= product.reorderLevel) {
        alerts.push({
          id: `crit-${product.id}`,
          title: 'Critical Stock Alert',
          message: `${product.name} (${product.sku}) has fallen at or below the reorder point. Immediate action required.`,
          type: 'critical',
          timestamp: new Date().toISOString(),
        });
      } else if (product.stock <= warningLevel) {
        alerts.push({
          id: `warn-${product.id}`,
          title: 'Low Stock Warning',
          message: `${product.name} is approaching the reorder threshold (${product.stock} units left).`,
          type: 'warning',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Sort newest to oldest
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data.products, settings.lowStockThreshold, updateAlert]);

  const unreadCount = notifications.length;

  return { notifications, unreadCount };
}