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
import type { ConsultationPdfClientInfo } from './ConsultationSummaryPdf';

const s = StyleSheet.create({
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

interface ConsultationMarginReportPdfProps {
  consultation: ClientConsultation;
  items: ConsultationItem[];
  clientName: string;
  clientInfo?: ConsultationPdfClientInfo | null;
}

export function ConsultationMarginReportPdf({
  consultation,
  items,
  clientName,
  clientInfo,
}: ConsultationMarginReportPdfProps) {
  // Sémantique : item.shipping_cost = TOTAL LIGNE (pas par unité)
  const getCostPrice = (item: ConsultationItem): number =>
    item.cost_price_override ?? item.product?.cost_price ?? 0;

  const getRevenue = (item: ConsultationItem): number => {
    if (item.is_free || item.is_sample) return 0;
    return (
      (item.unit_price ?? 0) * item.quantity + (item.selling_shipping_cost ?? 0)
    );
  };

  const getCostTotal = (item: ConsultationItem): number => {
    const goodsCost = getCostPrice(item) * item.quantity;
    if (item.is_sample) return goodsCost;
    return goodsCost + item.shipping_cost;
  };

  const getMargin = (item: ConsultationItem): number =>
    getRevenue(item) - getCostTotal(item);

  const getMarginPercent = (item: ConsultationItem): number => {
    const cost = getCostTotal(item);
    if (cost === 0) return 0;
    return ((getRevenue(item) - cost) / cost) * 100;
  };

  const totalRevenue = items.reduce((sum, i) => sum + getRevenue(i), 0);
  const totalCost = items.reduce((sum, i) => sum + getCostTotal(i), 0);
  const totalShipping = items.reduce(
    (sum, i) => (i.is_sample ? sum : sum + i.shipping_cost),
    0
  );
  const totalMargin = totalRevenue - totalCost;
  const totalMarginPercent =
    totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

  const reportRef = `MARGES-${consultation.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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

  return (
    <Document>
      <Page size="A4" style={veroneStyles.page}>
        <View style={veroneStyles.accentBarGold} />

        {/* Header */}
        <View style={s.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={VERONE_LOGO_BASE64} style={s.logoImage} />
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Rapport interne — Confidentiel</Text>
            <Text style={s.metaValue}>{reportRef}</Text>
            <Text
              style={[
                s.metaLabel,
                { marginTop: 4, textTransform: 'none', letterSpacing: 0 },
              ]}
            >
              Émis le {now}
            </Text>
          </View>
        </View>

        <Text style={veroneStyles.title}>Rapport de marges</Text>
        <Text style={veroneStyles.subtitle}>
          Analyse de rentabilité — {clientName}
        </Text>

        <View style={veroneStyles.ruleGold} />

        {/* Client strip — rappel destinataire + statut consultation */}
        <View style={s.clientStrip}>
          <View style={s.clientStripCol}>
            <Text style={s.clientStripLabel}>Client</Text>
            <Text style={s.clientStripValueBold}>
              {info.legalName ?? info.displayName}
            </Text>
            {info.tradeName && info.tradeName !== info.legalName ? (
              <Text style={s.clientStripValue}>{info.tradeName}</Text>
            ) : null}
            {info.email ? (
              <Text style={s.clientStripValue}>{info.email}</Text>
            ) : null}
          </View>
          <View style={s.clientStripCol}>
            <Text style={s.clientStripLabel}>Consultation</Text>
            <Text style={s.clientStripValue}>
              Créée le {formatDate(consultation.created_at)}
            </Text>
            <Text style={s.clientStripValue}>
              Statut : {consultation.status ?? 'en_attente'}
            </Text>
            <Text style={s.clientStripValue}>
              Priorité : {consultation.priority_level ?? 2} / 5
            </Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Chiffre d&apos;affaires</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalRevenue)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Coût total</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalCost)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Transport</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalShipping)}</Text>
          </View>
          <View style={totalMargin >= 0 ? s.kpiCardCharcoal : s.kpiCardWarn}>
            <Text style={totalMargin >= 0 ? s.kpiLabelOnDark : s.kpiLabel}>
              Bénéfice
            </Text>
            <Text style={totalMargin >= 0 ? s.kpiValueOnDark : s.kpiValueWarn}>
              {formatVeronePrice(totalMargin)}
            </Text>
          </View>
          <View
            style={
              totalMarginPercent >= 30
                ? s.kpiCardCharcoal
                : totalMarginPercent < 0
                  ? s.kpiCardWarn
                  : s.kpiCard
            }
          >
            <Text
              style={totalMarginPercent >= 30 ? s.kpiLabelOnDark : s.kpiLabel}
            >
              Taux de marge
            </Text>
            <Text
              style={
                totalMarginPercent >= 30
                  ? s.kpiValueOnDark
                  : totalMarginPercent < 0
                    ? s.kpiValueWarn
                    : s.kpiValue
              }
            >
              {totalMarginPercent.toFixed(1)} %
            </Text>
          </View>
        </View>

        {/* Table détaillée */}
        <Text style={veroneStyles.sectionTitleEyebrow}>
          Analyse détaillée des produits
        </Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: '22%' }]}>Produit</Text>
            <Text style={[s.th, { width: '11%' }]}>Fournisseur</Text>
            <Text style={[s.th, { width: '7%', textAlign: 'center' }]}>
              Qté
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Prix achat
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Transport
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Prix revient
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Prix vente
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Marge / u
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Marge tot.
            </Text>
          </View>

          {items.map(item => {
            const costPrice = getCostPrice(item);
            const shippingPerUnit = item.is_sample
              ? 0
              : item.shipping_cost / Math.max(1, item.quantity);
            const costPerUnit = costPrice + shippingPerUnit;
            const margin = getMargin(item);
            const marginPct = getMarginPercent(item);
            const isNegative = margin < 0;

            return (
              <View key={item.id} style={s.tableRow} wrap={false}>
                <View style={{ width: '22%' }}>
                  <Text style={s.tdBold}>
                    {item.product?.name ?? 'Produit'}
                  </Text>
                  <Text style={{ fontSize: 6, color: veroneColors.pearl }}>
                    {item.product?.sku}
                  </Text>
                </View>
                <Text style={[s.td, { width: '11%' }]}>
                  {item.product?.supplier_name ?? '—'}
                </Text>
                <Text style={[s.td, { width: '7%', textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {formatVeronePrice(costPrice, 2)}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {item.is_sample
                    ? '—'
                    : formatVeronePrice(item.shipping_cost, 2)}
                </Text>
                <Text style={[s.tdBold, { width: '10%', textAlign: 'right' }]}>
                  {formatVeronePrice(costPerUnit, 2)}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {item.is_free || item.is_sample
                    ? 'Offert'
                    : formatVeronePrice(item.unit_price ?? 0, 2)}
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGold,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatVeronePrice(margin / Math.max(1, item.quantity), 2)} (
                  {marginPct.toFixed(0)} %)
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGold,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatVeronePrice(margin, 2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Analyse */}
        <Text style={veroneStyles.sectionTitleEyebrow}>Analyse</Text>
        <View style={s.analysisBlock}>
          <Text style={s.analysisTitle}>Produits les plus rentables</Text>
          {items
            .filter(i => !i.is_free && !i.is_sample && getMarginPercent(i) > 0)
            .sort((a, b) => getMarginPercent(b) - getMarginPercent(a))
            .slice(0, 5)
            .map(item => (
              <Text key={item.id} style={s.analysisLine}>
                · {item.product?.name} — {getMarginPercent(item).toFixed(1)} % (
                {formatVeronePrice(getMargin(item), 2)})
              </Text>
            ))}
          {totalShipping > 0 && totalCost - totalShipping > 0 && (
            <Text style={[s.analysisLine, { marginTop: 6 }]}>
              Impact transport :{' '}
              {((totalShipping / (totalCost - totalShipping)) * 100).toFixed(1)}{' '}
              % du coût d&apos;achat
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={veroneStyles.footer} fixed>
          <Text style={veroneStyles.footerText}>
            Vérone — Rapport interne confidentiel — {reportRef}
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
