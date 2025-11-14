/**
 * Hook: useEventListener
 * Attach event listeners proprement avec cleanup automatique
 * Compatible shadcn/ui patterns
 */

import { useEffect, useRef } from 'react';

/**
 * Hook pour attacher un event listener
 * @param eventName - Nom de l'événement (ex: 'keydown', 'scroll')
 * @param handler - Fonction handler de l'événement
 * @param element - Élément cible (défaut: window)
 *
 * @example
 * useEventListener('keydown', (e) => {
 *   if (e.key === 'Escape') closeModal()
 * })
 *
 * @example
 * const divRef = useRef(null)
 * useEventListener('scroll', handleScroll, divRef.current)
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: HTMLElement | Window | null
): void {
  // Store handler in ref to avoid re-running effect on every render
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    // Define the listening target
    const targetElement = element ?? window;

    // Make sure element supports addEventListener
    if (!targetElement?.addEventListener) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    targetElement.addEventListener(eventName, eventListener);

    // Cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
