import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  companyName: string;
  currency: string;
  fiscalYearStart: string;
  lowStockThreshold: number; // Percentage buffer above reorder point
  autoReorder: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  formatCurrency: (amount: number) => string;
}

const defaultSettings: Settings = {
  companyName: 'StockWise Inc.',
  currency: 'USD', // Defaulting to USD, can be switched to PHP, EUR, etc.
  fiscalYearStart: 'January',
  lowStockThreshold: 20,
  autoReorder: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Hydrate settings from local storage on boot
  useEffect(() => {
    const stored = localStorage.getItem('stockwise-settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  // Save settings dynamically when modified
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('stockwise-settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Universal formatter that reads the live currency state
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};