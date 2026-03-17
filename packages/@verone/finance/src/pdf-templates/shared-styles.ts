import { StyleSheet } from '@react-pdf/renderer';

// Register Helvetica (built-in, no custom font needed)
// @react-pdf/renderer includes Helvetica by default

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

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
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
