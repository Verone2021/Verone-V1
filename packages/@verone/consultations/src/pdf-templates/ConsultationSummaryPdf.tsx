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
  veroneColors,
  veroneStyles,
  formatVeronePrice,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import type { ClientConsultation } from '../hooks/use-consultations';
import type { ConsultationItem } from '../hooks/use-consultations';
import type { ConsultationImage } from '../hooks/use-consultation-images';

// ── Client info shape (mirror of resolveClientInfo) ──────────────────
export interface ConsultationPdfClientInfo {
  legalName: string | null;
  tradeName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  siret: string | null;
  vatNumber: string | null;
}

// ── Local styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
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
    fontStyle: 'italic',
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
    fontStyle: 'italic',
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

// ── Helpers ────────────────────────────────────────────────────────
function formatAddress(info: ConsultationPdfClientInfo): string[] {
  const lines: string[] = [];
  if (info.addressLine1) lines.push(info.addressLine1);
  const cityLine = [info.postalCode, info.city].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (info.country && info.country !== 'FR') lines.push(info.country);
  return lines;
}

// ── Props ──────────────────────────────────────────────────────────
export interface ConsultationSummaryPdfProps {
  consultation: ClientConsultation;
  items: ConsultationItem[];
  images: ConsultationImage[];
  totalHT: number;
  clientName: string;
  clientInfo?: ConsultationPdfClientInfo | null;
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
  clientInfo,
  preloadedImages,
}: ConsultationSummaryPdfProps) {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const proposalRef = `PROP-${consultation.id.slice(0, 8).toUpperCase()}`;
  const productBase64 = preloadedImages?.productImages ?? {};
  const tvaRate =
    consultation.tva_rate != null ? Number(consultation.tva_rate) : 0;
  const tvaAmount = (totalHT * tvaRate) / 100;
  const totalTTC = totalHT + tvaAmount;

  // Fallback minimal si pas de clientInfo pré-chargé
  const info: ConsultationPdfClientInfo = clientInfo ?? {
    legalName: null,
    tradeName: clientName,
    displayName: clientName,
    email: consultation.client_email ?? null,
    phone: consultation.client_phone ?? null,
    addressLine1: null,
    postalCode: null,
    city: null,
    country: null,
    siret: null,
    vatNumber: null,
  };

  const addressLines = formatAddress(info);

  return (
    <Document>
      <Page size="A4" style={veroneStyles.page}>
        {/* Accent bar Vérone (or) */}
        <View style={veroneStyles.accentBarGold} />

        {/* Header : logo + numéro proposition */}
        <View style={s.headerRow}>
          <View style={s.logoBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={VERONE_LOGO_BASE64} style={s.logoImage} />
            <Text style={s.docNumber}>Proposition commerciale</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.docNumber}>Référence</Text>
            <Text
              style={[s.docDate, { fontFamily: 'Montserrat', fontWeight: 600 }]}
            >
              {proposalRef}
            </Text>
            <Text style={[s.docDate, { marginTop: 6 }]}>Émis le {now}</Text>
          </View>
        </View>

        <Text style={veroneStyles.title}>Proposition commerciale</Text>
        <Text style={veroneStyles.subtitle}>
          Sélection éditoriale pour {clientName}
        </Text>

        <View style={veroneStyles.ruleGold} />

        {/* Two-column : Émetteur Vérone | Destinataire client */}
        <View style={s.partyRow}>
          <View style={s.partyCol}>
            <Text style={s.partyTitle}>Émetteur</Text>
            <Text style={s.partyLineBold}>Vérone</Text>
            <Text style={s.partyLine}>Concept store</Text>
            <Text style={s.partyLine}>
              Décoration & mobilier d&apos;intérieur
            </Text>
            <Text style={[s.partyLine, { marginTop: 4 }]}>
              contact@veronecollections.fr
            </Text>
          </View>
          <View style={s.partyCol}>
            <Text style={s.partyTitle}>Destinataire</Text>
            {info.legalName ? (
              <Text style={s.partyLineBold}>{info.legalName}</Text>
            ) : (
              <Text style={s.partyLineBold}>{info.displayName}</Text>
            )}
            {info.tradeName && info.tradeName !== info.legalName ? (
              <Text style={s.partyLine}>{info.tradeName}</Text>
            ) : null}
            {addressLines.map((line, i) => (
              <Text key={i} style={s.partyLine}>
                {line}
              </Text>
            ))}
            {info.email ? (
              <Text style={[s.partyLine, { marginTop: 4 }]}>{info.email}</Text>
            ) : null}
            {info.phone ? <Text style={s.partyLine}>{info.phone}</Text> : null}
            {info.siret ? (
              <Text
                style={[
                  s.partyLine,
                  { marginTop: 4, color: veroneColors.pearl, fontSize: 7.5 },
                ]}
              >
                SIRET {info.siret}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Description / contexte client */}
        {consultation.descriptif ? (
          <>
            <Text style={veroneStyles.sectionTitleEyebrow}>Demande</Text>
            <View style={s.descriptionBox}>
              <Text style={s.descriptionText}>{consultation.descriptif}</Text>
            </View>
          </>
        ) : null}

        {/* Produits — version client : prix de vente uniquement */}
        <Text style={veroneStyles.sectionTitleEyebrow}>
          Sélection ({items.length})
        </Text>

        {items.length === 0 ? (
          <Text style={s.emptyText}>
            Aucun produit dans cette proposition pour le moment.
          </Text>
        ) : (
          <View>
            {items.map(item => {
              const unitPrice = item.unit_price ?? 0;
              const lineTotal = item.is_free ? 0 : unitPrice * item.quantity;

              return (
                <View key={item.id} style={s.productCard} wrap={false}>
                  {productBase64[item.product_id] ? (
                    /* eslint-disable-next-line jsx-a11y/alt-text */
                    <Image
                      src={productBase64[item.product_id]}
                      style={s.productImage}
                    />
                  ) : (
                    <View style={s.productImagePlaceholder}>
                      <Text style={s.productImagePlaceholderText}>
                        Sans visuel
                      </Text>
                    </View>
                  )}

                  <View style={s.productDetails}>
                    <Text style={s.productName}>
                      {item.product?.name ?? 'Produit'}
                    </Text>
                    <Text style={s.productSku}>
                      Réf. {item.product?.sku ?? '—'}
                    </Text>

                    <View style={s.productMetaRow}>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Quantité</Text>
                        <Text style={s.productMetaValue}>
                          {String(item.quantity)}
                        </Text>
                      </View>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Prix HT</Text>
                        <Text style={s.productMetaValue}>
                          {item.is_free
                            ? 'Offert'
                            : formatVeronePrice(unitPrice, 2)}
                        </Text>
                      </View>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Total HT</Text>
                        <Text style={s.productMetaValueGold}>
                          {item.is_free ? '—' : formatVeronePrice(lineTotal, 2)}
                        </Text>
                      </View>
                    </View>

                    {item.is_free ? (
                      <Text style={s.freeBadge}>Offert</Text>
                    ) : null}

                    {item.notes ? (
                      <Text style={s.productNotes}>{item.notes}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Totaux */}
            <View style={[veroneStyles.totalBarPearl, { marginTop: 14 }]}>
              <Text style={veroneStyles.totalLabelPearl}>Total HT</Text>
              <Text style={veroneStyles.totalValuePearl}>
                {formatVeronePrice(totalHT, 2)}
              </Text>
            </View>
            {tvaRate > 0 && (
              <View style={veroneStyles.totalBarPearl}>
                <Text style={veroneStyles.totalLabelPearl}>
                  TVA ({String(consultation.tva_rate)} %)
                </Text>
                <Text style={veroneStyles.totalValuePearl}>
                  {formatVeronePrice(tvaAmount, 2)}
                </Text>
              </View>
            )}
            <View style={veroneStyles.totalBarCharcoal}>
              <Text style={veroneStyles.totalLabelCharcoal}>
                {tvaRate > 0 ? 'Total TTC' : 'Total'}
              </Text>
              <Text style={veroneStyles.totalValueCharcoal}>
                {formatVeronePrice(totalTTC, 2)}
              </Text>
            </View>
          </View>
        )}

        {/* Conditions */}
        <View style={s.conditionsBlock}>
          <Text style={[s.partyTitle, { marginBottom: 4 }]}>Conditions</Text>
          <Text style={s.conditionsLine}>
            · Proposition valable 30 jours à compter de la date d&apos;émission
          </Text>
          <Text style={s.conditionsLine}>
            · Prix indiqués hors taxes, sauf mention contraire
          </Text>
          <Text style={s.conditionsLine}>
            · Disponibilité confirmée à la validation de la commande
          </Text>
        </View>

        {/* Footer fixe */}
        <View style={veroneStyles.footer} fixed>
          <Text style={veroneStyles.footerText}>
            Vérone — {proposalRef} — {formatDate(consultation.created_at)}
          </Text>
          <Text
            style={veroneStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${String(pageNumber)} / ${String(totalPages)}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
