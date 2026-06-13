import { StyleSheet } from '@react-pdf/renderer';

import { registerVeronePdfFonts } from './pdf-fonts';

// Enregistre les polices de marque (Bodoni Moda titres + Montserrat texte)
// dès l'import de ce module, importé par 100 % des templates PDF.
registerVeronePdfFonts();

export const colors = {
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray900: '#111827',
  green100: '#DCFCE7',
  green800: '#166534',
  blue100: '#DBEAFE',
  blue800: '#1E40AF',
  yellow100: '#FEF9C3',
  yellow800: '#854D0E',
  orange100: '#FFEDD5',
  orange800: '#9A3412',
  red100: '#FEE2E2',
  red800: '#991B1B',
} as const;

export const reportAccentColors = {
  aging: { primary: '#EA580C', light: '#FFF7ED', dark: '#9A3412' },
  valorisation: { primary: '#2563EB', light: '#EFF6FF', dark: '#1E40AF' },
  historique: { primary: '#16A34A', light: '#F0FDF4', dark: '#166534' },
} as const;

/**
 * Palette Vérone (cf. docs/brand/DESIGN-SYSTEM-VERONE.md).
 * À utiliser pour tous les PDFs front-of-house (client-facing) et docs internes.
 */
export const veroneColors = {
  gold: '#C9A961',
  goldDeep: '#B8954A',
  goldLight: '#D4B86E',
  charcoal: '#1d1d1b',
  white: '#FFFFFF',
  pearl: '#9B9B98',
  pearlSoft: '#E6E5E2',
  rule: 'rgba(29,29,27,0.12)',
  ruleDark: 'rgba(255,255,255,0.12)',
} as const;

/**
 * Styles partagés Vérone — hiérarchie éditoriale (eyebrows UPPERCASE letter-spaced,
 * accent or, séparateurs charcoal). Polices de marque : Bodoni Moda (titres) +
 * Montserrat (texte), enregistrées via `pdf-fonts.ts` (BO-PDF-FONTS-001).
 */
export const veroneStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Montserrat',
    color: veroneColors.charcoal,
    backgroundColor: veroneColors.white,
  },
  // Gold accent bar (top of page)
  accentBarGold: {
    height: 3,
    backgroundColor: veroneColors.gold,
    marginBottom: 14,
  },
  // Eyebrow label — Montserrat 500 UPPERCASE letter-spacing 0.32em
  eyebrow: {
    fontSize: 7,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
    marginBottom: 4,
  },
  // Document title — Bodoni Moda 700
  title: {
    fontSize: 22,
    fontFamily: 'Bodoni Moda',
    fontWeight: 700,
    color: veroneColors.charcoal,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 9,
    color: veroneColors.pearl,
    marginTop: 4,
  },
  // Section heading
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitleEyebrow: {
    fontSize: 6.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 6,
  },
  // Rule (hairline)
  rule: {
    borderBottomWidth: 0.5,
    borderBottomColor: veroneColors.pearlSoft,
    marginVertical: 8,
  },
  ruleGold: {
    borderBottomWidth: 0.5,
    borderBottomColor: veroneColors.gold,
    marginVertical: 8,
  },
  // Client info block (header)
  clientBlock: {
    padding: 10,
    backgroundColor: veroneColors.white,
    borderLeftWidth: 2,
    borderLeftColor: veroneColors.gold,
    paddingLeft: 12,
  },
  clientBlockLine: {
    fontSize: 8.5,
    color: veroneColors.charcoal,
    lineHeight: 1.5,
  },
  clientBlockLegal: {
    fontSize: 9.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginBottom: 2,
  },
  // Total bars
  totalBarCharcoal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: veroneColors.charcoal,
    marginTop: 4,
  },
  totalBarPearl: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: veroneColors.pearlSoft,
    marginTop: 0,
  },
  totalLabelCharcoal: {
    fontSize: 9,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginRight: 20,
  },
  totalValueCharcoal: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.gold,
    letterSpacing: 0.5,
  },
  totalLabelPearl: {
    fontSize: 8,
    color: veroneColors.charcoal,
    marginRight: 20,
  },
  totalValuePearl: {
    fontSize: 9,
    color: veroneColors.charcoal,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: veroneColors.pearlSoft,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6.5,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
});

/**
 * Format prix EUR style Vérone : "2 480 €" (espace insécable difficile en PDF,
 * on utilise espace normal). Conserve formatCurrency() pour compat.
 */
export function formatVeronePrice(value: number, decimals = 0): string {
  return `${formatNumber(value, decimals)} €`;
}

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Montserrat',
    color: colors.gray900,
  },
  // Header
  headerContainer: {
    marginBottom: 20,
  },
  logoImage: {
    height: 35,
    objectFit: 'contain' as const,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Bodoni Moda',
    fontWeight: 700,
    marginTop: 12,
  },
  generatedAt: {
    fontSize: 8,
    color: colors.gray500,
    marginTop: 4,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginTop: 8,
    marginBottom: 16,
  },
  // Accent bar (colored strip at top of page)
  accentBar: {
    height: 4,
    marginBottom: 12,
  },
  // Sections
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    marginBottom: 8,
    marginTop: 16,
  },
  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
    backgroundColor: colors.gray50,
  },
  metricLabel: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: 600,
  },
  metricSubtext: {
    fontSize: 7,
    color: colors.gray400,
    marginTop: 2,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.black,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.gray50,
  },
  tableCell: {
    fontSize: 8,
  },
  tableCellRight: {
    fontSize: 8,
    textAlign: 'right',
  },
  tableCellCenter: {
    fontSize: 8,
    textAlign: 'center',
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    fontWeight: 600,
  },
  // Charts layout
  chartRow: {
    flexDirection: 'row' as const,
    gap: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  chartContainer: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: colors.gray400,
  },
});

/**
 * Format number with regular spaces as thousands separator.
 * toLocaleString('fr-FR') uses non-breaking thin spaces (U+202F)
 * that don't render in @react-pdf/renderer, so we use manual formatting.
 */
export function formatNumber(value: number, decimals = 0): string {
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart ? `${withSpaces},${decPart}` : withSpaces;
}

export function formatCurrency(value: number, decimals = 0): string {
  return `${formatNumber(value, decimals)} EUR`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('fr-FR');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
