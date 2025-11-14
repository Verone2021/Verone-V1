/**
 * Hook: useWindowSize
 * Dimensions fenêtre réactives (width, height)
 * Compatible shadcn/ui patterns
 */

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook pour obtenir les dimensions de la fenêtre
 * @returns {width, height} - Dimensions réactives
 *
 * @example
 * const { width, height } = useWindowSize()
 *
 * const columns = width > 1280 ? 4 : width > 1024 ? 3 : 2
 * return <Grid columns={columns}>...</Grid>
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}
