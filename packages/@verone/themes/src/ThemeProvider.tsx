'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { BrandSlug, BrandTokens } from './types';
import { themeRegistry } from './themes/index';

export type ThemeMode = 'day' | 'night';

interface ThemeContextValue {
  brand: BrandSlug;
  setBrand: (brand: BrandSlug) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  tokens: BrandTokens | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Marque active. Détermine les variables CSS injectées. */
  brand?: BrandSlug;
  /** Mode jour ou nuit (si la marque a un mode nuit défini). Défaut : day. */
  mode?: ThemeMode;
  children: React.ReactNode;
  /**
   * Si true, injecte les variables CSS sur <html> (usage app-level).
   * Si false (défaut), injecte sur un wrapper <div data-brand="...">.
   * Utiliser injectOnRoot pour les layouts racine, false pour Storybook.
   */
  injectOnRoot?: boolean;
}

export function ThemeProvider({
  brand: initialBrand = 'verone',
  mode: initialMode = 'day',
  children,
  injectOnRoot = false,
}: ThemeProviderProps) {
  const [brand, setBrandState] = useState<BrandSlug>(initialBrand);
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setBrand = useCallback((next: BrandSlug) => {
    setBrandState(next);
  }, []);
  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const tokens = useMemo(() => themeRegistry[brand] ?? null, [brand]);

  useEffect(() => {
    if (!injectOnRoot || !tokens) return;
    const el = document.documentElement;
    applyCssVars(el, tokens, mode);
    el.setAttribute('data-brand', brand);
    el.setAttribute('data-mode', mode);
    return () => {
      removeCssVars(el, tokens);
      el.removeAttribute('data-brand');
      el.removeAttribute('data-mode');
    };
  }, [tokens, mode, brand, injectOnRoot]);

  const ctx = useMemo(
    () => ({ brand, setBrand, mode, setMode, tokens }),
    [brand, setBrand, mode, setMode, tokens]
  );

  if (injectOnRoot) {
    return (
      <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
    );
  }

  const cssVars: React.CSSProperties = tokens
    ? (buildCssVarObject(tokens, mode) as React.CSSProperties)
    : {};

  return (
    <ThemeContext.Provider value={ctx}>
      <div
        data-brand={brand}
        data-mode={mode}
        style={cssVars}
        className="contents"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside a <ThemeProvider>');
  }
  return ctx;
}

/**
 * Génère le mapping complet tokens → variables CSS.
 *
 * Trois familles de variables exposées :
 * - Sémantiques (`--bg`, `--fg`, `--accent`, `--border`, `--rule`) — préférées par les composants
 * - Génériques shadcn-compatibles (`--color-primary`, `--color-foreground`, etc.)
 * - Nominatives marque (`--color-gold`, `--color-charcoal`, etc.) — réservées au CSS de marque
 *
 * Le mode (day/night) bascule automatiquement bg/fg/border/rule.
 */
