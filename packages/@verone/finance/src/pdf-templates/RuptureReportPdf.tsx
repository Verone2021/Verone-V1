import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type {
  RuptureReportData,
  RuptureSeverity,
  ProductRupture,
} from '../hooks/use-rupture-report';
import {
  styles,
  veroneColors,
  formatCurrency,
  formatDate,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';

interface RuptureReportPdfProps {
  report: RuptureReportData;
}

const SEVERITY_COLOR: Record<RuptureSeverity, string> = {
  rupture: '#9F2A1E',
  critical: '#C03030',
  warning: veroneColors.goldDeep,
};

function formatDays(days: number): string {
  if (!isFinite(days)) return '∞';
  if (days <= 0) return '0 j';
  if (days > 999) return '> 999 j';
  return `${Math.round(days)} j`;
}

function formatVelocity(v: number): string {
  if (v <= 0) return '—';
  if (v >= 1) return `${v.toFixed(1)} / j`;
  return `${(v * 7).toFixed(1)} / sem`;
}

function ProductRow({ p, index }: { p: ProductRupture; index: number }) {
  return (
    <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
      <Text style={[styles.tableCell, { width: '30%' }]}>
        {truncate(p.name, 32)}
      </Text>
      <Text style={[styles.tableCell, { width: '12%' }]}>{p.sku}</Text>
      <Text
        style={[
          styles.tableCellCenter,
          {
            width: '8%',
            color: SEVERITY_COLOR[p.severity],
            fontFamily: 'Montserrat',
            fontWeight: 600,
          },
        ]}
      >
        {p.stock_real}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '8%' }]}>
        {p.min_stock}
      </Text>
      <Text style={[styles.tableCellRight, { width: '12%' }]}>
        {formatVelocity(p.velocity_per_day)}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '10%' }]}>
        {formatDays(p.days_until_stockout)}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '8%' }]}>
        {p.stock_forecasted_in > 0 ? `+${p.stock_forecasted_in}` : '—'}
      </Text>
      <Text
        style={[
          styles.tableCellRight,
          {
            width: '12%',
            color: SEVERITY_COLOR[p.severity],
            fontFamily: 'Montserrat',
            fontWeight: 600,
          },
        ]}
      >
        {formatCurrency(p.estimated_revenue_loss_30d)}
      </Text>
    </View>
  );
}

function TableHeader() {
  return (
    <View
      style={[styles.tableHeader, { backgroundColor: veroneColors.charcoal }]}
    >
      <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Produit</Text>
      <Text style={[styles.tableHeaderCell, { width: '12%' }]}>SKU</Text>
      <Text
        style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}
      >
        Stock
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}
      >
        Min
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}
      >
        Vélocité
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}
      >
        Jours restants
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}
      >
        En cmd
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '12%', textAlign: 'right' }]}
      >
        Perte CA 30j
      </Text>
    </View>
  );
}

export function RuptureReportPdf({ report }: RuptureReportPdfProps) {
  return (
    <Document>
      {/* Page 1 : KPIs + Ruptures + Critique */}
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />

        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: veroneColors.charcoal }]}>
            Rapport Ruptures de Stock
          </Text>
          <Text style={styles.generatedAt}>
            Vélocité calculée sur les 90 derniers jours · Généré le{' '}
            {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* KPIs */}
        <View style={styles.metricsRow}>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: SEVERITY_COLOR.rupture },
            ]}
          >
            <Text style={styles.metricLabel}>En rupture</Text>
            <Text
              style={[styles.metricValue, { color: SEVERITY_COLOR.rupture }]}
            >
              {report.summary.rupture_count}
            </Text>
            <Text style={styles.metricSubtext}>Stock = 0</Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: SEVERITY_COLOR.critical },
            ]}
          >
            <Text style={styles.metricLabel}>Critique</Text>
            <Text
              style={[styles.metricValue, { color: SEVERITY_COLOR.critical }]}
            >
              {report.summary.critical_count}
            </Text>
            <Text style={styles.metricSubtext}>Stock ≤ min</Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: SEVERITY_COLOR.warning },
            ]}
          >
            <Text style={styles.metricLabel}>À surveiller</Text>
            <Text
              style={[styles.metricValue, { color: SEVERITY_COLOR.warning }]}
            >
              {report.summary.warning_count}
            </Text>
            <Text style={styles.metricSubtext}>Stock ≤ point réappro</Text>
          </View>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: '#FFF6F4',
                borderColor: SEVERITY_COLOR.rupture,
              },
            ]}
          >
            <Text style={styles.metricLabel}>Perte CA estimée 30j</Text>
            <Text
              style={[styles.metricValue, { color: SEVERITY_COLOR.rupture }]}
            >
              {formatCurrency(report.summary.total_estimated_loss_30d)}
            </Text>
            <Text style={styles.metricSubtext}>
              Recovery en cmd :{' '}
              {formatCurrency(report.summary.total_immobilized_recovery)}
            </Text>
          </View>
        </View>

        {/* En rupture (le plus critique) */}
        {report.in_rupture.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              En rupture ({report.in_rupture.length})
            </Text>
            <TableHeader />
            {report.in_rupture.map((p, i) => (
              <ProductRow key={p.id} p={p} index={i} />
            ))}
          </>
        )}

        {/* Critique */}
        {report.critical.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Critique ({report.critical.length})
            </Text>
            <TableHeader />
            {report.critical.map((p, i) => (
              <ProductRow key={p.id} p={p} index={i} />
            ))}
          </>
        )}

        {report.in_rupture.length === 0 && report.critical.length === 0 && (
          <View
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: '#F0FDF4',
              borderRadius: 4,
              borderLeftWidth: 3,
              borderLeftColor: '#16A34A',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Montserrat',
                fontWeight: 600,
                color: '#14532D',
              }}
            >
              Aucune rupture ni stock critique. Bonne santé d&apos;inventaire.
            </Text>
          </View>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Vérone — Rapport Ruptures de Stock — Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2 : À surveiller */}
      {report.warning.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />
          <Text style={styles.sectionTitle}>
            À surveiller — Stock ≤ point de réappro ({report.warning.length})
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: veroneColors.pearl,
              marginBottom: 8,
            }}
          >
            Ces produits sont en dessous du point de réapprovisionnement. Lancer
            une commande fournisseur préventive si la vélocité confirme
            l&apos;intérêt.
          </Text>
          <TableHeader />
          {report.warning.map((p, i) => (
            <ProductRow key={p.id} p={p} index={i} />
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Ruptures de Stock — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}

// formatDate intentionally exported / kept for future period filters
export { formatDate };
