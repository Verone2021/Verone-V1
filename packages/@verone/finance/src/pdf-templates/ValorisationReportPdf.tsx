import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type { ValorisationReportData } from '../hooks/use-valorisation-report';
import {
  styles,
  veroneColors,
  formatCurrency,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';
import { DonutChart, HorizontalBarChart } from './charts';

interface ValorisationReportPdfProps {
  report: ValorisationReportData;
}

// Palette Vérone : or → goldDeep → goldLight → pearl pour catégories (8 nuances tonales)
const CATEGORY_COLORS = [
  veroneColors.charcoal,
  veroneColors.gold,
  veroneColors.goldDeep,
  veroneColors.goldLight,
  '#857149', // or muted
  veroneColors.pearl,
  '#C4C2BD', // pearl lighter
  veroneColors.pearlSoft,
];

// Distribution par tranche de valeur : dégradé charcoal → or
const VALUE_DIST_COLORS = [
  veroneColors.pearlSoft,
  veroneColors.pearl,
  veroneColors.goldLight,
  veroneColors.gold,
  veroneColors.goldDeep,
  veroneColors.charcoal,
];

export function ValorisationReportPdf({ report }: ValorisationReportPdfProps) {
  // Prepare donut data: top 7 categories + "Autres"
  const topCategories = report.by_category.slice(0, 7);
  const othersValue = report.by_category
    .slice(7)
    .reduce((sum, cat) => sum + cat.value, 0);

  const donutData = topCategories.map((cat, i) => ({
    label: cat.name,
    value: cat.value,
    color: CATEGORY_COLORS[i] ?? '#9CA3AF',
  }));

  if (othersValue > 0) {
    donutData.push({
      label: 'Autres',
      value: othersValue,
      color: CATEGORY_COLORS[7] ?? '#9CA3AF',
    });
  }

  // Prepare bar chart data from value_distribution
  const barData = report.value_distribution.map((range, i) => ({
    label: range.label,
    value: range.count,
    color: VALUE_DIST_COLORS[i] ?? '#3B82F6',
    displayValue: `${range.count} produits`,
  }));

  return (
    <Document>
      {/* Page 1: Metrics + Charts */}
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: veroneColors.charcoal }]}>
            Rapport Valorisation Stock
          </Text>
          {report.snapshot_at ? (
            <Text
              style={[
                styles.generatedAt,
                {
                  color: veroneColors.goldDeep,
                  fontFamily: 'Montserrat',
                  fontWeight: 600,
                },
              ]}
            >
              Snapshot au{' '}
              {new Date(report.snapshot_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}{' '}
              · Généré le {formatDateTime(report.generated_at)}
            </Text>
          ) : (
            <Text style={styles.generatedAt}>
              Stock courant · Généré le {formatDateTime(report.generated_at)}
            </Text>
          )}
        </View>
        <View style={styles.separator} />

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Metriques Globales</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Valeur totale (cout revient)</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.total_value_cost_net)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Valeur (prix achat HT)</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.total_value_cost_price)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Nb produits en stock</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_products}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Cout moyen</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.average_unit_cost, 2)}
            </Text>
          </View>
        </View>

        {/* Charts Row: Donut + Horizontal Bars */}
        <Text style={styles.sectionTitle}>Analyse Visuelle</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Repartition par categorie</Text>
            <DonutChart
              data={donutData}
              size={130}
              innerRadius={35}
              centerLabel="Total"
              centerValue={formatCurrency(report.summary.total_value_cost_net)}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              Distribution par tranche de valeur
            </Text>
            <HorizontalBarChart data={barData} barHeight={16} />
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone Back Office - Rapport Valorisation Stock - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2: Top 20 */}
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />
        <Text style={styles.sectionTitle}>Top 20 - Produits par Valeur</Text>

        <View
          style={[
            styles.tableHeader,
            { backgroundColor: veroneColors.charcoal },
          ]}
        >
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>
            Produit
          </Text>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>SKU</Text>
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
              { width: '15%', textAlign: 'right' },
            ]}
          >
            Cout Unit.
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '15%', textAlign: 'right' },
            ]}
          >
            Valeur
          </Text>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>
            Categorie
          </Text>
        </View>
        {report.top_20_by_value.map((product, index) => (
          <View
            key={product.id}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '30%' }]}>
              {truncate(product.name, 30)}
            </Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>
              {product.sku}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '10%' }]}>
              {product.stock_real}
            </Text>
            <Text style={[styles.tableCellRight, { width: '15%' }]}>
              {formatCurrency(product.unit_cost, 2)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '15%' }]}>
              {formatCurrency(product.value)}
            </Text>
            <Text style={[styles.tableCell, { width: '15%' }]}>
              {truncate(product.subcategory_name, 15)}
            </Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone Back Office - Rapport Valorisation Stock - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
