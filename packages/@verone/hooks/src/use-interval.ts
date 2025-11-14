/**
 * Hook: useInterval
 * setInterval déclaratif React-friendly
 * Compatible shadcn/ui patterns
 */

import { useEffect, useRef } from 'react';

/**
 * Hook pour utiliser setInterval de manière déclarative
 * @param callback - Fonction à exécuter à intervalle régulier
 * @param delay - Délai en millisecondes (null pour pause)
 *
 * @example
 * const [count, setCount] = useState(0)
 * useInterval(() => {
 *   setCount(count + 1)
 * }, 1000)
 *
 * @example
 * // Polling API toutes les 30 secondes
 * useInterval(() => {
 *   fetchData()
 * }, 30000)
 *
 * @example
 * // Pause interval conditionnellement
 * useInterval(callback, isPaused ? null : 1000)
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if no delay is specified (null)
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}
