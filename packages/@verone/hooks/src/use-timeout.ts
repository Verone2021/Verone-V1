/**
 * Hook: useTimeout
 * setTimeout déclaratif React-friendly
 * Compatible shadcn/ui patterns
 */

import { useEffect, useRef } from 'react';

/**
 * Hook pour utiliser setTimeout de manière déclarative
 * @param callback - Fonction à exécuter après le délai
 * @param delay - Délai en millisecondes (null pour annuler)
 *
 * @example
 * const [show, setShow] = useState(true)
 * useTimeout(() => {
 *   setShow(false)
 * }, 3000)
 *
 * @example
 * // Delayed action avec condition
 * useTimeout(() => {
 *   saveForm()
 * }, isDirty ? 5000 : null)
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    // Don't schedule if no delay is specified (null)
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearTimeout(id);
    };
  }, [delay]);
}
