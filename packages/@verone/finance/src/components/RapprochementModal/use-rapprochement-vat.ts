'use client';

import { useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

interface UseVatParams {
  transactionId: string | undefined;
  transactionQontoId?: string | null;
}

export function useRapprochementVat({
  transactionId,
  transactionQontoId,
}: UseVatParams) {
  // Auto-attach: apres rapprochement, attacher le PDF du document comme justificatif Qonto
  const autoAttachPDF = useCallback(
    async (documentId: string) => {
      if (!transactionQontoId) return;
      try {
        const res = await fetch('/api/qonto/attachments/auto-attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: transactionQontoId,
            documentId,
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          skipped?: boolean;
          message?: string;
          documentNumber?: string;
        };
        if (data.success && !data.skipped) {
          console.warn(
            `[RapprochementModal] Auto-attach: ${data.documentNumber ?? documentId} attache`
          );
        }
      } catch (err) {
        // Ne pas bloquer le rapprochement si l'auto-attach echoue
        console.warn(
          '[RapprochementModal] Auto-attach failed (non-blocking):',
          err
        );
      }
    },
    [transactionQontoId]
  );

  // Auto-calcul TVA depuis les documents/commandes rapprochés
  const autoCalculateVAT = useCallback(async () => {
    if (!transactionId) return;
    try {
      const supabase = createClient();

      // Lire tous les liens de la transaction avec les détails des documents
      const { data: links } = await supabase
        .from('transaction_document_links')
        .select(
          'allocated_amount, document_id, sales_order_id, purchase_order_id'
        )
        .eq('transaction_id', transactionId);

      if (!links || links.length === 0) {
        // Plus de liens → effacer la TVA auto
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: null,
            amount_ht: null,
            amount_vat: null,
            vat_breakdown: null,
            vat_source: null,
          })
          .eq('id', transactionId);
        return;
      }

      // Collecter HT/TTC de chaque document lié
      const docIds = links
        .filter(l => l.document_id)
        .map(l => l.document_id as string);
      const soIds = links
        .filter(l => l.sales_order_id)
        .map(l => l.sales_order_id as string);
      const poIds = links
        .filter(l => l.purchase_order_id)
        .map(l => l.purchase_order_id as string);

      type AmountPair = { id: string; total_ht: number; total_ttc: number };
      const amounts: AmountPair[] = [];

      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from('financial_documents')
          .select('id, total_ht, total_ttc')
          .in('id', docIds);
        docs?.forEach(d =>
          amounts.push({
            id: d.id,
            total_ht: Number(d.total_ht) || 0,
            total_ttc: Number(d.total_ttc) || 0,
          })
        );
      }
      if (soIds.length > 0) {
        const { data: sos } = await supabase
          .from('sales_orders')
          .select('id, total_ht, total_ttc')
          .in('id', soIds);
        sos?.forEach(s =>
          amounts.push({
            id: s.id,
            total_ht: Number(s.total_ht) || 0,
            total_ttc: Number(s.total_ttc) || 0,
          })
        );
      }
      if (poIds.length > 0) {
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('id, total_ht, total_ttc')
          .in('id', poIds);
        pos?.forEach(p =>
          amounts.push({
            id: p.id,
            total_ht: Number(p.total_ht) || 0,
            total_ttc: Number(p.total_ttc) || 0,
          })
        );
      }

      if (amounts.length === 0) return;

      // Calculer les taux uniques
      const rates = new Set<number>();
      const breakdownEntries: Array<{
        description: string;
        amount_ht: number;
        tva_rate: number;
        tva_amount: number;
      }> = [];

      for (const a of amounts) {
        const ht = a.total_ht;
        const ttc = a.total_ttc;
        const rate =
          ht > 0 ? Math.round(((ttc - ht) / ht) * 100 * 100) / 100 : 0;
        rates.add(Math.round(rate));
        breakdownEntries.push({
          description: `Document`,
          amount_ht: ht,
          tva_rate: Math.round(rate),
          tva_amount: Math.round((ttc - ht) * 100) / 100,
        });
      }

      const totalHT = amounts.reduce((sum, a) => sum + a.total_ht, 0);
      const totalTTC = amounts.reduce((sum, a) => sum + a.total_ttc, 0);
      const totalVAT = Math.round((totalTTC - totalHT) * 100) / 100;

      if (rates.size === 1) {
        // Un seul taux → simple
        const singleRate = [...rates][0];
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: singleRate,
            amount_ht: Math.round(totalHT * 100) / 100,
            amount_vat: totalVAT,
            vat_breakdown: null,
            vat_source: 'reconciliation',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      } else {
        // Plusieurs taux → ventilation
        await supabase
          .from('bank_transactions')
          .update({
            vat_rate: null,
            amount_ht: Math.round(totalHT * 100) / 100,
            amount_vat: totalVAT,
            vat_breakdown: breakdownEntries,
            vat_source: 'reconciliation',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      }

      console.warn('[RapprochementModal] Auto-VAT applied:', {
        rates: [...rates],
        totalHT,
        totalVAT,
      });
    } catch (err) {
      console.warn('[RapprochementModal] Auto-VAT failed (non-blocking):', err);
    }
  }, [transactionId]);

  return { autoAttachPDF, autoCalculateVAT };
}
