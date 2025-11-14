/**
 * Hook: useClickOutside
 * Détecter clics hors élément (dropdowns, modals, popovers)
 * Compatible shadcn/ui patterns
 */

import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Hook pour détecter les clics en dehors d'un élément
 * @param ref - Ref de l'élément à surveiller
 * @param handler - Fonction appelée lors du clic extérieur
 *
 * @example
 * const dropdownRef = useRef(null)
 * useClickOutside(dropdownRef, () => setIsOpen(false))
 *
 * return (
 *   <div ref={dropdownRef}>
 *     <Dropdown />
 *   </div>
 * )
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    // Add event listeners
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
