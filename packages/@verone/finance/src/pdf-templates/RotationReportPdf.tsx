import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type { RotationReportData } from '../hooks/use-rotation-report';
import {
  styles,
  veroneColors,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';
import { DonutChart, HorizontalBarChart } from './charts';

interface RotationReportPdfProps {
  report: RotationReportData;
}

// Palette FSN Vérone : Fast = charcoal (sain), Slow = or (intermédiaire),
// Non-moving = rouge sémantique (signal critique = capital immobilisé qui dort)
const FSN_COLORS: Record<'F' | 'S' | 'N', string> = {
  F: veroneColors.charcoal,
  S: veroneColors.gold,
  N: '#C03030',
};

function formatTurnover(value: number): string {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(1)}×`;
}

function formatDaysOfStock(days: number): string {
  if (!isFinite(days)) return '∞';
  if (days > 999) return '> 999 j';
  return `${Math.round(days)} j`;
}

export function RotationReportPdf({ report }: RotationReportPdfProps) {
  const donutData = report.by_class.map(c => ({
    label: c.label,
    value: c.count,
    color: FSN_COLORS[c.class],
  }));

  const cogsBarData = report.by_class.map(c => ({
    label: c.label,
    value: c.cogs,
    color: FSN_COLORS[c.class],
    displayValue: formatCurrency(c.cogs),
  }));

  return (
    <Document>
      {/* Page 1 : KPIs + Charts + Classification FSN */}
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />

        {/* Header */}
        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: veroneColors.charcoal }]}>
            Rapport Rotation des Stocks
          </Text>
          <Text style={styles.generatedAt}>
            Période du {formatDate(report.summary.period_from)} au{' '}
            {formatDate(report.summary.period_to)} ({report.summary.period_days}{' '}
            j) · Généré le {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Métriques Globales</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Produits analysés</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_products_analyzed}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>CA HT vendu (période)</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.total_cogs_period)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Rotation moyenne (an)</Text>
            <Text style={styles.metricValue}>
              {formatTurnover(report.summary.average_turnover_ratio)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Capital immobilisé dormant</Text>
            <Text style={[styles.metricValue, { color: '#C03030' }]}>
              {formatCurrency(report.summary.immobilized_in_non_moving)}
            </Text>
            <Text style={styles.metricSubtext}>
              {report.summary.non_moving_count} produits Non-moving
            </Text>
          </View>
        </View>

        {/* Charts */}
        <Text style={styles.sectionTitle}>Analyse Visuelle</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Classification FSN</Text>
            <DonutChart
              data={donutData}
              size={130}
              innerRadius={35}
              centerLabel="Total"
              centerValue={String(report.summary.total_products_analyzed)}
            />
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              CA HT par classe (sur la période)
            </Text>
            <HorizontalBarChart data={cogsBarData} barHeight={16} />
          </View>
        </View>

        {/* Classification table */}
        <Text style={styles.sectionTitle}>Détail par classe</Text>
        <View
          style={[
            styles.tableHeader,
            { backgroundColor: veroneColors.charcoal },
          ]}
        >
          <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Classe</Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '15%', textAlign: 'center' },
            ]}
          >
            Produits
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '20%', textAlign: 'right' },
            ]}
          >
            Unités vendues
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '17%', textAlign: 'right' },
            ]}
          >
            CA HT
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: '18%', textAlign: 'right' },
            ]}
          >
            Immobilisé
          </Text>
        </View>
        {report.by_class.map((c, index) => (
          <View
            key={c.class}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text
              style={[
                styles.tableCellBold,
                { width: '30%', color: FSN_COLORS[c.class] },
              ]}
            >
              {c.label}
            </Text>
            <Text style={[styles.tableCellCenter, { width: '15%' }]}>
              {c.count}
            </Text>
            <Text style={[styles.tableCellRight, { width: '20%' }]}>
              {formatNumber(c.units_sold)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '17%' }]}>
              {formatCurrency(c.cogs)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '18%' }]}>
              {formatCurrency(c.immobilized)}
            </Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Vérone — Rapport Rotation des Stocks — Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2 : Top 20 Fast Movers */}
      {report.fast_movers.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />
          <Text style={styles.sectionTitle}>
            Top 20 — Produits à plus forte rotation (Fast)
          </Text>

          <View
            style={[
              styles.tableHeader,
              { backgroundColor: veroneColors.charcoal },
            ]}
          >
            <Text style={[styles.tableHeaderCell, { width: '34%' }]}>
              Produit
            </Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>SKU</Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '12%', textAlign: 'center' },
              ]}
            >
              Stock
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '13%', textAlign: 'right' },
              ]}
            >
              Vendu pér.
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '13%', textAlign: 'right' },
              ]}
            >
              Rotation/an
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '14%', textAlign: 'right' },
              ]}
            >
              Jours stock
            </Text>
          </View>
          {report.fast_movers.map((p, index) => (
            <View
              key={p.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCell, { width: '34%' }]}>
                {truncate(p.name, 38)}
              </Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>{p.sku}</Text>
              <Text style={[styles.tableCellCenter, { width: '12%' }]}>
                {p.stock_real}
              </Text>
              <Text style={[styles.tableCellRight, { width: '13%' }]}>
                {p.units_sold_period}
              </Text>
              <Text
                style={[
                  styles.tableCellRight,
                  { width: '13%', color: FSN_COLORS.F },
                ]}
              >
                {formatTurnover(p.turnover_ratio_annual)}
              </Text>
              <Text style={[styles.tableCellRight, { width: '14%' }]}>
                {formatDaysOfStock(p.days_of_stock)}
              </Text>
            </View>
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Rotation des Stocks — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}

      {/* Page 3 : Top 20 Non-movers (capital dormant) */}
      {report.non_movers.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />
          <Text style={styles.sectionTitle}>
            Top 20 — Capital dormant (Non-moving avec stock {'>'} 0)
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: veroneColors.pearl,
              marginBottom: 8,
            }}
          >
            Ces produits n&apos;ont pas tourné ou très peu sur la période. Ils
            immobilisent du capital sans le faire fructifier.
          </Text>

          <View
            style={[
              styles.tableHeader,
              { backgroundColor: veroneColors.charcoal },
            ]}
          >
            <Text style={[styles.tableHeaderCell, { width: '34%' }]}>
              Produit
            </Text>
            <Text style={[styles.tableHeaderCell, { width: '14%' }]}>SKU</Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '12%', textAlign: 'center' },
              ]}
            >
              Stock
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '14%', textAlign: 'right' },
              ]}
            >
              Coût unit.
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '13%', textAlign: 'right' },
              ]}
            >
              Vendu pér.
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '13%', textAlign: 'right' },
              ]}
            >
              Immobilisé
            </Text>
          </View>
          {report.non_movers.map((p, index) => (
            <View
              key={p.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCell, { width: '34%' }]}>
                {truncate(p.name, 38)}
              </Text>
              <Text style={[styles.tableCell, { width: '14%' }]}>{p.sku}</Text>
              <Text style={[styles.tableCellCenter, { width: '12%' }]}>
                {p.stock_real}
              </Text>
              <Text style={[styles.tableCellRight, { width: '14%' }]}>
                {formatCurrency(p.cost_price, 2)}
              </Text>
              <Text style={[styles.tableCellRight, { width: '13%' }]}>
                {p.units_sold_period}
              </Text>
              <Text
                style={[
                  styles.tableCellRight,
                  { width: '13%', color: FSN_COLORS.N },
                ]}
              >
                {formatCurrency(p.immobilized_value)}
              </Text>
            </View>
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Rotation des Stocks — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
