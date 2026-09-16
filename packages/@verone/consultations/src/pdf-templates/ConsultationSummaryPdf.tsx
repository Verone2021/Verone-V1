import React from 'react';

import { Document, Page, Text, View, Image } from '@react-pdf/renderer';

import {
  veroneColors,
  veroneStyles,
  formatVeronePrice,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import { s } from './consultation-summary-pdf-styles';

import type { ClientConsultation } from '../hooks/use-consultations';
import type { ConsultationItem } from '../hooks/use-consultations';
import type { ConsultationImage } from '../hooks/use-consultation-images';
import { filterClientVisibleItems } from '../lib/consultation-order-guards';
import {
  computeItemsEconomics,
  resolveConsultationTvaPercentage,
} from '../lib/consultation-economics-input';

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
  // Décision 2 BO-CONSULT-P2-001 : lignes refusées exclues du PDF client
  // Décision D5 (BO-PRODUCTS-P8-001) : lignes de produits retirés exclues aussi
  const activeItems = filterClientVisibleItems(items);
  // Total HT via totals.billed (décision 5 BO-CONSULT-P2-001 — source unique)
  const { totals: economics, byItemId: econByItemId } = computeItemsEconomics(
    activeItems,
    consultation
  );
  const computedTotalHT = economics.billed;
  const tvaRate = resolveConsultationTvaPercentage(consultation);
  const tvaAmount = (computedTotalHT * tvaRate) / 100;
  const totalTTC = computedTotalHT + tvaAmount;
  // Param totalHT conservé pour compatibilité appellants (unused en interne)
  void totalHT;

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
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer : pas d'attribut alt dans un PDF */}
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
          Sélection ({activeItems.length})
        </Text>

        {activeItems.length === 0 ? (
          <Text style={s.emptyText}>
            Aucun produit dans cette proposition pour le moment.
          </Text>
        ) : (
          <View>
            {activeItems.map(item => {
              const econ = econByItemId.get(item.id);
              // Prix saisi, sinon prix produit par la marge ; null → « À fixer »
              const unitPrice = econ?.unitPrice ?? item.unit_price;
              // billedAmount : 0 si gratuit ou prix non fixé (décision 5)
              const lineTotal =
                econ?.billedAmount && econ.billedAmount > 0
                  ? econ.billedAmount
                  : null;

              return (
                <View key={item.id} style={s.productCard} wrap={false}>
                  {productBase64[item.product_id] ? (
                    /* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer : pas d'attribut alt dans un PDF */
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
                            : unitPrice !== null
                              ? formatVeronePrice(unitPrice, 2)
                              : 'À fixer'}
                        </Text>
                      </View>
                      <View style={s.productMetaItem}>
                        <Text style={s.productMetaLabel}>Total HT</Text>
                        <Text style={s.productMetaValueGold}>
                          {lineTotal !== null
                            ? formatVeronePrice(lineTotal, 2)
                            : '—'}
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
                {formatVeronePrice(computedTotalHT, 2)}
              </Text>
            </View>
            {tvaRate > 0 && (
              <View style={veroneStyles.totalBarPearl}>
                <Text style={veroneStyles.totalLabelPearl}>
                  TVA ({tvaRate} %)
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
