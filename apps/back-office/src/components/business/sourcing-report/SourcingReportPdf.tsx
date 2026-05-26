import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import {
  styles,
  colors,
  formatCurrency,
  formatDateTime,
  truncate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import type { SourcingReportData } from './use-sourcing-report';

// Or Vérone (charte brand foundation)
const ACCENT = { primary: '#C9A961', light: '#FAF5E8', dark: '#8B6914' };

interface SourcingReportPdfProps {
  report: SourcingReportData;
}

export function SourcingReportPdf({ report }: SourcingReportPdfProps) {
  const totalDistribution = report.status_distribution.reduce(
    (sum, s) => sum + s.count,
    0
  );

  return (
    <Document>
      {/* Page 1 — Synthèse */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.accentBar, { backgroundColor: ACCENT.primary }]} />

        <View style={styles.headerContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={VERONE_LOGO_BASE64} style={styles.logoImage} />
          <Text style={[styles.reportTitle, { color: ACCENT.dark }]}>
            Rapport Sourcing
          </Text>
          <Text style={styles.generatedAt}>
            Genere le {formatDateTime(report.summary.generated_at)}
          </Text>
        </View>
        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Metriques globales</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Produits en sourcing</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_products}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avec fournisseur</Text>
            <Text style={styles.metricValue}>
              {report.summary.total_with_supplier}
            </Text>
            <Text style={{ fontSize: 8, color: colors.gray500, marginTop: 2 }}>
              {report.summary.total_products > 0
                ? `${Math.round(
                    (report.summary.total_with_supplier /
                      report.summary.total_products) *
                      100
                  )}%`
                : '—'}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Prix achat moyen</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.avg_cost_price)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Prix cible moyen</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(report.summary.avg_target_price)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Distribution par etape</Text>
        <View
          style={{
            backgroundColor: colors.gray50,
            padding: 10,
            borderRadius: 4,
          }}
        >
          {report.status_distribution.map(s => {
            const pct =
              totalDistribution > 0 ? (s.count / totalDistribution) * 100 : 0;
            return (
              <View key={s.status} style={{ marginBottom: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 9, color: colors.gray700 }}>
                    {s.label}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.gray900 }}>
                    {s.count} ({pct.toFixed(1)}%)
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: colors.gray200,
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      width: `${pct}%`,
                      height: 6,
                      backgroundColor: ACCENT.primary,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Page>

      {/* Page 2 — Top fournisseurs + Top negociations */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.accentBar, { backgroundColor: ACCENT.primary }]} />

        <Text style={styles.sectionTitle}>
          Top fournisseurs (produits sources)
        </Text>
        {report.top_suppliers.length === 0 ? (
          <Text style={{ fontSize: 9, color: colors.gray500 }}>
            Aucun fournisseur lie pour le moment.
          </Text>
        ) : (
          <View>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.gray200,
                paddingBottom: 4,
                marginBottom: 4,
              }}
            >
              <Text style={{ flex: 2, fontSize: 8, color: colors.gray500 }}>
                Fournisseur
              </Text>
              <Text
                style={{
                  width: 60,
                  fontSize: 8,
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Produits
              </Text>
              <Text
                style={{
                  width: 80,
                  fontSize: 8,
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Prix moyen
              </Text>
            </View>
            {report.top_suppliers.map(s => (
              <View
                key={s.supplier_id}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 3,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.gray100,
                }}
              >
                <Text style={{ flex: 2, fontSize: 9, color: colors.gray900 }}>
                  {truncate(s.supplier_name, 50)}
                </Text>
                <Text
                  style={{
                    width: 60,
                    fontSize: 9,
                    color: colors.gray900,
                    textAlign: 'right',
                  }}
                >
                  {s.products_count}
                </Text>
                <Text
                  style={{
                    width: 80,
                    fontSize: 9,
                    color: colors.gray900,
                    textAlign: 'right',
                  }}
                >
                  {s.avg_quoted_price
                    ? formatCurrency(s.avg_quoted_price)
                    : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Top negociations (ecart prix d&apos;achat vs cible)
        </Text>
        {report.top_negotiations.length === 0 ? (
          <Text style={{ fontSize: 9, color: colors.gray500 }}>
            Aucune negociation chiffree pour le moment.
          </Text>
        ) : (
          <View>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: colors.gray200,
                paddingBottom: 4,
                marginBottom: 4,
              }}
            >
              <Text style={{ flex: 2, fontSize: 8, color: colors.gray500 }}>
                Produit
              </Text>
              <Text
                style={{
                  width: 70,
                  fontSize: 8,
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Achat
              </Text>
              <Text
                style={{
                  width: 70,
                  fontSize: 8,
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Cible
              </Text>
              <Text
                style={{
                  width: 60,
                  fontSize: 8,
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Marge
              </Text>
            </View>
            {report.top_negotiations.map(n => (
              <View
                key={n.product_id}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 3,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.gray100,
                }}
              >
                <Text style={{ flex: 2, fontSize: 9, color: colors.gray900 }}>
                  {truncate(n.product_name, 50)}
                </Text>
                <Text
                  style={{
                    width: 70,
                    fontSize: 9,
                    color: colors.gray900,
                    textAlign: 'right',
                  }}
                >
                  {formatCurrency(n.cost_price ?? 0)}
                </Text>
                <Text
                  style={{
                    width: 70,
                    fontSize: 9,
                    color: colors.gray900,
                    textAlign: 'right',
                  }}
                >
                  {formatCurrency(n.target_price ?? 0)}
                </Text>
                <Text
                  style={{
                    width: 60,
                    fontSize: 9,
                    color: ACCENT.dark,
                    textAlign: 'right',
                  }}
                >
                  {n.delta !== null ? `${n.delta.toFixed(1)}%` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
