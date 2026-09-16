import React from 'react';

import { Document, Page, Text, View, Image } from '@react-pdf/renderer';

import {
  veroneColors,
  veroneStyles,
  formatVeronePrice,
  formatDate,
  VERONE_LOGO_BASE64,
} from '@verone/finance/pdf-templates';

import type { ClientConsultation } from '../hooks/use-consultations';
import type { ConsultationItem } from '../hooks/use-consultations';
import type { ConsultationPdfClientInfo } from './ConsultationSummaryPdf';
import { filterActiveItems } from '../lib/consultation-order-guards';
import { computeItemsEconomics } from '../lib/consultation-economics-input';
import { isCandidateLine } from '../lib/consultation-line-status';
import type { SupplierCostInput } from '../lib/consultation-supplier-costs';
import { s } from './consultation-margin-report-pdf-styles';

interface ConsultationMarginReportPdfProps {
  consultation: ClientConsultation;
  items: ConsultationItem[];
  clientName: string;
  clientInfo?: ConsultationPdfClientInfo | null;
  /** Frais saisis par fournisseur — inclus dans le prix de revient. */
  supplierCosts?: SupplierCostInput[];
}

export function ConsultationMarginReportPdf({
  consultation,
  items,
  clientName,
  clientInfo,
  supplierCosts = [],
}: ConsultationMarginReportPdfProps) {
  // Décision 2 BO-CONSULT-P2-001 : lignes refusées exclues du rapport marges
  const activeItems = filterActiveItems(items);

  // Économie via fonction canonique B2 (formules § B2 du plan)
  const {
    totals: economics,
    byItemId: econByItemId,
    suppliers: supplierEconomics,
  } = computeItemsEconomics(activeItems, consultation, supplierCosts);

  // Noms de fournisseurs — le calcul ne connaît que leurs identifiants
  const supplierNameById = new Map<string, string>();
  for (const item of activeItems) {
    const supplierId = item.product?.supplier_id;
    if (supplierId && !supplierNameById.has(supplierId)) {
      supplierNameById.set(
        supplierId,
        item.product?.supplier_name ?? 'Fournisseur'
      );
    }
  }

  // Écart au budget annoncé par le client (tarif_maximum), s'il existe
  const clientBudget =
    consultation.tarif_maximum != null
      ? Number(consultation.tarif_maximum)
      : null;
  const budgetGap =
    clientBudget !== null ? economics.billed - clientBudget : null;

  const totalRevenue = economics.revenue;
  const totalCost = economics.cost;
  const totalShipping = economics.fees;
  const totalMargin = economics.margin;
  const totalMarginPercent = economics.marginPercent ?? 0;

  const reportRef = `MARGES-${consultation.id.slice(0, 8).toUpperCase()}`;
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const info: ConsultationPdfClientInfo = clientInfo ?? {
    legalName: null,
    tradeName: clientName,
    displayName: clientName,
    email: consultation.client_email ?? null,
    phone: consultation.client_phone ?? null,
    addressLine1: null,
    postalCode: null,
    city: null,
    country: null,
    siret: null,
    vatNumber: null,
  };

  return (
    <Document>
      <Page size="A4" style={veroneStyles.page}>
        <View style={veroneStyles.accentBarGold} />

        {/* Header */}
        <View style={s.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer : pas d'attribut alt dans un PDF */}
          <Image src={VERONE_LOGO_BASE64} style={s.logoImage} />
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Rapport interne — Confidentiel</Text>
            <Text style={s.metaValue}>{reportRef}</Text>
            <Text
              style={[
                s.metaLabel,
                { marginTop: 4, textTransform: 'none', letterSpacing: 0 },
              ]}
            >
              Émis le {now}
            </Text>
          </View>
        </View>

        <Text style={veroneStyles.title}>Rapport de marges</Text>
        <Text style={veroneStyles.subtitle}>
          Analyse de rentabilité — {clientName}
        </Text>

        <View style={veroneStyles.ruleGold} />

        {/* Client strip — rappel destinataire + statut consultation */}
        <View style={s.clientStrip}>
          <View style={s.clientStripCol}>
            <Text style={s.clientStripLabel}>Client</Text>
            <Text style={s.clientStripValueBold}>
              {info.legalName ?? info.displayName}
            </Text>
            {info.tradeName && info.tradeName !== info.legalName ? (
              <Text style={s.clientStripValue}>{info.tradeName}</Text>
            ) : null}
            {info.email ? (
              <Text style={s.clientStripValue}>{info.email}</Text>
            ) : null}
          </View>
          <View style={s.clientStripCol}>
            <Text style={s.clientStripLabel}>Consultation</Text>
            <Text style={s.clientStripValue}>
              Créée le {formatDate(consultation.created_at)}
            </Text>
            <Text style={s.clientStripValue}>
              Statut : {consultation.status ?? 'en_attente'}
            </Text>
            <Text style={s.clientStripValue}>
              Priorité : {consultation.priority_level ?? 2} / 5
            </Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Chiffre d&apos;affaires</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalRevenue)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Coût total</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalCost)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Transport</Text>
            <Text style={s.kpiValue}>{formatVeronePrice(totalShipping)}</Text>
          </View>
          <View style={totalMargin >= 0 ? s.kpiCardCharcoal : s.kpiCardWarn}>
            <Text style={totalMargin >= 0 ? s.kpiLabelOnDark : s.kpiLabel}>
              Bénéfice
            </Text>
            <Text style={totalMargin >= 0 ? s.kpiValueOnDark : s.kpiValueWarn}>
              {formatVeronePrice(totalMargin)}
            </Text>
          </View>
          <View
            style={
              totalMarginPercent >= 30
                ? s.kpiCardCharcoal
                : totalMarginPercent < 0
                  ? s.kpiCardWarn
                  : s.kpiCard
            }
          >
            <Text
              style={totalMarginPercent >= 30 ? s.kpiLabelOnDark : s.kpiLabel}
            >
              Taux de marge
            </Text>
            <Text
              style={
                totalMarginPercent >= 30
                  ? s.kpiValueOnDark
                  : totalMarginPercent < 0
                    ? s.kpiValueWarn
                    : s.kpiValue
              }
            >
              {totalMarginPercent.toFixed(1)} %
            </Text>
          </View>
        </View>

        {/* Table détaillée */}
        <Text style={veroneStyles.sectionTitleEyebrow}>
          Analyse détaillée des produits
        </Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: '22%' }]}>Produit</Text>
            <Text style={[s.th, { width: '11%' }]}>Fournisseur</Text>
            <Text style={[s.th, { width: '7%', textAlign: 'center' }]}>
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
              Marge / u
            </Text>
            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
              Marge tot.
            </Text>
          </View>

          {activeItems.map(item => {
            const econ = econByItemId.get(item.id);
            const costPerUnit = econ?.unitCostPrice ?? 0;
            const margin = econ?.margin ?? 0;
            const marginPct = econ?.marginPercent ?? 0;
            const isNegative = margin < 0;

            return (
              <View key={item.id} style={s.tableRow} wrap={false}>
                <View style={{ width: '22%' }}>
                  <Text style={s.tdBold}>
                    {item.product?.name ?? 'Produit'}
                  </Text>
                  <Text style={{ fontSize: 6, color: veroneColors.pearl }}>
                    {item.product?.sku}
                  </Text>
                  {item.product?.archived_at ? (
                    <Text style={{ fontSize: 6, color: veroneColors.pearl }}>
                      Retiré — absent du PDF client
                    </Text>
                  ) : null}
                  {isCandidateLine(item.status) ? (
                    <Text style={{ fontSize: 6, color: veroneColors.pearl }}>
                      Option — hors chiffre d&apos;affaires et hors marge
                    </Text>
                  ) : null}
                </View>
                <Text style={[s.td, { width: '11%' }]}>
                  {item.product?.supplier_name ?? '—'}
                </Text>
                <Text style={[s.td, { width: '7%', textAlign: 'center' }]}>
                  {item.quantity}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {formatVeronePrice(econ?.unitCost ?? 0, 2)}
                </Text>
                <View style={{ width: '10%' }}>
                  <Text style={[s.td, { textAlign: 'right' }]}>
                    {item.is_sample
                      ? '—'
                      : formatVeronePrice(item.shipping_cost, 2)}
                  </Text>
                  {econ && econ.supplierFees > 0 ? (
                    <Text
                      style={{
                        fontSize: 6,
                        color: veroneColors.pearl,
                        textAlign: 'right',
                      }}
                    >
                      + {formatVeronePrice(econ.supplierFees, 2)} frais
                    </Text>
                  ) : null}
                </View>
                <Text style={[s.tdBold, { width: '10%', textAlign: 'right' }]}>
                  {formatVeronePrice(costPerUnit, 2)}
                </Text>
                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>
                  {item.is_free || item.is_sample
                    ? 'Offert'
                    : formatVeronePrice(
                        econ?.unitPrice ?? item.unit_price ?? 0,
                        2
                      )}
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGold,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatVeronePrice(margin / item.quantity, 2)} (
                  {marginPct.toFixed(0)} %)
                </Text>
                <Text
                  style={[
                    isNegative ? s.tdRed : s.tdGold,
                    { width: '10%', textAlign: 'right' },
                  ]}
                >
                  {formatVeronePrice(margin, 2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Ventilation par fournisseur */}
        {supplierEconomics.length > 0 && (
          <>
            <Text style={veroneStyles.sectionTitleEyebrow}>
              Par fournisseur
            </Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.th, { width: '34%' }]}>Fournisseur</Text>
                <Text style={[s.th, { width: '11%', textAlign: 'center' }]}>
                  Lignes
                </Text>
                <Text style={[s.th, { width: '15%', textAlign: 'right' }]}>
                  Frais
                </Text>
                <Text style={[s.th, { width: '15%', textAlign: 'right' }]}>
                  Revient
                </Text>
                <Text style={[s.th, { width: '15%', textAlign: 'right' }]}>
                  Vente
                </Text>
                <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>
                  Marge
                </Text>
              </View>
              {supplierEconomics.map(supplier => (
                <View key={supplier.supplierId} style={s.tableRow} wrap={false}>
                  <Text style={[s.tdBold, { width: '34%' }]}>
                    {supplierNameById.get(supplier.supplierId) ?? 'Fournisseur'}
                  </Text>
                  <Text style={[s.td, { width: '11%', textAlign: 'center' }]}>
                    {supplier.optionCount}
                  </Text>
                  <Text style={[s.td, { width: '15%', textAlign: 'right' }]}>
                    {formatVeronePrice(supplier.supplierCosts, 2)}
                  </Text>
                  <Text style={[s.td, { width: '15%', textAlign: 'right' }]}>
                    {formatVeronePrice(supplier.costPriceTotal, 2)}
                  </Text>
                  <Text style={[s.td, { width: '15%', textAlign: 'right' }]}>
                    {formatVeronePrice(supplier.proposedTotal, 2)}
                  </Text>
                  <Text
                    style={[
                      (supplier.marginPercent ?? 0) < 0 ? s.tdRed : s.tdGold,
                      { width: '10%', textAlign: 'right' },
                    ]}
                  >
                    {supplier.marginPercent === null
                      ? '—'
                      : `${supplier.marginPercent.toFixed(0)} %`}
                  </Text>
                </View>
              ))}
            </View>
            {economics.unallocatedSupplierFees > 0 && (
              <Text style={s.analysisLine}>
                {formatVeronePrice(economics.unallocatedSupplierFees, 2)} de
                frais ne sont imputés à aucune ligne : hors prix de revient et
                hors marge.
              </Text>
            )}
          </>
        )}

        {/* Analyse */}
        <Text style={veroneStyles.sectionTitleEyebrow}>Analyse</Text>
        <View style={s.analysisBlock}>
          <Text style={s.analysisTitle}>Produits les plus rentables</Text>
          {activeItems
            .filter(i => {
              const e = econByItemId.get(i.id);
              return !i.is_free && !i.is_sample && (e?.marginPercent ?? 0) > 0;
            })
            .sort((a, b) => {
              const ea = econByItemId.get(a.id);
              const eb = econByItemId.get(b.id);
              return (eb?.marginPercent ?? 0) - (ea?.marginPercent ?? 0);
            })
            .slice(0, 5)
            .map(item => {
              const e = econByItemId.get(item.id);
              return (
                <Text key={item.id} style={s.analysisLine}>
                  · {item.product?.name} — {(e?.marginPercent ?? 0).toFixed(1)}{' '}
                  % ({formatVeronePrice(e?.margin ?? 0, 2)})
                </Text>
              );
            })}
          {clientBudget !== null && budgetGap !== null && (
            <Text style={[s.analysisLine, { marginTop: 6 }]}>
              Budget annoncé par le client :{' '}
              {formatVeronePrice(clientBudget, 2)} —{' '}
              {budgetGap > 0
                ? `proposition supérieure de ${formatVeronePrice(budgetGap, 2)}`
                : `proposition inférieure de ${formatVeronePrice(-budgetGap, 2)}`}
            </Text>
          )}
          {totalShipping > 0 && totalCost - totalShipping > 0 && (
            <Text style={[s.analysisLine, { marginTop: 6 }]}>
              Impact transport :{' '}
              {((totalShipping / (totalCost - totalShipping)) * 100).toFixed(1)}{' '}
              % du coût d&apos;achat
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={veroneStyles.footer} fixed>
          <Text style={veroneStyles.footerText}>
            Vérone — Rapport interne confidentiel — {reportRef}
          </Text>
          <Text
            style={veroneStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${String(pageNumber)} / ${String(totalPages)}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
