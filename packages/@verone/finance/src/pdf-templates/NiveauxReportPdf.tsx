import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type {
  NiveauxReportData,
  ProductLevel,
  StockLevel,
} from '../hooks/use-niveaux-report';
import {
  styles,
  veroneColors,
  formatCurrency,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';
import { DonutChart } from './charts';

interface NiveauxReportPdfProps {
  report: NiveauxReportData;
}

const LEVEL_COLOR: Record<StockLevel, string> = {
  critical: '#C03030',
  warning: veroneColors.goldDeep,
  healthy: veroneColors.charcoal,
  overstock: veroneColors.pearl,
};

const LEVEL_LABEL: Record<StockLevel, string> = {
  critical: 'Critique (≤ min)',
  warning: 'À surveiller (≤ réappro)',
  healthy: 'Sain',
  overstock: 'Surstock (> 180j couv.)',
};

function formatDays(days: number): string {
  if (!isFinite(days)) return '∞';
  if (days <= 0) return '0 j';
  if (days > 999) return '> 999 j';
  return `${Math.round(days)} j`;
}

function ProductRow({ p, index }: { p: ProductLevel; index: number }) {
  return (
    <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
      <Text style={[styles.tableCell, { width: '32%' }]}>
        {truncate(p.name, 34)}
      </Text>
      <Text style={[styles.tableCell, { width: '12%' }]}>{p.sku}</Text>
      <Text
        style={[
          styles.tableCellCenter,
          {
            width: '9%',
            color: LEVEL_COLOR[p.level],
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
      <Text style={[styles.tableCellCenter, { width: '9%' }]}>
        {p.reorder_point}
      </Text>
      <Text style={[styles.tableCellRight, { width: '10%' }]}>
        {p.velocity_per_day > 0 ? p.velocity_per_day.toFixed(2) : '—'}
      </Text>
      <Text
        style={[
          styles.tableCellCenter,
          { width: '10%', color: LEVEL_COLOR[p.level] },
        ]}
      >
        {formatDays(p.days_of_coverage)}
      </Text>
      <Text style={[styles.tableCellRight, { width: '10%' }]}>
        {formatCurrency(p.immobilized_value)}
      </Text>
    </View>
  );
}

function TableHeader() {
  return (
    <View
      style={[styles.tableHeader, { backgroundColor: veroneColors.charcoal }]}
    >
      <Text style={[styles.tableHeaderCell, { width: '32%' }]}>Produit</Text>
      <Text style={[styles.tableHeaderCell, { width: '12%' }]}>SKU</Text>
      <Text
        style={[styles.tableHeaderCell, { width: '9%', textAlign: 'center' }]}
      >
        Stock
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}
      >
        Min
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '9%', textAlign: 'center' }]}
      >
        Réappro
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}
      >
        Véloc / j
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}
      >
        Couverture
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'right' }]}
      >
        Immobilisé
      </Text>
    </View>
  );
}

export function NiveauxReportPdf({ report }: NiveauxReportPdfProps) {
  const donutData: { label: string; value: number; color: string }[] = [
    {
      label: LEVEL_LABEL.critical,
      value: report.summary.critical_count,
      color: LEVEL_COLOR.critical,
    },
    {
      label: LEVEL_LABEL.warning,
      value: report.summary.warning_count,
      color: LEVEL_COLOR.warning,
    },
    {
      label: LEVEL_LABEL.healthy,
      value: report.summary.healthy_count,
      color: LEVEL_COLOR.healthy,
    },
    {
      label: LEVEL_LABEL.overstock,
      value: report.summary.overstock_count,
      color: LEVEL_COLOR.overstock,
    },
  ].filter(d => d.value > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />

        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: veroneColors.charcoal }]}>
            Rapport Niveaux de Stock
          </Text>
          <Text style={styles.generatedAt}>
            Vélocité calculée sur les 90 derniers jours · Généré le{' '}
            {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* KPIs */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Produits analysés</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_products}
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: LEVEL_COLOR.critical },
            ]}
          >
            <Text style={styles.metricLabel}>Critique</Text>
            <Text style={[styles.metricValue, { color: LEVEL_COLOR.critical }]}>
              {report.summary.critical_count}
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: LEVEL_COLOR.warning },
            ]}
          >
            <Text style={styles.metricLabel}>À surveiller</Text>
            <Text style={[styles.metricValue, { color: LEVEL_COLOR.warning }]}>
              {report.summary.warning_count}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Couverture moyenne</Text>
            <Text style={styles.metricValue}>
              {formatDays(report.summary.avg_days_of_coverage)}
            </Text>
            <Text style={styles.metricSubtext}>
              Immobilisé : {formatCurrency(report.summary.total_immobilized)}
            </Text>
          </View>
        </View>

        {/* Donut */}
        <Text style={styles.sectionTitle}>Répartition des niveaux</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartContainer}>
            <DonutChart
              data={donutData}
              size={140}
              innerRadius={40}
              centerLabel="Total"
              centerValue={String(report.summary.total_products)}
            />
          </View>
          <View
            style={[
              styles.chartContainer,
              { padding: 16, justifyContent: 'center' },
            ]}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: 'Montserrat',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Légende
            </Text>
            {donutData.map(d => (
              <View
                key={d.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 2,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: d.color,
                    marginRight: 6,
                  }}
                />
                <Text style={{ fontSize: 8, color: veroneColors.charcoal }}>
                  {d.label} : {d.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Critique en priorité */}
        {report.critical.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Critique — Action immédiate ({report.critical.length})
            </Text>
            <TableHeader />
            {report.critical.slice(0, 25).map((p, i) => (
              <ProductRow key={p.id} p={p} index={i} />
            ))}
          </>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Vérone — Rapport Niveaux de Stock — Page ${pageNumber}/${totalPages}`
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
            À surveiller ({report.warning.length}) — préparer un réappro
          </Text>
          <TableHeader />
          {report.warning.slice(0, 30).map((p, i) => (
            <ProductRow key={p.id} p={p} index={i} />
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Niveaux de Stock — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}

      {/* Page 3 : Surstock (capital dort) */}
      {report.overstock.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />
          <Text style={styles.sectionTitle}>
            Surstock ({report.overstock.length}) — plus de 180 jours de
            couverture
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: veroneColors.pearl,
              marginBottom: 8,
            }}
          >
            Ces produits ont du stock pour plus de 6 mois à la vélocité
            actuelle. Capital immobilisé qui pourrait être réalloué.
          </Text>
          <TableHeader />
          {report.overstock.map((p, i) => (
            <ProductRow key={p.id} p={p} index={i} />
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Niveaux de Stock — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
