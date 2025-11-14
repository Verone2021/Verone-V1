/**
 * Hook: useMediaQuery
 * Détecte si une media query CSS correspond
 * Compatible shadcn/ui patterns
 */

import { useEffect, useState } from 'react';

/**
 * Hook pour détecter les media queries CSS
 * @param query - Media query CSS (ex: "(min-width: 768px)")
 * @returns boolean - true si la media query correspond
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)")
 * const isMobile = useMediaQuery("(max-width: 767px)")
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}
