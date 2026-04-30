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

interface ThemeContextValue {
  brand: BrandSlug;
  setBrand: (brand: BrandSlug) => void;
  tokens: BrandTokens | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Marque active. Détermine les variables CSS injectées. */
  brand?: BrandSlug;
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
  children,
  injectOnRoot = false,
}: ThemeProviderProps) {
  const [brand, setBrandState] = useState<BrandSlug>(initialBrand);

  const setBrand = useCallback((next: BrandSlug) => {
    setBrandState(next);
  }, []);

  const tokens = useMemo(() => themeRegistry[brand] ?? null, [brand]);

  // Injection sur <html> si injectOnRoot
  useEffect(() => {
    if (!injectOnRoot || !tokens) return;
    const el = document.documentElement;
    applyCssVars(el, tokens);
    return () => removeCssVars(el, tokens);
  }, [tokens, injectOnRoot]);

  const ctx = useMemo(
    () => ({ brand, setBrand, tokens }),
    [brand, setBrand, tokens]
  );

  if (injectOnRoot) {
    return (
      <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
    );
  }

  // Injection sur le wrapper div via style inline
  const cssVars = tokens ? buildCssVarObject(tokens) : {};

  return (
    <ThemeContext.Provider value={ctx}>
      <div
        data-brand={brand}
        style={cssVars as React.CSSProperties}
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

// Mapping tokens → variables CSS
function buildCssVarObject(tokens: BrandTokens): Record<string, string> {
  return {
    '--color-primary': tokens.colors.primary,
    '--color-primary-foreground': tokens.colors.primaryForeground,
    '--color-secondary': tokens.colors.secondary,
    '--color-secondary-foreground': tokens.colors.secondaryForeground,
    '--color-accent': tokens.colors.accent,
    '--color-accent-foreground': tokens.colors.accentForeground,
    '--color-background': tokens.colors.background,
    '--color-foreground': tokens.colors.foreground,
    '--color-muted': tokens.colors.muted,
    '--color-muted-foreground': tokens.colors.mutedForeground,
    '--color-border': tokens.colors.border,
    '--color-destructive': tokens.colors.destructive,
    '--color-destructive-foreground': tokens.colors.destructiveForeground,
    '--font-heading': tokens.typography.fontHeading,
    '--font-body': tokens.typography.fontBody,
    '--font-mono': tokens.typography.fontMono,
    '--shadow-sm': tokens.shadows.sm,
    '--shadow-md': tokens.shadows.md,
    '--shadow-lg': tokens.shadows.lg,
    '--radius-sm': tokens.radius.sm,
    '--radius-md': tokens.radius.md,
    '--radius-lg': tokens.radius.lg,
    '--radius-full': tokens.radius.full,
  };
}

function applyCssVars(el: HTMLElement, tokens: BrandTokens): void {
  for (const [k, v] of Object.entries(buildCssVarObject(tokens))) {
    el.style.setProperty(k, v);
  }
}

function removeCssVars(el: HTMLElement, tokens: BrandTokens): void {
  for (const k of Object.keys(buildCssVarObject(tokens))) {
    el.style.removeProperty(k);
  }
}
