/**
 * Hook: useHover
 * Détecter hover sur élément
 * Compatible shadcn/ui patterns
 */

import type { RefObject } from 'react';
import { useState, useEffect } from 'react';

/**
 * Hook pour détecter le hover sur un élément
 * @param ref - Ref de l'élément à surveiller
 * @returns boolean - true si hover, false sinon
 *
 * @example
 * const hoverRef = useRef(null)
 * const isHovered = useHover(hoverRef)
 *
 * return (
 *   <div ref={hoverRef}>
 *     {isHovered ? 'Hovered!' : 'Hover me'}
 *   </div>
 * )
 */
export function useHover<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>
): boolean {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return isHovered;
}
