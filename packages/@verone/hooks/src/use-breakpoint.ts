/**
 * Hook: useBreakpoint
 *
 * Hook centralise pour gerer les breakpoints responsive Verone.
 * Aligne sur les breakpoints Tailwind CSS standards.
 *
 * Breakpoints Verone :
 * - mobile   : < 640px   (iPhone SE, iPhone 14, iPhone Pro Max, Fold plie)
 * - sm       : 640px+    (Fold plie grand + tres petites tablettes)
 * - md       : 768px+    (Tablette, iPad portrait, Fold ouvert)
 * - lg       : 1024px+   (Laptop S - MacBook Air 11", tablette paysage)
 * - xl       : 1280px+   (Laptop M - MacBook 13", 14")
 * - 2xl      : 1536px+   (Desktop 16", ecran externe)
 *
 * Usage recommande :
 * ```tsx
 * const bp = useBreakpoint();
 * if (bp.isMobile) return <MobileView />;
 * if (bp.isDesktop) return <DesktopView />;
 * ```
 *
 * SSR-safe : retourne tous les flags a `false` cote serveur.
 * Utiliser `bp.isReady` pour eviter un flash de contenu au premier render.
 */

import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface BreakpointState {
  /** < 640px : mobile (iPhone, Fold plie) */
  isMobile: boolean;
  /** >= 640px ET < 768px : petit paysage */
  isSmall: boolean;
  /** >= 768px ET < 1024px : tablette */
  isTablet: boolean;
  /** >= 1024px ET < 1280px : laptop S */
  isLaptopSmall: boolean;
  /** >= 1280px ET < 1536px : laptop M (MacBook 13/14) */
  isLaptop: boolean;
  /** >= 1536px : desktop large */
  isDesktop: boolean;

  /** Raccourcis utiles (combinaisons) */
  isMobileOrTablet: boolean; // < 1024px (afficher mode mobile UI)
  isLaptopOrLarger: boolean; // >= 1024px (afficher mode desktop UI)

  /** Largeur viewport actuelle en pixels */
  width: number;

  /**
   * Flag indiquant que le hook a fini son premier render cote client.
   * Utile pour eviter les flash cote SSR.
   */
  isReady: boolean;
}

/**
 * Hook React principal pour lire les breakpoints responsive.
 * Gere le resize automatiquement et est SSR-safe.
 */
export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    handleResize();
    setIsReady(true);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width > 0 && width < BREAKPOINTS.sm;
  const isSmall = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isLaptopSmall = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl;
  const isLaptop = width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'];
  const isDesktop = width >= BREAKPOINTS['2xl'];

  return {
    isMobile,
    isSmall,
    isTablet,
    isLaptopSmall,
    isLaptop,
    isDesktop,
    isMobileOrTablet: width > 0 && width < BREAKPOINTS.lg,
    isLaptopOrLarger: width >= BREAKPOINTS.lg,
    width,
    isReady,
  };
}

/**
 * Helper : retourne true si la largeur actuelle est >= au breakpoint donne.
 * Equivalent de la regle CSS Tailwind `md:xxx` / `lg:xxx`.
 *
 * @example
 * const isMdOrUp = useBreakpointUp('md');
 * // true si viewport >= 768px
 */
export function useBreakpointUp(breakpoint: BreakpointKey): boolean {
  const { width } = useBreakpoint();
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Helper : retourne true si la largeur actuelle est < au breakpoint donne.
 *
 * @example
 * const isSmallerThanLg = useBreakpointDown('lg');
 * // true si viewport < 1024px
 */
export function useBreakpointDown(breakpoint: BreakpointKey): boolean {
  const { width } = useBreakpoint();
  return width > 0 && width < BREAKPOINTS[breakpoint];
}
