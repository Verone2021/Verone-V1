/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// =====================================================================
// Enrichment: Reconciliation links + auto-attach Qonto
// Called after fetchTransactions maps the raw rows
// =====================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ReconciliationLinkDetail, UnifiedTransaction } from './types';

export async function enrichWithReconciliationLinks(
  supabase: SupabaseClient,
  transformed: UnifiedTransaction[]
): Promise<void> {
  const txIds = transformed.map(t => t.id);
  if (txIds.length === 0) return;

  const { data: linksAgg } = await supabase
    .from('transaction_document_links')
    .select(
      'id, transaction_id, allocated_amount, document_id, sales_order_id, purchase_order_id, link_type'
    )
    .in('transaction_id', txIds);

  if (!linksAgg || linksAgg.length === 0) return;

  // Récupérer les détails des entités liées (documents, commandes, PO)
  const allDocIds = [
    ...new Set(
      linksAgg.filter(l => l.document_id).map(l => l.document_id as string)
    ),
  ];
  const allSoIds = [
    ...new Set(
      linksAgg
        .filter(l => l.sales_order_id)
        .map(l => l.sales_order_id as string)
    ),
  ];
  const allPoIds = [
    ...new Set(
      linksAgg
        .filter(l => l.purchase_order_id)
        .map(l => l.purchase_order_id as string)
    ),
  ];

  type EntityDetail = {
    label: string;
    partner_name: string | null;
    total_ht: number;
    total_ttc: number;
    vat_rate: number;
  };
  const entityDetails = new Map<string, EntityDetail>();

  if (allDocIds.length > 0) {
    const { data: docs } = await supabase
      .from('financial_documents')
      .select(
        'id, document_number, total_ht, total_ttc, fees_vat_rate, partner_id, organisations!partner_id(legal_name, trade_name)'
      )
      .in('id', allDocIds);
    docs?.forEach(d => {
      const ht = Number(d.total_ht) || 0;
      const ttc = Number(d.total_ttc) || 0;
      const org = d.organisations as unknown as {
        legal_name: string;
        trade_name: string | null;
      } | null;
      // TVA depuis fees_vat_rate du document (source fiable), jamais calculée depuis HT/TTC
      const vatRate =
        d.fees_vat_rate != null
          ? Math.round(Number(d.fees_vat_rate) * 100)
          : 20;
      entityDetails.set(d.id, {
        label: d.document_number ?? 'Document',
        partner_name: org?.trade_name ?? org?.legal_name ?? null,
        total_ht: ht,
        total_ttc: ttc,
        vat_rate: vatRate,
      });
    });
  }

  if (allSoIds.length > 0) {
    const { data: sos } = await supabase
      .from('sales_orders')
      .select(
        'id, order_number, total_ht, total_ttc, customer_id, customer_type'
      )
      .in('id', allSoIds);
    if (sos) {
      // Fetch tax_rate from order items (source fiable, jamais calculer depuis HT/TTC)
      const { data: soItems } = await supabase
        .from('sales_order_items')
        .select('sales_order_id, tax_rate')
        .in(
          'sales_order_id',
          sos.map(s => s.id)
        );
      const soVatRates = new Map<string, number>();
      if (soItems) {
        // Prendre le tax_rate le plus fréquent par commande
        const ratesByOrder = new Map<string, number[]>();
        soItems.forEach(item => {
          const rates = ratesByOrder.get(item.sales_order_id) ?? [];
          rates.push(Number(item.tax_rate) || 0);
          ratesByOrder.set(item.sales_order_id, rates);
        });
        ratesByOrder.forEach((rates, orderId) => {
          // tax_rate est stocké en décimal (0.2000 = 20%)
          const dominant =
            rates.length > 0
              ? rates.sort(
                  (a, b) =>
                    rates.filter(r => r === b).length -
                    rates.filter(r => r === a).length
                )[0]
              : 0.2;
          soVatRates.set(orderId, Math.round(dominant * 100));
        });
      }

      const orgCustIds = sos
        .filter(s => s.customer_type === 'organization')
        .map(s => s.customer_id)
        .filter(Boolean) as string[];
      const orgNames = new Map<string, string>();
      if (orgCustIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organisations')
          .select('id, legal_name, trade_name')
          .in('id', orgCustIds);
        orgs?.forEach(o => orgNames.set(o.id, o.trade_name ?? o.legal_name));
      }
      sos.forEach(s => {
        const ht = Number(s.total_ht) || 0;
        const ttc = Number(s.total_ttc) || 0;
        entityDetails.set(s.id, {
          label: `SO-${s.order_number}`,
          partner_name:
            s.customer_type === 'organization'
              ? (orgNames.get(s.customer_id as string) ?? null)
              : null,
          total_ht: ht,
          total_ttc: ttc,
          vat_rate: soVatRates.get(s.id) ?? 20,
        });
      });
    }
  }

  if (allPoIds.length > 0) {
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select(
        'id, po_number, total_ht, total_ttc, supplier_id, organisations!supplier_id(legal_name, trade_name)'
      )
      .in('id', allPoIds);
    pos?.forEach(p => {
      const ht = Number(p.total_ht) || 0;
      const ttc = Number(p.total_ttc) || 0;
      const org = p.organisations as unknown as {
        legal_name: string;
        trade_name: string | null;
      } | null;
      // PO : si HT ≈ TTC → 0% (fournisseur hors France), sinon 20%
      const vatRate = ht > 0 && Math.abs(ttc / ht - 1) < 0.02 ? 0 : 20;
      entityDetails.set(p.id, {
        label: `PO-${p.po_number}`,
        partner_name: org?.trade_name ?? org?.legal_name ?? null,
        total_ht: ht,
        total_ttc: ttc,
        vat_rate: vatRate,
      });
    });
  }

  // Grouper par transaction et construire les détails
  const linksByTx = new Map<
    string,
    {
      count: number;
      total: number;
      details: ReconciliationLinkDetail[];
    }
  >();
  for (const link of linksAgg) {
    const txId = link.transaction_id;
    const existing = linksByTx.get(txId) ?? {
      count: 0,
      total: 0,
      details: [],
    };
    existing.count += 1;
    const allocAmt = Math.abs(Number(link.allocated_amount) || 0);
    existing.total += allocAmt;

    // Résoudre l'entité liée — la facture prime si document_id existe
    const entityId = (link.document_id ??
      link.sales_order_id ??
      link.purchase_order_id) as string;
    const detail = entityDetails.get(entityId);
    const effectiveLinkType = link.document_id
      ? 'document'
      : (link.link_type as ReconciliationLinkDetail['link_type']);
    existing.details.push({
      id: link.id,
      link_type: effectiveLinkType,
      allocated_amount: allocAmt,
      label: detail?.label ?? 'Inconnu',
      partner_name: detail?.partner_name ?? null,
      total_ht: detail?.total_ht ?? 0,
      total_ttc: detail?.total_ttc ?? 0,
      vat_rate: detail?.vat_rate ?? 0,
    });

    linksByTx.set(txId, existing);
  }

  // Appliquer sur les transactions
  for (const tx of transformed) {
    const info = linksByTx.get(tx.id);
    if (info) {
      tx.reconciliation_link_count = info.count;
      tx.reconciliation_total_allocated = info.total;
      tx.reconciliation_remaining = Math.abs(tx.amount) - info.total;
      tx.reconciliation_links = info.details;

      const vatRates = new Set<number>();
      for (const d of info.details) {
        if (d.vat_rate !== undefined) vatRates.add(d.vat_rate);
      }
      tx.reconciliation_vat_rates = [...vatRates].sort((a, b) => a - b);
    }
  }

  // Auto-attach justificatifs : pour les transactions rapprochées
  // qui n'ont pas encore de justificatif, déclencher l'auto-attach en background
  await triggerAutoAttach(supabase, transformed, linksAgg);
}

