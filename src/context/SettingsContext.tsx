import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StoreSettings } from '../types';
import {
  getStoredSettings,
  saveStoredSettings,
  STORAGE_CHANGE_EVENT,
  clearSettingsCache,
} from '../services/storageService';
import { useAuth } from './AuthContext';

const FALLBACK_SETTINGS: StoreSettings = {
  brandName: 'GUL SAZ',
  tagline: 'Elegance Woven For You',
  address: '',
  phone: '',
  email: '',
  currencySymbol: 'Rs.',
  currencyCode: 'PKR',
  taxRatePercent: 0,
  receiptFooterMessage: 'Thank you for shopping with us.',
};

interface SettingsContextType {
  settings: StoreSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (next: StoreSettings) => Promise<StoreSettings>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(FALLBACK_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(FALLBACK_SETTINGS);
      return;
    }

    setIsLoading(true);
    try {
      clearSettingsCache();
      const data = await getStoredSettings();
      setSettings(data);
    } catch {
      setSettings(FALLBACK_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    const onChange = () => {
      void refreshSettings();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
  }, [refreshSettings]);

  const updateSettings = async (next: StoreSettings) => {
    const saved = await saveStoredSettings(next);
    setSettings(saved);
    return saved;
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
