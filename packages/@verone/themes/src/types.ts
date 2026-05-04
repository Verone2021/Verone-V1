/**
 * Types partagés pour le design system multi-marques Vérone.
 *
 * ORTHOGRAPHE :
 * - Slugs techniques (URLs, variables, fichiers) : verone | boemia | solar | flos | linkme | office
 * - Libellés humains (UI, marketing) : via BRAND_LABELS (ex: "Boêmia" avec accent ê)
 *
 * STRUCTURE :
 * BrandTokens contient tout ce qui peut varier par marque (couleurs, typo, spacing,
 * ombres, radius, motion, layout, signature). Les champs optionnels (`?`) ne sont
 * remplis que pour les marques qui en ont besoin (ex: mode nuit Vérone, damier).
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

export interface BrandColorsDay {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  backgroundElevated: string;
  backgroundMuted: string;
  foreground: string;
  foregroundMuted: string;
  foregroundInverted: string;
  border: string;
  borderStrong: string;
  rule: string;
  destructive: string;
  destructiveForeground: string;
}

export interface BrandColorsNight {
  background: string;
  backgroundElevated: string;
  backgroundMuted: string;
  foreground: string;
  foregroundMuted: string;
  foregroundInverted: string;
  border: string;
  borderStrong: string;
  rule: string;
}

export interface BrandTypography {
  fontDisplay: string;
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  tracking: {
    display: string;
    eyebrow: string;
    button: string;
    body: string;
  };
  scale: {
    eyebrow: string;
    bodySm: string;
    body: string;
    bodyLg: string;
    h6: string;
    h5: string;
    h4: string;
    h3: string;
    h2: string;
    h1: string;
    display: string;
  };
  lineHeight: {
    tight: string;
    snug: string;
    body: string;
    loose: string;
  };
}

export interface BrandSpacing {
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
  s6: string;
  s7: string;
  s8: string;
  s9: string;
  s10: string;
  s11: string;
}

export interface BrandShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface BrandRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface BrandMotion {
  easing: string;
  durationFast: string;
  durationBase: string;
  durationSlow: string;
}

export interface BrandLayout {
  container: string;
  gutter: string;
  gutterLg: string;
  hairline: string;
}

export interface BrandSignature {
  damierCell?: string;
}

export interface BrandTokens {
  meta: {
    slug: BrandSlug;
    label: string;
    tagline?: string;
  };
  colors: BrandColorsDay;
  colorsNight?: BrandColorsNight;
  brandColors?: Record<string, string>;
  typography: BrandTypography;
  spacing: BrandSpacing;
  shadows: BrandShadows;
  radius: BrandRadius;
  motion: BrandMotion;
  layout: BrandLayout;
  signature?: BrandSignature;
}
