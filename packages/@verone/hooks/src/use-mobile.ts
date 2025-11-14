/**
 * Hook: useMobile
 * Détecte si l'appareil est un mobile/tablette
 * Alias pratique de useMediaQuery pour shadcn/ui
 */

import { useMediaQuery } from './use-media-query';

/**
 * Breakpoint mobile Tailwind CSS (< 768px)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook pour détecter les appareils mobiles
 * @returns boolean - true si l'écran est < 768px (mobile/tablette)
 *
 * @example
 * const isMobile = useMobile()
 * return isMobile ? <MobileNav /> : <DesktopNav />
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
