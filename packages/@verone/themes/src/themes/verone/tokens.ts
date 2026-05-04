import type { BrandTokens } from '../../types';

/**
 * Tokens de la marque Vérone — concept store parisien, déco & mobilier premium.
 * Source : DS généré sur claude.ai/design (handoff bundle 2026-04-30).
 *
 * Palette stricte 3 couleurs : or, charbon, blanc.
 * Mode jour ET mode nuit (hero, footer, modals premium).
 * Aucune autre teinte autorisée hors gris perle (UI uniquement).
 *
 * Polices : Balgin (display) et Migra (heading) sont propriétaires et NON livrées.
 * Fallback Google Fonts : DM Sans (display), Bodoni Moda / Playfair Display (heading), Montserrat (body).
 * Pour fidélité 100 %, déposer les .woff2 dans apps/site-internet/public/fonts/ et étendre le CSS.
 */
export const veroneTokens: BrandTokens = {
  meta: {
    slug: 'verone',
    label: 'Vérone',
    tagline:
      "Concept store parisien · décoration & mobilier d'intérieur premium",
  },

  colors: {
    primary: '#1d1d1b',
    primaryForeground: '#FFFFFF',
    secondary: '#C9A961',
    secondaryForeground: '#1d1d1b',
    accent: '#C9A961',
    accentForeground: '#1d1d1b',
    background: '#FFFFFF',
    backgroundElevated: '#FFFFFF',
    backgroundMuted: '#E6E5E2',
    foreground: '#1d1d1b',
    foregroundMuted: '#9B9B98',
    foregroundInverted: '#FFFFFF',
    border: '#E6E5E2',
    borderStrong: '#1d1d1b',
    rule: 'rgba(29,29,27,0.12)',
    destructive: '#B33A3A',
    destructiveForeground: '#FFFFFF',
  },

  colorsNight: {
    background: '#1d1d1b',
    backgroundElevated: '#2A2A28',
    backgroundMuted: '#232321',
    foreground: '#FFFFFF',
    foregroundMuted: '#9B9B98',
    foregroundInverted: '#1d1d1b',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: '#C9A961',
    rule: 'rgba(255,255,255,0.12)',
  },

  brandColors: {
    gold: '#C9A961',
    goldDeep: '#B8954A',
    goldLight: '#D4B86E',
    charcoal: '#1d1d1b',
    charcoalSoft: '#2A2A28',
    white: '#FFFFFF',
    pearl: '#9B9B98',
    pearlSoft: '#E6E5E2',
  },

  typography: {
    fontDisplay:
      '"Balgin", "DM Sans", "Cormorant Infant", system-ui, sans-serif',
    fontHeading: '"Migra", "Bodoni Moda", "Playfair Display", Georgia, serif',
    fontBody: '"Montserrat", system-ui, -apple-system, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, monospace',
    tracking: {
      display: '0.18em',
      eyebrow: '0.32em',
      button: '0.16em',
      body: '0',
    },
    scale: {
      eyebrow: '12px',
      bodySm: '13px',
      body: '15px',
      bodyLg: '17px',
      h6: '18px',
      h5: '22px',
      h4: '28px',
      h3: '38px',
      h2: '52px',
      h1: '72px',
      display: '112px',
    },
    lineHeight: {
      tight: '1.04',
      snug: '1.18',
      body: '1.55',
      loose: '1.7',
    },
  },

  spacing: {
    s1: '4px',
    s2: '8px',
    s3: '12px',
    s4: '16px',
    s5: '24px',
    s6: '32px',
    s7: '48px',
    s8: '64px',
    s9: '96px',
    s10: '128px',
    s11: '160px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 0 0 rgba(29,29,27,0.06)',
    md: '0 12px 40px -16px rgba(29,29,27,0.18)',
    lg: '0 28px 80px -24px rgba(29,29,27,0.28)',
    xl: '0 40px 100px -32px rgba(29,29,27,0.35)',
  },

  radius: {
    none: '0px',
    sm: '1px',
    md: '2px',
    lg: '4px',
    full: '9999px',
  },

  motion: {
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    durationFast: '180ms',
    durationBase: '320ms',
    durationSlow: '620ms',
  },

  layout: {
    container: '1440px',
    gutter: '32px',
    gutterLg: '64px',
    hairline: '1px',
  },

  signature: {
    damierCell: '6px',
  },
};
