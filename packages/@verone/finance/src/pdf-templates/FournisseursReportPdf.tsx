import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type {
  FournisseursReportData,
  SupplierLevel,
  SupplierPerformance,
} from '../hooks/use-fournisseurs-report';
import {
  styles,
  veroneColors,
  formatCurrency,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';

interface FournisseursReportPdfProps {
  report: FournisseursReportData;
}

const LEVEL_COLOR: Record<SupplierLevel, string> = {
  excellent: '#047857',
  good: '#1E40AF',
  warning: veroneColors.goldDeep,
  critical: '#C03030',
  insufficient_data: veroneColors.pearl,
};

const LEVEL_LABEL: Record<SupplierLevel, string> = {
  excellent: 'Excellent',
  good: 'Bon',
  warning: 'À surveiller',
  critical: 'Critique',
  insufficient_data: 'Données insuffisantes',
};

function formatPct(value: number): string {
  return `${value.toFixed(1)} %`;
}

function formatDelay(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return '0 j';
  return `${Math.round(days)} j`;
}

function SupplierRow({
  s,
  index,
  showQualityIndex = true,
}: {
  s: SupplierPerformance;
  index: number;
  showQualityIndex?: boolean;
}) {
  const namePrefix = s.preferred_supplier ? '★ ' : '';
  return (
    <View style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
      <Text style={[styles.tableCell, { width: '26%' }]}>
        {namePrefix}
        {truncate(s.supplier_name, 30)}
      </Text>
      <Text style={[styles.tableCell, { width: '12%' }]}>
        {s.supplier_segment ?? '—'}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '8%' }]}>
        {s.po_count}
      </Text>
      <Text style={[styles.tableCellRight, { width: '14%' }]}>
        {formatCurrency(s.total_spent_ttc)}
      </Text>
      <Text
        style={[
          styles.tableCellCenter,
          { width: '10%', color: LEVEL_COLOR[s.level] },
        ]}
      >
        {formatDelay(s.avg_delay_days)}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '10%' }]}>
        {formatPct(s.conformity_rate)}
      </Text>
      <Text style={[styles.tableCellCenter, { width: '10%' }]}>
        {formatPct(s.missing_qty_rate)}
      </Text>
      {showQualityIndex && (
        <Text
          style={[
            styles.tableCellCenter,
            {
              width: '10%',
              color: LEVEL_COLOR[s.level],
              fontFamily: 'Helvetica-Bold',
            },
          ]}
        >
          {s.quality_index.toFixed(0)}
        </Text>
      )}
    </View>
  );
}

function TableHeaderRow({
  showQualityIndex = true,
}: {
  showQualityIndex?: boolean;
}) {
  return (
    <View
      style={[styles.tableHeader, { backgroundColor: veroneColors.charcoal }]}
    >
      <Text style={[styles.tableHeaderCell, { width: '26%' }]}>
        Fournisseur
      </Text>
      <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Segment</Text>
      <Text
        style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}
      >
        PO
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '14%', textAlign: 'right' }]}
      >
        Dépensé
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}
      >
        Délai
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}
      >
        Conformité
      </Text>
      <Text
        style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}
      >
        Manquant
      </Text>
      {showQualityIndex && (
        <Text
          style={[
            styles.tableHeaderCell,
            { width: '10%', textAlign: 'center' },
          ]}
        >
          Quality
        </Text>
      )}
    </View>
  );
}

function SectionBlock({
  title,
  subtitle,
  suppliers,
  level,
  showQualityIndex = true,
}: {
  title: string;
  subtitle?: string;
  suppliers: SupplierPerformance[];
  level: SupplierLevel;
  showQualityIndex?: boolean;
}) {
  if (suppliers.length === 0) return null;
  return (
    <>
      <Text
        style={[
          styles.sectionTitle,
          { color: LEVEL_COLOR[level], marginTop: 12 },
        ]}
      >
        {title} ({suppliers.length})
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 8,
            color: veroneColors.pearl,
            marginBottom: 6,
          }}
        >
          {subtitle}
        </Text>
      )}
      <TableHeaderRow showQualityIndex={showQualityIndex} />
      {suppliers.map((s, i) => (
        <SupplierRow
          key={s.supplier_id}
          s={s}
          index={i}
          showQualityIndex={showQualityIndex}
        />
      ))}
    </>
  );
}

export function FournisseursReportPdf({ report }: FournisseursReportPdfProps) {
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
            Rapport Performance Fournisseurs
          </Text>
          <Text style={styles.generatedAt}>
            Période : {report.summary.period_from} → {report.summary.period_to}{' '}
            ({report.summary.period_days} jours) · Généré le{' '}
            {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* KPIs */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Fournisseurs</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_suppliers}
            </Text>
            <Text style={styles.metricSubtext}>
              {report.summary.total_po} PO
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: LEVEL_COLOR.excellent },
            ]}
          >
            <Text style={styles.metricLabel}>Excellents</Text>
            <Text
              style={[styles.metricValue, { color: LEVEL_COLOR.excellent }]}
            >
              {report.summary.excellent_count}
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { borderLeftWidth: 3, borderLeftColor: LEVEL_COLOR.critical },
            ]}
          >
            <Text style={styles.metricLabel}>Critiques</Text>
            <Text style={[styles.metricValue, { color: LEVEL_COLOR.critical }]}>
              {report.summary.critical_count}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Délai moyen global</Text>
            <Text style={styles.metricValue}>
              {formatDelay(report.summary.avg_delay_global)}
            </Text>
            <Text style={styles.metricSubtext}>
              Dépensé : {formatCurrency(report.summary.total_spent_ttc)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Répartition des niveaux</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(
            ['excellent', 'good', 'warning', 'critical'] as SupplierLevel[]
          ).map(lvl => {
            const count =
              lvl === 'excellent'
                ? report.summary.excellent_count
                : lvl === 'good'
                  ? report.summary.good_count
                  : lvl === 'warning'
                    ? report.summary.warning_count
                    : report.summary.critical_count;
            return (
              <View
                key={lvl}
                style={{
                  flex: 1,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: LEVEL_COLOR[lvl],
                  borderRadius: 4,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    color: LEVEL_COLOR[lvl],
                    fontFamily: 'Helvetica-Bold',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {LEVEL_LABEL[lvl]}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Helvetica-Bold',
                    color: LEVEL_COLOR[lvl],
                    marginTop: 2,
                  }}
                >
                  {count}
                </Text>
              </View>
            );
          })}
        </View>

        <SectionBlock
          title="Excellents — fournisseurs fiables"
          subtitle="Quality Index ≥ 85 et au moins 3 PO sur la période."
          suppliers={report.excellent}
          level="excellent"
        />

        <SectionBlock title="Bons" suppliers={report.good} level="good" />

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Vérone — Rapport Performance Fournisseurs — Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {(report.warning.length > 0 || report.critical.length > 0) && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />

          <SectionBlock
            title="À surveiller"
            subtitle="Quality Index entre 40 et 64. À challenger sur délais et quantités."
            suppliers={report.warning}
            level="warning"
          />

          <SectionBlock
            title="Critiques — action requise"
            subtitle="Quality Index < 40 ou délai moyen > 30 jours. Envisager un autre fournisseur."
            suppliers={report.critical}
            level="critical"
          />

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Performance Fournisseurs — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}

      {report.insufficient_data.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />

          <SectionBlock
            title="Données insuffisantes"
            subtitle="Moins de 2 PO reçues sur la période — pas de scoring."
            suppliers={report.insufficient_data}
            level="insufficient_data"
            showQualityIndex={false}
          />

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Vérone — Rapport Performance Fournisseurs — Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
