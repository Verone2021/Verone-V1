/**
 * Types partagés pour le design system multi-marques Vérone.
 *
 * ORTHOGRAPHE :
 * - Slugs techniques (URLs, variables, fichiers) : verone | boemia | solar | flos | linkme | office
 * - Libellés humains (UI, marketing) : via BRAND_LABELS (ex: "Boêmia" avec accent ê)
 */

export type BrandSlug =
  | 'verone'
  | 'boemia'
  | 'solar'
  | 'flos'
  | 'linkme'
  | 'office';

export const BRAND_SLUGS: readonly BrandSlug[] = [
  'verone',
  'boemia',
  'solar',
  'flos',
  'linkme',
  'office',
] as const;

export const BRAND_LABELS: Record<BrandSlug, string> = {
  verone: 'Vérone',
  boemia: 'Boêmia',
  solar: 'Solar',
  flos: 'Flos',
  linkme: 'LinkMe',
  office: 'Office',
};

/**
 * Structure des tokens par marque.
 * Remplie dans BO-DS-002 après génération sur claude.ai web.
 * Jusqu'à BO-DS-002, les tokens par marque sont null (placeholder).
 */
export interface BrandTokens {
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    destructive: string;
    destructiveForeground: string;
  };
  typography: {
    fontHeading: string;
    fontBody: string;
    fontMono: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}
