/**
 * Styles locaux pour ConsultationMarginReportPdf.
 * Séparés du composant principal pour respecter la limite de 400 lignes.
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { StyleSheet } from '@react-pdf/renderer';

import { veroneColors } from '@verone/finance/pdf-templates';

export const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logoImage: {
    height: 26,
    objectFit: 'contain' as const,
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 6.5,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  metaValue: {
    fontSize: 8.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginTop: 2,
  },
  // Client strip
  clientStrip: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FBFAF7',
    borderLeftWidth: 2,
    borderLeftColor: veroneColors.gold,
    marginBottom: 14,
  },
  clientStripCol: {
    flex: 1,
  },
  clientStripLabel: {
    fontSize: 6,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  clientStripValue: {
    fontSize: 8.5,
    color: veroneColors.charcoal,
    lineHeight: 1.4,
  },
  clientStripValueBold: {
    fontSize: 9,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
  },
  // KPI cards Vérone (or accent)
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: veroneColors.gold,
    backgroundColor: '#FBFAF7',
  },
  kpiCardCharcoal: {
    flex: 1,
    padding: 8,
    backgroundColor: veroneColors.charcoal,
  },
  kpiCardWarn: {
    flex: 1,
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: '#C03030',
    backgroundColor: '#FFF6F4',
  },
  kpiLabel: {
    fontSize: 6,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 3,
    color: veroneColors.pearl,
  },
  kpiLabelOnDark: {
    fontSize: 6,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 3,
    color: veroneColors.gold,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
  },
  kpiValueOnDark: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.white,
  },
  kpiValueWarn: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: '#C03030',
  },
  // Table
  table: { marginBottom: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: veroneColors.charcoal,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: veroneColors.pearlSoft,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 6.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  td: { fontSize: 7.5, color: veroneColors.charcoal },
  tdBold: {
    fontSize: 7.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
  },
  tdGold: {
    fontSize: 7.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.gold,
  },
  tdRed: {
    fontSize: 7.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: '#C03030',
  },
  // Analysis block
  analysisBlock: {
    padding: 10,
    backgroundColor: '#FBFAF7',
    borderLeftWidth: 2,
    borderLeftColor: veroneColors.gold,
  },
  analysisTitle: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  analysisLine: {
    fontSize: 7.5,
    color: veroneColors.charcoal,
    marginBottom: 1.5,
    lineHeight: 1.4,
  },
});
