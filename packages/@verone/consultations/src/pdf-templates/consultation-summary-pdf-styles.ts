/**
 * Styles locaux pour ConsultationSummaryPdf.
 * Séparés du composant principal pour respecter la limite de 400 lignes.
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import { StyleSheet } from '@react-pdf/renderer';

import { veroneColors } from '@verone/finance/pdf-templates';

// ── Local styles ───────────────────────────────────────────────────
export const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  logoBlock: {
    flexDirection: 'column',
  },
  logoImage: {
    height: 32,
    objectFit: 'contain' as const,
    marginBottom: 4,
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  docNumber: {
    fontSize: 8,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  docDate: {
    fontSize: 8,
    color: veroneColors.charcoal,
    marginTop: 2,
  },
  // Two-column header (Vérone | Client)
  partyRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 18,
  },
  partyCol: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 6.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  partyLine: {
    fontSize: 9,
    color: veroneColors.charcoal,
    lineHeight: 1.5,
  },
  partyLineBold: {
    fontSize: 9.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginBottom: 2,
  },
  // Description / notes
  descriptionBox: {
    padding: 10,
    backgroundColor: '#FBFAF7',
    borderLeftWidth: 2,
    borderLeftColor: veroneColors.gold,
    paddingLeft: 12,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 8.5,
    color: veroneColors.charcoal,
    lineHeight: 1.55,
  },
  // Product cards
  productCard: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: veroneColors.pearlSoft,
    paddingVertical: 8,
  },
  productImage: {
    width: 72,
    height: 72,
    objectFit: 'cover',
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: veroneColors.pearlSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImagePlaceholderText: {
    fontSize: 6.5,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 10,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
    marginBottom: 2,
  },
  productSku: {
    fontSize: 7.5,
    color: veroneColors.pearl,
    marginBottom: 6,
  },
  productMetaRow: {
    flexDirection: 'row',
    gap: 18,
  },
  productMetaItem: {
    flexDirection: 'column',
  },
  productMetaLabel: {
    fontSize: 6,
    color: veroneColors.pearl,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  productMetaValue: {
    fontSize: 9,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.charcoal,
  },
  productMetaValueGold: {
    fontSize: 9.5,
    fontFamily: 'Montserrat',
    fontWeight: 600,
    color: veroneColors.gold,
  },
  productNotes: {
    fontSize: 7.5,
    color: veroneColors.pearl,
    marginTop: 6,
    // Pas d'italique : seules Montserrat 400/600 et Bodoni Moda 700 sont
    // enregistrees (pdf-fonts.ts), et @react-pdf refuse de generer le
    // document entier des qu'une fonte demandee manque (constate le 17/09 :
    // « Could not resolve font for Montserrat, fontWeight 400, fontStyle
    // italic » — la proposition client ne sortait plus). La distinction
    // visuelle passe par la taille et la couleur.
  },
  freeBadge: {
    fontSize: 6,
    color: veroneColors.charcoal,
    backgroundColor: veroneColors.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    fontFamily: 'Montserrat',
    fontWeight: 600,
  },
  emptyText: {
    fontSize: 8,
    color: veroneColors.pearl,
    // Pas d'italique : seules Montserrat 400/600 et Bodoni Moda 700 sont
    // enregistrees (pdf-fonts.ts), et @react-pdf refuse de generer le
    // document entier des qu'une fonte demandee manque (constate le 17/09 :
    // « Could not resolve font for Montserrat, fontWeight 400, fontStyle
    // italic » — la proposition client ne sortait plus). La distinction
    // visuelle passe par la taille et la couleur.
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Conditions
  conditionsBlock: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#FBFAF7',
  },
  conditionsLine: {
    fontSize: 7.5,
    color: veroneColors.charcoal,
    lineHeight: 1.5,
    marginBottom: 2,
  },
});
