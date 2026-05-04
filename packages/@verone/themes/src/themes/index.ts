import type { BrandSlug, BrandTokens } from '../types';
import { veroneTokens } from './verone/tokens';
import { boemiaTokens } from './boemia/tokens';
import { solarTokens } from './solar/tokens';
import { flosTokens } from './flos/tokens';
import { linkmeTokens } from './linkme/tokens';
import { officeTokens } from './office/tokens';

/**
 * Registre central des thèmes par marque.
 * null = placeholder (tokens à remplir dans BO-DS-002).
 * ThemeProvider gère le cas null sans crash.
 */
export const themeRegistry: Record<BrandSlug, BrandTokens | null> = {
  verone: veroneTokens,
  boemia: boemiaTokens,
  solar: solarTokens,
  flos: flosTokens,
  linkme: linkmeTokens,
  office: officeTokens,
};
