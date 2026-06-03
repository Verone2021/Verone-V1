import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type { HistoriqueReportData } from '../types/historique-report';
import {
  styles,
  veroneColors,
  formatDate,
  formatDateTime,
  truncate,
} from './shared-styles';
import { VERONE_LOGO_BASE64 } from './logo-base64';
import { DonutChart, HorizontalBarChart } from './charts';

interface HistoriqueReportPdfProps {
  report: HistoriqueReportData;
}

// Sémantique : entrées en charcoal (positif/stable), sorties en rouge
// sémantique (signal critique conservé), ajustements en pearl (neutre).
const TYPE_COLORS: Record<string, string> = {
  'Entrees (IN)': veroneColors.charcoal,
  'Sorties (OUT)': '#C03030',
  'Ajustements (ADJUST)': veroneColors.pearl,
};

// Palette Vérone : dégradé charcoal → or → pearl pour motifs (8 nuances).
const REASON_COLORS = [
  veroneColors.charcoal,
  '#3D3D3A',
  veroneColors.goldDeep,
  veroneColors.gold,
  veroneColors.goldLight,
  '#C4B696',
  veroneColors.pearl,
  veroneColors.pearlSoft,
];

export function HistoriqueReportPdf({ report }: HistoriqueReportPdfProps) {
  // Prepare donut data from by_type
  const donutData = report.by_type.map(t => ({
    label: t.type,
    value: t.count,
    color: TYPE_COLORS[t.type] ?? '#6B7280',
  }));

  // Prepare bar chart data from top_reasons
  const barData = report.top_reasons.map((r, i) => ({
    label: r.description,
    value: r.count,
    color: REASON_COLORS[i] ?? '#16A34A',
    displayValue: `${r.count} mvts`,
  }));

  return (
    <Document>
      {/* Page 1: KPIs + Charts */}
      <Page size="A4" style={styles.page}>
        <View
          style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
        />
        {/* Header */}
        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: veroneColors.charcoal }]}>
            Rapport Historique Mouvements
          </Text>
          <Text style={styles.generatedAt}>
            Genere le {formatDateTime(report.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Resume</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total mouvements</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_movements}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Entrees</Text>
            <Text style={styles.metricValue}>{report.summary.total_in}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sorties</Text>
            <Text style={styles.metricValue}>{report.summary.total_out}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Variation nette</Text>
            <Text style={styles.metricValue}>
              {report.summary.net_change > 0 ? '+' : ''}
              {report.summary.net_change} unites
            </Text>
          </View>
        </View>

        {/* Charts Row: Donut + Horizontal Bars */}
        <Text style={styles.sectionTitle}>Analyse Visuelle</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Repartition IN / OUT / ADJUST</Text>
            <DonutChart
              data={donutData}
              size={130}
              innerRadius={35}
              centerLabel="Total"
              centerValue={String(report.summary.total_movements)}
            />
          </View>
          {barData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Top Motifs de mouvement</Text>
              <HorizontalBarChart data={barData} maxBars={8} barHeight={14} />
            </View>
          )}
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone Back Office - Historique Mouvements - Page ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Page 2: Movements detail */}
      {report.movements.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View
            style={[styles.accentBar, { backgroundColor: veroneColors.gold }]}
          />
          <Text style={styles.sectionTitle}>Detail des Mouvements</Text>

          <View
            style={[
              styles.tableHeader,
              { backgroundColor: veroneColors.charcoal },
            ]}
          >
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>
              Produit
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '10%', textAlign: 'center' },
              ]}
            >
              Type
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '8%', textAlign: 'center' },
              ]}
            >
              Qte
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '8%', textAlign: 'center' },
              ]}
            >
              Avant
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: '8%', textAlign: 'center' },
              ]}
            >
              Apres
            </Text>
            <Text style={[styles.tableHeaderCell, { width: '29%' }]}>
              Motif
            </Text>
          </View>
          {report.movements.slice(0, 50).map((m, index) => (
            <View
              key={`${m.performed_at}-${index}`}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {formatDate(m.performed_at)}
              </Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {truncate(m.product_name ?? 'N/A', 25)}
              </Text>
              <Text style={[styles.tableCellCenter, { width: '10%' }]}>
                {m.movement_type}
              </Text>
              <Text style={[styles.tableCellCenter, { width: '8%' }]}>
                {m.movement_type === 'OUT'
                  ? `-${m.quantity_change}`
                  : `+${m.quantity_change}`}
              </Text>
              <Text style={[styles.tableCellCenter, { width: '8%' }]}>
                {m.quantity_before}
              </Text>
              <Text style={[styles.tableCellCenter, { width: '8%' }]}>
                {m.quantity_after}
              </Text>
              <Text style={[styles.tableCell, { width: '29%' }]}>
                {truncate(m.reason_description ?? m.notes ?? '', 30)}
              </Text>
            </View>
          ))}

          <Text
            style={styles.footer}
            render={({ pageNumber, totalPages }) =>
              `Verone Back Office - Historique Mouvements - Page ${pageNumber}/${totalPages}`
            }
            fixed
          />
        </Page>
      )}
    </Document>
  );
}
