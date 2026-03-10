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
  styles as sharedStyles,
  formatCurrency,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

// ── Types ──────────────────────────────────────────────────────────

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  total_ht: number;
}

export interface QuoteData {
  document_number: string;
  document_date: string;
  validity_date: string | null;
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
  notes: string | null;
}

export interface QuoteSummaryPdfProps {
  quote: QuoteData;
  items: QuoteItem[];
  partnerName: string;
}

// ── Styles ─────────────────────────────────────────────────────────

const s = StyleSheet.create({
  accentBar: {
    height: 3,
    backgroundColor: colors.gray900,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logoImage: {
    height: 28,
    objectFit: 'contain' as const,
  },
  infoSection: {
    marginBottom: 8,
  },
  infoSectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray700,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  infoLabel: {
    width: '30%',
    fontSize: 7,
    color: colors.gray500,
  },
  infoValue: {
    width: '70%',
    fontSize: 7,
    color: colors.gray900,
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  twoColItem: {
    flex: 1,
  },
  notesBox: {
    padding: 8,
    backgroundColor: colors.gray50,
    borderRadius: 4,
    marginTop: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.gray400,
  },
  // Totals
  totalsContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 3,
    width: 200,
  },
  totalsLabel: {
    fontSize: 8,
    color: colors.gray500,
    width: 100,
  },
  totalsValue: {
    fontSize: 8,
    color: colors.gray900,
    textAlign: 'right',
    width: 100,
  },
  totalsTtcRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: 200,
    backgroundColor: colors.gray900,
    borderRadius: 4,
    marginTop: 4,
  },
  totalsTtcLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    width: 100,
  },
  totalsTtcValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'right',
    width: 100,
  },
});

// ── Sub-components ─────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ── Component ──────────────────────────────────────────────────────

export function QuoteSummaryPdf({
  quote,
  items,
  partnerName,
}: QuoteSummaryPdfProps) {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        {/* Accent bar */}
        <View style={s.accentBar} />

        {/* Header: Logo + Title */}
        <View style={s.headerRow}>
          <Image src={VERONE_LOGO_BASE64} style={s.logoImage} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>
              Devis {quote.document_number}
            </Text>
            <Text style={{ fontSize: 7, color: colors.gray500, marginTop: 2 }}>
              Genere le {now}
            </Text>
          </View>
        </View>

        <View style={sharedStyles.separator} />

        {/* Two-column layout: Client + Devis info */}
        <View style={s.twoColGrid}>
          {/* Client info */}
          <View style={s.twoColItem}>
            <Text style={s.infoSectionTitle}>Client</Text>
            <InfoRow label="Nom" value={partnerName} />
          </View>

          {/* Quote info */}
          <View style={s.twoColItem}>
            <Text style={s.infoSectionTitle}>Devis</Text>
            <InfoRow label="Numero" value={quote.document_number} />
            <InfoRow label="Date" value={formatDate(quote.document_date)} />
            {quote.validity_date ? (
              <InfoRow
                label="Validite"
                value={formatDate(quote.validity_date)}
              />
            ) : null}
          </View>
        </View>

        {/* Items table */}
        <Text style={[s.infoSectionTitle, { marginTop: 16 }]}>
          Lignes du devis ({String(items.length)})
        </Text>

        {/* Table header */}
        <View style={sharedStyles.tableHeader}>
          <Text style={[sharedStyles.tableHeaderCell, { width: '40%' }]}>
            Description
          </Text>
          <Text
            style={[
              sharedStyles.tableHeaderCell,
              { width: '12%', textAlign: 'center' },
            ]}
          >
            Qte
          </Text>
          <Text
            style={[
              sharedStyles.tableHeaderCell,
              { width: '16%', textAlign: 'right' },
            ]}
          >
            Prix unit. HT
          </Text>
          <Text
            style={[
              sharedStyles.tableHeaderCell,
              { width: '12%', textAlign: 'center' },
            ]}
          >
            TVA
          </Text>
          <Text
            style={[
              sharedStyles.tableHeaderCell,
              { width: '20%', textAlign: 'right' },
            ]}
          >
            Total HT
          </Text>
        </View>

        {/* Table rows */}
        {items.map((item, idx) => {
          const rowStyle =
            idx % 2 === 0 ? sharedStyles.tableRow : sharedStyles.tableRowAlt;
          return (
            <View key={item.id} style={rowStyle} wrap={false}>
              <Text style={[sharedStyles.tableCell, { width: '40%' }]}>
                {item.description}
              </Text>
              <Text style={[sharedStyles.tableCellCenter, { width: '12%' }]}>
                {String(item.quantity)}
              </Text>
              <Text style={[sharedStyles.tableCellRight, { width: '16%' }]}>
                {formatCurrency(item.unit_price_ht, 2)}
              </Text>
              <Text style={[sharedStyles.tableCellCenter, { width: '12%' }]}>
                {String(item.tva_rate)}%
              </Text>
              <Text style={[sharedStyles.tableCellRight, { width: '20%' }]}>
                {formatCurrency(item.total_ht, 2)}
              </Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={s.totalsContainer}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Total HT</Text>
            <Text style={s.totalsValue}>
              {formatCurrency(quote.total_ht, 2)}
            </Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>TVA</Text>
            <Text style={s.totalsValue}>
              {formatCurrency(quote.tva_amount, 2)}
            </Text>
          </View>
          <View style={s.totalsTtcRow}>
            <Text style={s.totalsTtcLabel}>Total TTC</Text>
            <Text style={s.totalsTtcValue}>
              {formatCurrency(quote.total_ttc, 2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes ? (
          <View style={[s.infoSection, { marginTop: 16 }]}>
            <Text style={s.infoSectionTitle}>Notes</Text>
            <View style={s.notesBox}>
              <Text style={{ fontSize: 7, lineHeight: 1.5 }}>
                {quote.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <Text
          style={sharedStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `Verone - Devis ${quote.document_number} - Page ${String(pageNumber)}/${String(totalPages)}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
