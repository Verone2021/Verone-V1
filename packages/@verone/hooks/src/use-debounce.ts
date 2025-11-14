/**
 * Hook: useDebounce
 * Debounce une valeur avec délai configurable
 * Utile pour search inputs, API calls, etc.
 */

import { useEffect, useState } from 'react';

/**
 * Hook pour debounce une valeur
 * @param value - Valeur à debounce
 * @param delay - Délai en millisecondes (défaut: 500ms)
 * @returns Valeur debouncée
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * useEffect(() => {
 *   // API call avec searchTerm debounced
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
