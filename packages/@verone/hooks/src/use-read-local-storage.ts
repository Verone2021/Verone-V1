/**
 * Hook: useReadLocalStorage
 * Lecture seule localStorage avec synchronisation
 * Compatible shadcn/ui patterns
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour lire localStorage sans écrire
 * @param key - Clé localStorage à lire
 * @returns T | null - Valeur parsée ou null si inexistante
 *
 * @example
 * const theme = useReadLocalStorage<'light' | 'dark'>('theme')
 * const settings = useReadLocalStorage<Settings>('user-settings')
 *
 * return <div className={theme === 'dark' ? 'dark' : ''}>...</div>
 */
export function useReadLocalStorage<T>(key: string): T | null {
  // Read value from localStorage
  const readValue = useCallback((): T | null => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T | null>(readValue);

  // Listen for changes in localStorage (both tabs and custom events)
  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    // Update state when localStorage changes (other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(
            `Error parsing localStorage value for key "${key}":`,
            error
          );
        }
      }
    };

    // Listen for custom event (same tab)
    const handleLocalStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; newValue: T }>;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleLocalStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleLocalStorageChange);
    };
  }, [key]);

  return storedValue;
}
