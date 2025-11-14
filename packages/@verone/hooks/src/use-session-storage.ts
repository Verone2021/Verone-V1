/**
 * Hook: useSessionStorage
 * Synchronise état React avec sessionStorage
 * Type-safe avec sérialisation JSON automatique
 */

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Hook pour persister état dans sessionStorage
 * @param key - Clé sessionStorage
 * @param initialValue - Valeur initiale si clé n'existe pas
 * @returns [storedValue, setValue] - Comme useState mais synchronisé avec sessionStorage
 *
 * @example
 * const [filters, setFilters] = useSessionStorage('search-filters', {})
 * const [sortBy, setSortBy] = useSessionStorage<'name' | 'date'>('sort', 'name')
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // Get initial value from sessionStorage or use initialValue
  const readValue = useCallback((): T => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // setValue wrapper to also update sessionStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      // Server-side rendering guard
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting sessionStorage key "${key}" even though environment is not a client`
        );
        return;
      }

      try {
        // Allow value to be a function (same API as useState)
        const newValue = value instanceof Function ? value(storedValue) : value;

        // Save to sessionStorage
        window.sessionStorage.setItem(key, JSON.stringify(newValue));

        // Update state
        setStoredValue(newValue);

        // Dispatch custom event for same-tab synchronization
        window.dispatchEvent(
          new CustomEvent('session-storage', {
            detail: { key, newValue },
          })
        );
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for custom event (same tab only - sessionStorage doesn't sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; newValue: T }>;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.newValue);
      }
    };

    window.addEventListener('session-storage', handleStorageChange);

    return () => {
      window.removeEventListener('session-storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}
