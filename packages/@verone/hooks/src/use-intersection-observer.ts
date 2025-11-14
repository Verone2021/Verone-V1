/**
 * Hook: useIntersectionObserver
 * Détecter visibilité élément viewport (lazy loading, infinite scroll)
 * Compatible shadcn/ui patterns
 */

import type { RefObject } from 'react';
import { useState, useEffect } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

/**
 * Hook pour détecter si un élément est visible dans le viewport
 * @param ref - Ref de l'élément à surveiller
 * @param options - Options IntersectionObserver + freezeOnceVisible
 * @returns IntersectionObserverEntry | null
 *
 * @example
 * const imgRef = useRef(null)
 * const entry = useIntersectionObserver(imgRef, { threshold: 0.5 })
 * const isVisible = entry?.isIntersecting
 *
 * return (
 *   <img
 *     ref={imgRef}
 *     src={isVisible ? imageUrl : placeholder}
 *   />
 * )
 *
 * @example
 * // Lazy load once (freeze après première visibilité)
 * const entry = useIntersectionObserver(ref, {
 *   freezeOnceVisible: true
 * })
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | null {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const frozen = freezeOnceVisible && entry?.isIntersecting;

  useEffect(() => {
    const element = ref.current;

    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    // Browser support check
    if (!window.IntersectionObserver) {
      return;
    }

    if (!element || frozen) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, root, rootMargin, frozen]);

  return entry;
}
