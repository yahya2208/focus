import { useState, useEffect, useCallback } from 'react';
import {
  getSettings,
  updateSettings,
  subscribeSettings,
  type AppSettings,
} from '../core/config/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    return subscribeSettings(setSettings);
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    updateSettings(partial);
  }, []);

  return { settings, update };
}
