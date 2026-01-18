import { Inter } from 'next/font/google';

/**
 * Inter Font Configuration - Vérone Back Office
 *
 * Next.js 15 automatically downloads and self-hosts Google Fonts
 * during build. Configuration includes:
 * - Subset optimization for latin characters
 * - Font display swap for performance
 * - Preload enabled for critical rendering path
 * - Fallback to system fonts if download fails
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial', 'sans-serif'],
  adjustFontFallback: true,
  variable: '--font-inter',
});
