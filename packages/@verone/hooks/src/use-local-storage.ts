/**
 * Hook: useLocalStorage
 * Synchronise état React avec localStorage
 * Type-safe avec sérialisation JSON automatique
 */

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Hook pour persister état dans localStorage
 * @param key - Clé localStorage
 * @param initialValue - Valeur initiale si clé n'existe pas
 * @returns [storedValue, setValue] - Comme useState mais synchronisé avec localStorage
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light')
 * const [user, setUser] = useLocalStorage('user', { name: 'John' })
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // Get initial value from localStorage or use initialValue
  const readValue = useCallback((): T => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // setValue wrapper to also update localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      // Server-side rendering guard
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        );
        return;
      }

      try {
        // Allow value to be a function (same API as useState)
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(newValue));

        // Update state
        setStoredValue(newValue);

        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, newValue },
          })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes in other tabs/windows
  useEffect(() => {
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

  return [storedValue, setValue];
}