// =====================================================================
// Auto-attach Qonto (fire-and-forget, IMMUTABLE route)
// POST /api/qonto/attachments/auto-attach
// =====================================================================

type LinkRow = {
  transaction_id: string;
  document_id: string | null;
  sales_order_id: string | null;
};

async function triggerAutoAttach(
  supabase: SupabaseClient,
  transformed: UnifiedTransaction[],
  linksAgg: LinkRow[]
): Promise<void> {
  const missingAttachTxs = transformed.filter(tx => {
    if (!tx.reconciliation_links?.length) return false;
    if (tx.attachment_ids?.length) return false;
    return true; // tout rapprochement sans justificatif
  });
  if (missingAttachTxs.length === 0) return;

  // 1. Document_ids directement liés via transaction_document_links
  const txDocLinks = new Map<string, string[]>();
  linksAgg
    .filter(l => l.document_id)
    .forEach(l => {
      const arr = txDocLinks.get(l.transaction_id) ?? [];
      arr.push(l.document_id as string);
      txDocLinks.set(l.transaction_id, arr);
    });

  // 2. Pour les liens via sales_order sans document_id,
  //    chercher la facture liée via financial_documents.sales_order_id
  const soOnlyLinks = linksAgg.filter(l => l.sales_order_id && !l.document_id);
  if (soOnlyLinks.length > 0) {
    const soIds = [
      ...new Set(soOnlyLinks.map(l => l.sales_order_id as string)),
    ];
    const { data: invoicesForSOs } = await supabase
      .from('financial_documents')
      .select('id, sales_order_id, local_pdf_path, uploaded_file_url')
      .in('sales_order_id', soIds)
      .eq('document_type', 'customer_invoice')
      .in('status', ['sent', 'paid']);
    if (invoicesForSOs?.length) {
      const invoiceBySO = new Map<string, string>();
      invoicesForSOs.forEach(inv => {
        // Ne prendre que les factures qui ont un PDF
        if (inv.local_pdf_path || inv.uploaded_file_url) {
          invoiceBySO.set(inv.sales_order_id as string, inv.id);
        }
      });
      soOnlyLinks.forEach(l => {
        const invId = invoiceBySO.get(l.sales_order_id as string);
        if (invId) {
          const arr = txDocLinks.get(l.transaction_id) ?? [];
          arr.push(invId);
          txDocLinks.set(l.transaction_id, arr);
        }
      });
    }
  }

  for (const tx of missingAttachTxs) {
    const docIds = txDocLinks.get(tx.id) ?? [];
    for (const docId of docIds) {
      void fetch('/api/qonto/attachments/auto-attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          documentId: docId,
        }),
      }).catch(err =>
        console.warn('[auto-attach] Failed for tx', tx.id, ':', err)
      );
    }
  }
}
