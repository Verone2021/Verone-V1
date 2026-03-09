import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';

import type { AgingReportData } from '../hooks/use-aging-report';
import {
  styles,
  colors,
  reportAccentColors,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  truncate,
} from './shared-styles';
import { DonutChart, HorizontalBarChart, ProgressGauge } from './charts';

interface AgingReportPdfProps {
  report: AgingReportData;
}

const BUCKET_COLORS: Record<
  string,
  { bg: string; text: string; chart: string }
> = {
  '0-30': { bg: colors.green100, text: colors.green800, chart: '#16A34A' },
  '31-60': { bg: colors.blue100, text: colors.blue800, chart: '#2563EB' },
  '61-90': { bg: colors.yellow100, text: colors.yellow800, chart: '#CA8A04' },
  '91-180': { bg: colors.orange100, text: colors.orange800, chart: '#EA580C' },
  '180+': { bg: colors.red100, text: colors.red800, chart: '#DC2626' },
};

export function AgingReportPdf({ report }: AgingReportPdfProps) {
  // Prepare chart data from buckets
  const donutData = report.buckets.map(bucket => ({
    label: bucket.label,
    value: bucket.value,
    color: BUCKET_COLORS[bucket.bucket_id]?.chart ?? '#6B7280',
  }));

  const barData = report.buckets.map(bucket => ({
    label: bucket.label,
    value: bucket.value,
    color: BUCKET_COLORS[bucket.bucket_id]?.chart ?? '#6B7280',
    displayValue: formatCurrency(bucket.value),
  }));

  return (
    <Document>
      {/* Page 1: Metrics + Charts + Distribution */}
      <Page size="A4" style={styles.page}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: reportAccentColors.aging.primary },
          ]}
        />
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.brand}>VERONE</Text>
          <Text style={styles.subtitle}>Back Office - CRM/ERP</Text>
          <Text
            style={[
              styles.reportTitle,
              { color: reportAccentColors.aging.dark },
            ]}
          >
            Rapport Aging Inventaire
          </Text>
          <Text style={styles.generatedAt}>
            Genere le {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Metriques Globales</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Produits analyses</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_products}
            </Text>
            <Text style={styles.metricSubtext}>
              {formatNumber(report.summary.total_quantity)} unites
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Valeur totale</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.total_value)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Age moyen</Text>
            <Text style={styles.metricValue}>
              {report.summary.average_age_days}j
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Stock vieilli (&gt;90j)</Text>
            <Text style={styles.metricValue}>
              {report.summary.percent_over_90_days}%
            </Text>
            <Text style={styles.metricSubtext}>
              {formatCurrency(report.summary.immobilized_value)} immobilises
            </Text>
          </View>
        </View>

        {/* Charts Row: Donut + Horizontal Bars */}
        <Text style={styles.sectionTitle}>Analyse Visuelle</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Repartition par tranche</Text>
            <DonutChart
              data={donutData}
              size={130}
              innerRadius={35}
              centerLabel="Total"
              centerValue={formatCurrency(report.summary.total_value)}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Valeur par tranche d&apos;age</Text>
            <HorizontalBarChart data={barData} barHeight={16} />
          </View>
        </View>

        {/* Gauge: % stock > 90 days */}
        <View style={{ marginTop: 4, marginBottom: 8 }}>
          <ProgressGauge
            value={report.summary.percent_over_90_days}
            label="Proportion du stock vieilli (> 90 jours)"
            thresholds={{ warning: 20, danger: 40 }}
          />
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone Back Office - Rapport Aging Inventaire - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2: Top 20 */}
      <Page size="A4" style={styles.page}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: reportAccentColors.aging.primary },
          ]}
        />
        <Text style={styles.sectionTitle}>
          Top 20 - Produits les Plus Anciens
        </Text>

        <View
          style={[
            styles.tableHeader,
            { backgroundColor: reportAccentColors.aging.dark },
          ]}
        >
          <Text style={[styles.tableHeaderCell, { width: '28%' }]}>
            Produit
          </Text>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>SKU</Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '10%', textAlign: 'center' },
            ]}
          >
            Age (j)
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '10%', textAlign: 'center' },
            ]}
          >
            Stock
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '17%', textAlign: 'right' },
            ]}
          >
            Valeur
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '10%', textAlign: 'center' },
            ]}
          >
            Tranche
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '10%', textAlign: 'center' },
            ]}
          >
            Dern. mvt
          </Text>
        </View>
        {report.top_oldest.map((product, index) => (
          <View
            key={product.id}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '28%' }]}>
              {truncate(product.name, 30)}
            </Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>
              {product.sku}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '10%' }]}>
              {product.age_days}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '10%' }]}>
              {product.stock_quantity}
            </Text>
            <Text style={[styles.tableCellRight, { width: '17%' }]}>
              {formatCurrency(product.value)}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '10%' }]}>
              {product.bucket}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '10%' }]}>
              {product.last_movement_date
                ? formatDate(product.last_movement_date)
                : 'Jamais'}
            </Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone Back Office - Rapport Aging Inventaire - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
