import React from 'react';

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

import {
  colors,
  styles as sharedStyles,
  formatCurrency,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import type { ClientConsultation } from '../hooks/use-consultations';
import type { ConsultationItem } from '../hooks/use-consultations';
import type { ConsultationImage } from '../hooks/use-consultation-images';

// ── Local styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  accentBar: {
    height: 3,
    backgroundColor: colors.gray900,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logoImage: {
    height: 28,
    objectFit: 'contain' as const,
  },
  infoSection: {
    marginBottom: 8,
  },
  infoSectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  infoLabel: {
    width: '30%',
    fontSize: 7,
    color: colors.gray500,
  },
  infoValue: {
    width: '70%',
    fontSize: 7,
    color: colors.gray900,
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  twoColItem: {
    flex: 1,
  },
  descriptionBox: {
    padding: 8,
    backgroundColor: colors.gray50,
    borderRadius: 4,
    marginTop: 3,
  },
  notesBox: {
    padding: 8,
    backgroundColor: colors.gray50,
    borderRadius: 4,
    marginTop: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.gray400,
  },
  emptyText: {
    fontSize: 7,
    color: colors.gray500,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Product card layout
  productCard: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  productCardAlt: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: colors.gray50,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    objectFit: 'cover',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 7,
    color: colors.gray400,
    textAlign: 'center',
  },
  productDetails: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray900,
    marginBottom: 2,
  },
  productSku: {
    fontSize: 7,
    color: colors.gray500,
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  productMetaItem: {
    flexDirection: 'column',
  },
  productMetaLabel: {
    fontSize: 6,
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  productMetaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray900,
  },
  productNotes: {
    fontSize: 7,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: 4,
  },
  freeBadge: {
    fontSize: 6,
    color: colors.green800,
    backgroundColor: colors.green100,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  // Total footer
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray900,
    borderRadius: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginRight: 20,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
});

// ── Helpers ────────────────────────────────────────────────────────
function getStatusLabel(status: string): string {
  switch (status) {
    case 'en_attente':
      return 'En attente';
    case 'en_cours':
      return 'En cours';
    case 'terminee':
      return 'Terminee';
    case 'annulee':
      return 'Annulee';
    default:
      return status;
  }
}

function getPriorityLabel(level: number): string {
  switch (level) {
    case 5:
      return 'Tres urgent';
    case 4:
      return 'Urgent';
    case 3:
      return 'Normal+';
    case 2:
      return 'Normal';
    case 1:
      return 'Faible';
    default:
      return 'Normal';
  }
}

// ── Sub-components ────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ── Props ──────────────────────────────────────────────────────────
export interface ConsultationSummaryPdfProps {
  consultation: ClientConsultation;
  items: ConsultationItem[];
  images: ConsultationImage[];
  totalHT: number;
  clientName: string;
  preloadedImages?: {
    consultationImages: Array<{ id: string; base64: string }>;
    productImages: Record<string, string>;
  };
}

// ── Component ──────────────────────────────────────────────────────
export function ConsultationSummaryPdf({
  consultation,
  items,
  images: _images,
  totalHT,
  clientName,
  preloadedImages,
}: ConsultationSummaryPdfProps) {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Use preloaded base64 product images (much faster for PDF renderer)
  const productBase64 = preloadedImages?.productImages ?? {};

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Accent bar */}
        <View style={s.accentBar} />

        {/* Header: Logo + Title */}
        <View style={s.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={VERONE_LOGO_BASE64} style={s.logoImage} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>
              Resume Consultation
            </Text>
            <Text style={{ fontSize: 7, color: colors.gray500, marginTop: 2 }}>
              Genere le {now}
            </Text>
          </View>
        </View>

        <View style={sharedStyles.separator} />

        {/* Two-column layout: Client + Consultation */}
        <View style={s.twoColGrid}>
          {/* Client info */}
          <View style={s.twoColItem}>
            <Text style={s.infoSectionTitle}>Client</Text>
            <InfoRow label="Nom" value={clientName} />
            <InfoRow label="Email" value={consultation.client_email ?? '-'} />
            <InfoRow
              label="Telephone"
              value={consultation.client_phone ?? '-'}
            />
          </View>

          {/* Consultation info */}
          <View style={s.twoColItem}>
            <Text style={s.infoSectionTitle}>Consultation</Text>
            <InfoRow
              label="Statut"
              value={getStatusLabel(consultation.status)}
            />
            <InfoRow
              label="Priorite"
              value={getPriorityLabel(consultation.priority_level)}
            />
            <InfoRow
              label="Date creation"
              value={formatDate(consultation.created_at)}
            />
            <InfoRow
              label="Budget max."
              value={
                consultation.tarif_maximum
                  ? formatCurrency(consultation.tarif_maximum, 2)
                  : '-'
              }
            />
          </View>
        </View>

        {/* Description */}
        <View style={s.infoSection}>
          <Text style={[s.infoSectionTitle, { marginTop: 8 }]}>
            Description
          </Text>
          <View style={s.descriptionBox}>
            <Text style={{ fontSize: 7, lineHeight: 1.5 }}>
              {consultation.descriptif ?? 'Aucune description'}
            </Text>
          </View>
        </View>

        {/* Notes internes */}
        {consultation.notes_internes ? (
          <View style={s.infoSection}>
            <Text style={s.infoSectionTitle}>Notes internes</Text>
            <View style={s.notesBox}>
              <Text style={{ fontSize: 7, lineHeight: 1.5 }}>
                {consultation.notes_internes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Products — card layout with photos */}
        <Text style={[s.infoSectionTitle, { marginTop: 4 }]}>
          Produits ({items.length})
        </Text>

        {items.length === 0 ? (
          <Text style={s.emptyText}>
            Aucun produit associe a cette consultation
          </Text>
        ) : (
          <View>
            {items.map((item, idx) => {
              const unitPrice =
                item.unit_price ?? item.product?.cost_price ?? 0;
              const lineTotal = item.is_free ? 0 : unitPrice * item.quantity;
              const cardStyle =
                idx % 2 === 0 ? s.productCard : s.productCardAlt;

              return (
                <View key={item.id} style={cardStyle} wrap={false}>
                  {/* Product image (base64) */}
                  {productBase64[item.product_id] ? (
                    /* eslint-disable-next-line jsx-a11y/alt-text */
                    <Image
                      src={productBase64[item.product_id]}
                      style={s.productImage}
                    />
                  ) : (
                    <View style={s.productImagePlaceholder}>
                      <Text style={s.productImagePlaceholderText}>
                        Pas de{'\n'}photo
                      </Text>
                    </View>
                  )}

                  {/* Product details */}
                  <View style={s.productDetails}>
                    <Text style={s.productName}>
                      {item.product?.name ?? 'Produit inconnu'}
                    </Text>
                    <Text style={s.productSku}>{item.product?.sku ?? '-'}</Text>

                    <View style={s.productMeta}>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Quantite</Text>
                        <Text style={s.productMetaValue}>
                          {String(item.quantity)}
                        </Text>
                      </View>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Prix unitaire</Text>
                        <Text style={s.productMetaValue}>
                          {formatCurrency(unitPrice, 2)}
                        </Text>
                      </View>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Total</Text>
                        <Text style={s.productMetaValue}>
                          {formatCurrency(lineTotal, 2)}
                        </Text>
                      </View>
                    </View>

                    {item.is_free ? (
                      <Text style={s.freeBadge}>GRATUIT</Text>
                    ) : null}

                    {item.notes ? (
                      <Text style={s.productNotes}>{item.notes}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Total bar */}
            <View style={s.totalBar}>
              <Text style={s.totalLabel}>Total HT</Text>
              <Text style={s.totalValue}>{formatCurrency(totalHT, 2)}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text
          style={sharedStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone - Resume Consultation - Page ${String(pageNumber)}/${String(totalPages)}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
