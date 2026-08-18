import { useMemo } from 'react';
import { useLiveData } from '../data/liveData'; // Ensure this points to your SQLite context
import { useSettings } from '../contexts/SettingsContext';

export type NotificationAlert = {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  timestamp: string;
};

export function useNotifications() {
  const { data } = useLiveData();
  const { settings } = useSettings();

  const notifications = useMemo(() => {
    const alerts: NotificationAlert[] = [];

    // 1. System Updates (Mock logic for your Application Updates requirement)
    alerts.push({
      id: 'sys-update-01',
      title: 'New Version Available',
      message: 'Version 0.2.0 is ready to install. Check settings for details.',
      type: 'info',
      timestamp: new Date().toISOString(),
    });

    // 2. Dynamic Inventory Scanning
    data.products.forEach((product) => {
      // Calculate the threshold buffer (e.g., 20% above the reorder point)
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
  }, [data.products, settings.lowStockThreshold]);

  const unreadCount = notifications.length;

  return { notifications, unreadCount };
}