export function buildCssVarObject(
  tokens: BrandTokens,
  mode: ThemeMode = 'day'
): Record<string, string> {
  const out: Record<string, string> = {};
  const c = tokens.colors;
  const useNight = mode === 'night' && tokens.colorsNight;
  const n = tokens.colorsNight;

  out['--color-primary'] = c.primary;
  out['--color-primary-foreground'] = c.primaryForeground;
  out['--color-secondary'] = c.secondary;
  out['--color-secondary-foreground'] = c.secondaryForeground;
  out['--color-accent'] = c.accent;
  out['--color-accent-foreground'] = c.accentForeground;
  out['--color-background'] = useNight && n ? n.background : c.background;
  out['--color-foreground'] = useNight && n ? n.foreground : c.foreground;
  out['--color-muted'] = useNight && n ? n.backgroundMuted : c.backgroundMuted;
  out['--color-muted-foreground'] =
    useNight && n ? n.foregroundMuted : c.foregroundMuted;
  out['--color-border'] = useNight && n ? n.border : c.border;
  out['--color-destructive'] = c.destructive;
  out['--color-destructive-foreground'] = c.destructiveForeground;

  out['--bg'] = useNight && n ? n.background : c.background;
  out['--bg-elevated'] =
    useNight && n ? n.backgroundElevated : c.backgroundElevated;
  out['--bg-muted'] = useNight && n ? n.backgroundMuted : c.backgroundMuted;
  out['--fg'] = useNight && n ? n.foreground : c.foreground;
  out['--fg-muted'] = useNight && n ? n.foregroundMuted : c.foregroundMuted;
  out['--fg-inverted'] =
    useNight && n ? n.foregroundInverted : c.foregroundInverted;
  out['--accent'] = c.accent;
  out['--border'] = useNight && n ? n.border : c.border;
  out['--border-strong'] = useNight && n ? n.borderStrong : c.borderStrong;
  out['--rule'] = useNight && n ? n.rule : c.rule;

  if (tokens.brandColors) {
    for (const [key, value] of Object.entries(tokens.brandColors)) {
      out[`--color-${kebab(key)}`] = value;
    }
  }

  out['--font-display'] = tokens.typography.fontDisplay;
  out['--font-heading'] = tokens.typography.fontHeading;
  out['--font-body'] = tokens.typography.fontBody;
  out['--font-mono'] = tokens.typography.fontMono;

  out['--tracking-display'] = tokens.typography.tracking.display;
  out['--tracking-eyebrow'] = tokens.typography.tracking.eyebrow;
  out['--tracking-button'] = tokens.typography.tracking.button;
  out['--tracking-body'] = tokens.typography.tracking.body;

  out['--fs-eyebrow'] = tokens.typography.scale.eyebrow;
  out['--fs-body-sm'] = tokens.typography.scale.bodySm;
  out['--fs-body'] = tokens.typography.scale.body;
  out['--fs-body-lg'] = tokens.typography.scale.bodyLg;
  out['--fs-h6'] = tokens.typography.scale.h6;
  out['--fs-h5'] = tokens.typography.scale.h5;
  out['--fs-h4'] = tokens.typography.scale.h4;
  out['--fs-h3'] = tokens.typography.scale.h3;
  out['--fs-h2'] = tokens.typography.scale.h2;
  out['--fs-h1'] = tokens.typography.scale.h1;
  out['--fs-display'] = tokens.typography.scale.display;

  out['--lh-tight'] = tokens.typography.lineHeight.tight;
  out['--lh-snug'] = tokens.typography.lineHeight.snug;
  out['--lh-body'] = tokens.typography.lineHeight.body;
  out['--lh-loose'] = tokens.typography.lineHeight.loose;

  out['--s-1'] = tokens.spacing.s1;
  out['--s-2'] = tokens.spacing.s2;
  out['--s-3'] = tokens.spacing.s3;
  out['--s-4'] = tokens.spacing.s4;
  out['--s-5'] = tokens.spacing.s5;
  out['--s-6'] = tokens.spacing.s6;
  out['--s-7'] = tokens.spacing.s7;
  out['--s-8'] = tokens.spacing.s8;
  out['--s-9'] = tokens.spacing.s9;
  out['--s-10'] = tokens.spacing.s10;
  out['--s-11'] = tokens.spacing.s11;

  out['--shadow-0'] = tokens.shadows.none;
  out['--shadow-1'] = tokens.shadows.sm;
  out['--shadow-2'] = tokens.shadows.md;
  out['--shadow-3'] = tokens.shadows.lg;
  out['--shadow-4'] = tokens.shadows.xl;
  out['--shadow-sm'] = tokens.shadows.sm;
  out['--shadow-md'] = tokens.shadows.md;
  out['--shadow-lg'] = tokens.shadows.lg;

  out['--radius-0'] = tokens.radius.none;
  out['--radius-1'] = tokens.radius.sm;
  out['--radius-2'] = tokens.radius.md;
  out['--radius-3'] = tokens.radius.lg;
  out['--radius-pill'] = tokens.radius.full;
  out['--radius-sm'] = tokens.radius.sm;
  out['--radius-md'] = tokens.radius.md;
  out['--radius-lg'] = tokens.radius.lg;
  out['--radius-full'] = tokens.radius.full;

  out['--ease-editorial'] = tokens.motion.easing;
  out['--dur-fast'] = tokens.motion.durationFast;
  out['--dur-base'] = tokens.motion.durationBase;
  out['--dur-slow'] = tokens.motion.durationSlow;

  out['--container'] = tokens.layout.container;
  out['--gutter'] = tokens.layout.gutter;
  out['--gutter-lg'] = tokens.layout.gutterLg;
  out['--hairline'] = tokens.layout.hairline;

  if (tokens.signature?.damierCell) {
    out['--damier-cell'] = tokens.signature.damierCell;
  }

  return out;
}

function kebab(key: string): string {
  return key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

function applyCssVars(
  el: HTMLElement,
  tokens: BrandTokens,
  mode: ThemeMode
): void {
  for (const [k, v] of Object.entries(buildCssVarObject(tokens, mode))) {
    el.style.setProperty(k, v);
  }
}

function removeCssVars(el: HTMLElement, tokens: BrandTokens): void {
  for (const k of Object.keys(buildCssVarObject(tokens, 'day'))) {
    el.style.removeProperty(k);
  }
}
