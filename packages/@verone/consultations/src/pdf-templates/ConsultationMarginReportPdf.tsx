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
  formatCurrency,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import type { ClientConsultation } from '../hooks/use-consultations';
import type { ConsultationItem } from '../hooks/use-consultations';

const s = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  accentBar: {
    height: 3,
    backgroundColor: '#000',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logo: { height: 28, objectFit: 'contain' as const },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  subtitle: { fontSize: 8, color: colors.gray500 },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  kpiLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.gray700,
  },
  table: { marginBottom: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray500,
    textTransform: 'uppercase' as const,
  },
  td: { fontSize: 7, color: '#1a1a1a' },
  tdBold: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  tdGreen: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  tdRed: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
  },
  footerText: { fontSize: 6, color: colors.gray500 },
});

interface ConsultationMarginReportPdfProps {
  consultation: ClientConsultation;
  items: ConsultationItem[];
  clientName: string;
}

export function ConsultationMarginReportPdf({
  consultation,
  items,
  clientName,
}: ConsultationMarginReportPdfProps) {
  // Sémantique : item.shipping_cost = TOTAL LIGNE (pas par unité). Cohérent
  // avec ConsultationOrderInterface (BO-CONSULT-FIX-002).
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

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />

        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Rapport Interne — Marges</Text>
            <Text style={s.subtitle}>
              Consultation: {clientName} •{' '}
              {formatDate(consultation.created_at ?? '')}
            </Text>
            <Text style={s.subtitle}>
              Statut: {consultation.status ?? 'en_attente'} • Priorité:{' '}
              {consultation.priority_level ?? 2}/5
            </Text>
          </View>
          {/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image component does not accept alt prop */}
          {VERONE_LOGO_BASE64 && (
            <Image src={VERONE_LOGO_BASE64} style={s.logo} />
          )}
          {/* eslint-enable jsx-a11y/alt-text */}
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View
            style={[
              s.kpiCard,
              { backgroundColor: '#eff6ff', borderLeftColor: '#3b82f6' },
            ]}
          >
            <Text style={[s.kpiLabel, { color: '#2563eb' }]}>
              Chiffre d&apos;affaires
            </Text>
            <Text style={[s.kpiValue, { color: '#1e3a5f' }]}>
              {formatCurrency(totalRevenue)}
            </Text>
          </View>
          <View
            style={[
              s.kpiCard,
              { backgroundColor: '#fef2f2', borderLeftColor: '#ef4444' },
            ]}
          >
            <Text style={[s.kpiLabel, { color: '#dc2626' }]}>Coût total</Text>
            <Text style={[s.kpiValue, { color: '#7f1d1d' }]}>
              {formatCurrency(totalCost)}
            </Text>
          </View>
          <View
            style={[
              s.kpiCard,
              { backgroundColor: '#fff7ed', borderLeftColor: '#f97316' },
            ]}
          >
            <Text style={[s.kpiLabel, { color: '#ea580c' }]}>Transport</Text>
            <Text style={[s.kpiValue, { color: '#7c2d12' }]}>
              {formatCurrency(totalShipping)}
            </Text>
          </View>
          <View
            style={[
              s.kpiCard,
              { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' },
            ]}
          >
            <Text style={[s.kpiLabel, { color: '#16a34a' }]}>Bénéfice</Text>
            <Text
              style={[
                s.kpiValue,
                { color: totalMargin >= 0 ? '#14532d' : '#7f1d1d' },
              ]}
            >
              {formatCurrency(totalMargin)}
            </Text>
          </View>
          <View
            style={[
              s.kpiCard,
              { backgroundColor: '#faf5ff', borderLeftColor: '#a855f7' },
            ]}
          >
            <Text style={[s.kpiLabel, { color: '#7c3aed' }]}>
              Taux de marge
            </Text>
            <Text
              style={[
                s.kpiValue,
                { color: totalMarginPercent >= 30 ? '#14532d' : '#7c2d12' },
              ]}
            >
              {totalMarginPercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Table détaillée */}
        <Text style={s.sectionTitle}>Analyse détaillée des produits</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: '22%' }]}>Produit</Text>
            <Text style={[s.th, { width: '10%' }]}>Fournisseur</Text>
            <Text style={[s.th, { width: '8%', textAlign: 'center' }]}>
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
              Marge/u
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Marge tot.
            </Text>
          </View>

          {items.map(item => {
            const costPrice = getCostPrice(item);
            // Prix de revient unitaire = achat unitaire + (transport ligne / qté)
            const shippingPerUnit = item.is_sample
              ? 0
              : item.shipping_cost / Math.max(1, item.quantity);
            const costPerUnit = costPrice + shippingPerUnit;
            const margin = getMargin(item);
            const marginPct = getMarginPercent(item);
            const isNegative = margin < 0;

            return (
              <View key={item.id} style={s.tableRow}>
                <View style={{ width: '22%' }}>
                  <Text style={s.tdBold}>
                    {item.product?.name ?? 'Produit'}
                  </Text>
                  <Text style={{ fontSize: 6, color: colors.gray500 }}>
                    {item.product?.sku}
                  </Text>
                </View>
                <Text style={[s.td, { width: '10%' }]}>
                  {item.product?.supplier_name ?? '—'}
                </Text>
                <Text style={[s.td, { width: '8%', textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {formatCurrency(costPrice)}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {item.is_sample ? '—' : formatCurrency(item.shipping_cost)}
                </Text>
                <Text style={[s.tdBold, { width: '10%', textAlign: 'right' }]}>
                  {formatCurrency(costPerUnit)}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {item.is_free || item.is_sample
                    ? 'Gratuit'
                    : formatCurrency(item.unit_price ?? 0)}
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGreen,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatCurrency(margin / item.quantity)} (
                  {marginPct.toFixed(0)}%)
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGreen,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatCurrency(margin)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Analyse */}
        <Text style={s.sectionTitle}>Analyse</Text>
        <View
          style={{
            padding: 8,
            backgroundColor: '#f0fdf4',
            borderRadius: 4,
            borderLeftWidth: 3,
            borderLeftColor: '#22c55e',
          }}
        >
          <Text
            style={{
              fontSize: 7,
              fontFamily: 'Helvetica-Bold',
              marginBottom: 4,
            }}
          >
            Produits rentables :
          </Text>
          {items
            .filter(i => !i.is_free && !i.is_sample && getMarginPercent(i) > 0)
            .sort((a, b) => getMarginPercent(b) - getMarginPercent(a))
            .map(item => (
              <Text key={item.id} style={{ fontSize: 7, marginBottom: 1 }}>
                • {item.product?.name}: {getMarginPercent(item).toFixed(1)}% (
                {formatCurrency(getMargin(item))})
              </Text>
            ))}
          {totalShipping > 0 && (
            <Text style={{ fontSize: 7, marginTop: 4 }}>
              Impact transport :{' '}
              {((totalShipping / (totalCost - totalShipping)) * 100).toFixed(1)}
              % du coût d&apos;achat
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Vérone — Rapport Interne Confidentiel
          </Text>
          <Text style={s.footerText}>
            Généré le {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
