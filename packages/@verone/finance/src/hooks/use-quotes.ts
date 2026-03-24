/**
 * Hook: useQuotes
 * Description: CRUD for customer quotes (devis) stored locally in financial_documents
 *
 * Quotes are stored in financial_documents with document_type = 'customer_quote'.
 * They can optionally be synced to Qonto for PDF generation and sending.
 *
 * Lifecycle: draft -> validated -> sent -> accepted/declined/expired -> converted (to invoice)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Json } from '@verone/types/supabase';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'react-hot-toast';

// Re-export all types for backward compatibility
export type {
  QuoteStatus,
  QuoteItemProduct,
  QuoteItem,
  Quote,
  QuoteFilters,
  QuoteStats,
  CreateQuoteItemData,
  CreateQuoteData,
  UpdateQuoteData,
} from './quotes/types';

import type {
  Quote,
  QuoteFilters,
  QuoteStats,
  QuoteStatus,
  CreateQuoteData,
  CreateQuoteItemData,
  UpdateQuoteData,
} from './quotes/types';

// =====================================================================
// STATUS TRANSITIONS
// =====================================================================

/** Valid status transitions map */
const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['validated'],
  validated: ['sent', 'draft'],
  sent: ['accepted', 'declined', 'expired'],
  accepted: ['converted'],
  declined: [],
  expired: [],
  converted: [],
  superseded: [],
};

/** Fields editable when quote is in 'validated' or 'sent' status */
const LOCKED_EDITABLE_FIELDS = new Set([
  'notes',
  'billing_address',
  'shipping_address',
  'validity_days',
]);

// =====================================================================
// HELPERS
// =====================================================================

function computeItemTotals(item: CreateQuoteItemData) {
  const discountMultiplier = 1 - (item.discount_percentage ?? 0) / 100;
  const total_ht =
    item.quantity * item.unit_price_ht * discountMultiplier +
    (item.eco_tax ?? 0) * item.quantity;
  const tva_amount = total_ht * (item.tva_rate / 100);
  const total_ttc = total_ht + tva_amount;
  return { total_ht, tva_amount, total_ttc };
}

function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `DEV-${year}${month}-${random}`;
}

function computeValidityDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// =====================================================================
// HOOK
// =====================================================================

export function useQuotes(initialFilters?: QuoteFilters) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuoteFilters>(initialFilters ?? {});
  const [stats, setStats] = useState<QuoteStats>({
    total: 0,
    draft: 0,
    validated: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
    converted: 0,
    total_ht: 0,
  });

  // -----------------------------------------------------------------
  // FETCH QUOTES
  // -----------------------------------------------------------------
  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = supabase
        .from('financial_documents')
        .select(
          `
          id, document_number, document_date, due_date, validity_date,
          quote_status, customer_type, partner_id, partner_type,
          individual_customer_id, channel_id,
          total_ht, total_ttc, tva_amount,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          billing_address, shipping_address,
          qonto_invoice_id, qonto_pdf_url, qonto_public_url,
          converted_to_invoice_id, sales_order_id,
          linkme_selection_id, linkme_affiliate_id,
          description, notes, created_at, updated_at, created_by,
          partner:organisations!financial_documents_partner_id_fkey(id, legal_name, trade_name),
          individual_customer:individual_customers!individual_customer_id(id, first_name, last_name, email),
          channel:sales_channels!channel_id(id, name, code),
          items:financial_document_items(
            id, document_id, product_id, description, quantity,
            unit_price_ht, total_ht, tva_rate, tva_amount, total_ttc,
            discount_percentage, eco_tax, sort_order,
            linkme_selection_item_id, base_price_ht, retrocession_rate,
            product:products(id, name, sku, product_images(public_url, is_primary, display_order))
          )
        `
        )
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.quote_status && filters.quote_status !== 'all') {
        query = query.eq('quote_status', filters.quote_status);
      }
      if (filters.channel_id) {
        query = query.eq('channel_id', filters.channel_id);
      }
      if (filters.date_from) {
        query = query.gte('document_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('document_date', filters.date_to);
      }
      if (filters.search) {
        query = query.or(
          `document_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const typedData = (data ?? []) as unknown as Quote[];
      setQuotes(typedData);

      // Compute stats
      const newStats: QuoteStats = {
        total: typedData.length,
        draft: 0,
        validated: 0,
        sent: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
        converted: 0,
        total_ht: 0,
      };
      for (const q of typedData) {
        const status = q.quote_status;
        if (status === 'draft') newStats.draft += 1;
        else if (status === 'validated') newStats.validated += 1;
        else if (status === 'sent') newStats.sent += 1;
        else if (status === 'accepted') newStats.accepted += 1;
        else if (status === 'declined') newStats.declined += 1;
        else if (status === 'expired') newStats.expired += 1;
        else if (status === 'converted') newStats.converted += 1;
        newStats.total_ht += q.total_ht ?? 0;
      }
      setStats(newStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('[useQuotes] fetchQuotes error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // -----------------------------------------------------------------
  // CREATE QUOTE
  // -----------------------------------------------------------------
  const createQuote = useCallback(
    async (data: CreateQuoteData): Promise<string | null> => {
      try {
        const supabase = createClient();

        // Compute item totals
        const itemsWithTotals = data.items.map(item => ({
          ...item,
          ...computeItemTotals(item),
        }));

        // Compute document totals
        const items_total_ht = itemsWithTotals.reduce(
          (sum, i) => sum + i.total_ht,
          0
        );
        const fees_total_ht =
          (data.shipping_cost_ht ?? 0) +
          (data.handling_cost_ht ?? 0) +
          (data.insurance_cost_ht ?? 0);
        const fees_vat = fees_total_ht * (data.fees_vat_rate ?? 0.2);
        const items_tva = itemsWithTotals.reduce(
          (sum, i) => sum + i.tva_amount,
          0
        );

        const total_ht = items_total_ht + fees_total_ht;
        const tva_amount = items_tva + fees_vat;
        const total_ttc = total_ht + tva_amount;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Non authentifié');

        // Determine partner_id and partner_type
        const partnerId =
          data.customer_type === 'organization'
            ? data.customer_id
            : data.customer_id; // For individual, partner_id is still the org if exists
        const partnerType = 'customer';

        // Insert document
        const insertData = {
          document_type: 'customer_quote' as const,
          document_direction: 'inbound' as const,
          document_number: data.reference ?? generateQuoteNumber(),
          document_date: new Date().toISOString().split('T')[0],
          validity_date: computeValidityDate(data.validity_days),
          quote_status: 'draft',
          customer_type: data.customer_type,
          partner_id: partnerId,
          partner_type: partnerType,
          individual_customer_id: data.individual_customer_id ?? null,
          channel_id: data.channel_id,
          total_ht,
          total_ttc,
          tva_amount,
          amount_paid: 0,
          status: 'draft' as const,
          shipping_cost_ht: data.shipping_cost_ht ?? 0,
          handling_cost_ht: data.handling_cost_ht ?? 0,
          insurance_cost_ht: data.insurance_cost_ht ?? 0,
          fees_vat_rate: data.fees_vat_rate ?? 0.2,
          billing_address: (data.billing_address ?? null) as Json,
          shipping_address: (data.shipping_address ?? null) as Json,
          sales_order_id: data.sales_order_id ?? null,
          notes: data.notes ?? null,
          created_by: userData.user.id,
          linkme_selection_id: data.linkme_selection_id ?? null,
          linkme_affiliate_id: data.linkme_affiliate_id ?? null,
          consultation_id: data.consultation_id ?? null,
        };

        const { data: doc, error: docError } = await supabase
          .from('financial_documents')
          .insert(insertData)
          .select('id')
          .single();

        if (docError) throw new Error(docError.message);
        if (!doc) throw new Error('Document non créé');

        // Insert items
        const itemsToInsert = itemsWithTotals.map((item, index) => ({
          document_id: doc.id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          total_ht: item.total_ht,
          tva_rate: item.tva_rate,
          tva_amount: item.tva_amount,
          total_ttc: item.total_ttc,
          discount_percentage: item.discount_percentage ?? 0,
          eco_tax: item.eco_tax ?? 0,
          sort_order: index,
          linkme_selection_item_id: item.linkme_selection_item_id ?? null,
          base_price_ht: item.base_price_ht ?? null,
          retrocession_rate: item.retrocession_rate ?? null,
        }));

        const { error: itemsError } = await supabase
          .from('financial_document_items')
          .insert(itemsToInsert);

        if (itemsError) throw new Error(itemsError.message);

        toast.success('Devis créé avec succès');

        // Push to Qonto — if it fails, rollback local record (no ghost devis)
        try {
          const pushRes = await fetch(`/api/quotes/${doc.id}/push-to-qonto`, {
            method: 'POST',
          });
          if (pushRes.ok) {
            toast.success('Devis synchronisé avec Qonto');
            // Return qonto_invoice_id for redirect to devis detail page
            const { data: synced } = await supabase
              .from('financial_documents')
              .select('qonto_invoice_id')
              .eq('id', doc.id)
              .single();
            if (synced?.qonto_invoice_id) {
              await fetchQuotes();
              return synced.qonto_invoice_id;
            }
          } else {
            const pushData = (await pushRes.json()) as { error?: string };
            console.warn(
              '[useQuotes] Push to Qonto failed (non-blocking):',
              pushData.error
            );
            // Rollback: delete local record to avoid ghost devis
            await supabase
              .from('financial_document_items')
              .delete()
              .eq('document_id', doc.id);
            await supabase
              .from('financial_documents')
              .delete()
              .eq('id', doc.id);
            toast.error(
              pushData.error ?? 'Impossible de créer le devis sur Qonto.'
            );
            await fetchQuotes();
            return null;
          }
        } catch (pushErr) {
          console.warn(
            '[useQuotes] Push to Qonto error (non-blocking):',
            pushErr
          );
          // Rollback: delete local record to avoid ghost devis
          await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', doc.id);
          await supabase.from('financial_documents').delete().eq('id', doc.id);
          toast.error("Erreur de connexion Qonto. Le devis n'a pas été créé.");
          await fetchQuotes();
          return null;
        }

        await fetchQuotes();
        return doc.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotes] createQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return null;
      }
    },
    [fetchQuotes]
  );

  // -----------------------------------------------------------------
  // UPDATE QUOTE (draft = full edit, sent = partial edit)
  // -----------------------------------------------------------------
  const updateQuote = useCallback(
    async (quoteId: string, data: UpdateQuoteData): Promise<boolean> => {
      try {
        const supabase = createClient();

        // Verify quote exists and check status
        const { data: existing, error: fetchErr } = await supabase
          .from('financial_documents')
          .select('id, quote_status, qonto_invoice_id')
          .eq('id', quoteId)
          .single();

        if (fetchErr || !existing) throw new Error('Devis introuvable');

        const status = existing.quote_status as QuoteStatus;

        // Qonto-synced quotes are read-only
        if (existing.qonto_invoice_id) {
          toast.error(
            'Les devis synchronisés Qonto ne peuvent pas être modifiés'
          );
          return false;
        }

        // Only draft, validated and sent can be edited
        if (status !== 'draft' && status !== 'validated' && status !== 'sent') {
          toast.error('Ce devis ne peut plus être modifié');
          return false;
        }

        // In validated/sent status, only certain fields are editable
        if (status === 'validated' || status === 'sent') {
          const dataKeys = Object.keys(data) as (keyof UpdateQuoteData)[];
          const disallowedKeys = dataKeys.filter(
            key => data[key] !== undefined && !LOCKED_EDITABLE_FIELDS.has(key)
          );
          if (disallowedKeys.length > 0) {
            toast.error(
              'En statut "validé" ou "envoyé", seuls les notes, adresses et date de validité sont modifiables'
            );
            return false;
          }
        }

        // Prepare update payload
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.channel_id !== undefined)
          updatePayload.channel_id = data.channel_id;
        if (data.customer_id !== undefined)
          updatePayload.partner_id = data.customer_id;
        if (data.customer_type !== undefined)
          updatePayload.customer_type = data.customer_type;
        if (data.individual_customer_id !== undefined)
          updatePayload.individual_customer_id = data.individual_customer_id;
        if (data.notes !== undefined) updatePayload.notes = data.notes;
        if (data.reference !== undefined)
          updatePayload.document_number = data.reference;
        if (data.billing_address !== undefined)
          updatePayload.billing_address = data.billing_address;
        if (data.shipping_address !== undefined)
          updatePayload.shipping_address = data.shipping_address;
        if (data.shipping_cost_ht !== undefined)
          updatePayload.shipping_cost_ht = data.shipping_cost_ht;
        if (data.handling_cost_ht !== undefined)
          updatePayload.handling_cost_ht = data.handling_cost_ht;
        if (data.insurance_cost_ht !== undefined)
          updatePayload.insurance_cost_ht = data.insurance_cost_ht;
        if (data.fees_vat_rate !== undefined)
          updatePayload.fees_vat_rate = data.fees_vat_rate;
        if (data.validity_days !== undefined) {
          updatePayload.validity_date = computeValidityDate(data.validity_days);
        }

        // If items are provided, recalculate totals
        if (data.items) {
          const itemsWithTotals = data.items.map(item => ({
            ...item,
            ...computeItemTotals(item),
          }));

          const items_total_ht = itemsWithTotals.reduce(
            (sum, i) => sum + i.total_ht,
            0
          );
          const fees_total_ht =
            (data.shipping_cost_ht ?? 0) +
            (data.handling_cost_ht ?? 0) +
            (data.insurance_cost_ht ?? 0);
          const fees_vat = fees_total_ht * (data.fees_vat_rate ?? 0.2);
          const items_tva = itemsWithTotals.reduce(
            (sum, i) => sum + i.tva_amount,
            0
          );

          updatePayload.total_ht = items_total_ht + fees_total_ht;
          updatePayload.tva_amount = items_tva + fees_vat;
          updatePayload.total_ttc =
            (updatePayload.total_ht as number) +
            (updatePayload.tva_amount as number);

          // Delete existing items and re-insert
          const { error: delErr } = await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', quoteId);

          if (delErr) throw new Error(delErr.message);

          const itemsToInsert = itemsWithTotals.map((item, index) => ({
            document_id: quoteId,
            product_id: item.product_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            total_ht: item.total_ht,
            tva_rate: item.tva_rate,
            tva_amount: item.tva_amount,
            total_ttc: item.total_ttc,
            discount_percentage: item.discount_percentage ?? 0,
            eco_tax: item.eco_tax ?? 0,
            sort_order: index,
            linkme_selection_item_id: item.linkme_selection_item_id ?? null,
            base_price_ht: item.base_price_ht ?? null,
            retrocession_rate: item.retrocession_rate ?? null,
          }));

          const { error: insertErr } = await supabase
            .from('financial_document_items')
            .insert(itemsToInsert);

          if (insertErr) throw new Error(insertErr.message);
        }

        // Update document
        const { error: updateErr } = await supabase
          .from('financial_documents')
          .update(updatePayload)
          .eq('id', quoteId);

        if (updateErr) throw new Error(updateErr.message);

        toast.success('Devis mis à jour');
        await fetchQuotes();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotes] updateQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [fetchQuotes]
  );

  // -----------------------------------------------------------------
  // CHANGE QUOTE STATUS
  // -----------------------------------------------------------------
  const changeQuoteStatus = useCallback(
    async (quoteId: string, newStatus: QuoteStatus): Promise<boolean> => {
      try {
        const supabase = createClient();

        // Fetch current quote
        const { data: existing, error: fetchErr } = await supabase
          .from('financial_documents')
          .select('id, quote_status, qonto_invoice_id')
          .eq('id', quoteId)
          .single();

        if (fetchErr || !existing) throw new Error('Devis introuvable');

        const currentStatus = existing.quote_status as QuoteStatus;

        // Validate transition
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];
        if (!allowedTransitions.includes(newStatus)) {
          toast.error(
            `Transition impossible : ${currentStatus} → ${newStatus}`
          );
          return false;
        }

        // Cannot revert to draft if synced to Qonto
        if (newStatus === 'draft' && existing.qonto_invoice_id) {
          toast.error(
            'Impossible de revenir en brouillon : devis déjà synchronisé avec Qonto'
          );
          return false;
        }

        const { error: updateErr } = await supabase
          .from('financial_documents')
          .update({
            quote_status: newStatus,
            status: newStatus === 'draft' ? 'draft' : 'sent',
            updated_at: new Date().toISOString(),
          })
          .eq('id', quoteId);

        if (updateErr) throw new Error(updateErr.message);

        // When validating, push/finalize to Qonto
        // If not linked: creates draft + finalizes on Qonto
        // If already linked: finalizes existing draft on Qonto (generates PDF)
        if (newStatus === 'validated') {
          try {
            const pushRes = await fetch(
              `/api/quotes/${quoteId}/push-to-qonto`,
              { method: 'POST' }
            );
            if (pushRes.ok) {
              toast.success('Devis synchronisé avec Qonto (PDF disponible)');
            } else {
              const pushData = (await pushRes.json()) as { error?: string };
              console.warn(
                '[useQuotes] Push to Qonto on validation failed:',
                pushData.error
              );
              toast.error(
                'Devis validé localement mais erreur Qonto — réessayez via "Lier à Qonto"'
              );
            }
          } catch (pushErr) {
            console.warn(
              '[useQuotes] Push to Qonto on validation error:',
              pushErr
            );
          }
        }

        const statusLabels: Record<QuoteStatus, string> = {
          draft: 'brouillon',
          validated: 'validé',
          sent: 'envoyé',
          accepted: 'accepté',
          declined: 'refusé',
          expired: 'expiré',
          converted: 'converti',
          superseded: 'remplacé',
        };

        toast.success(`Devis marqué comme "${statusLabels[newStatus]}"`);
        await fetchQuotes();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotes] changeQuoteStatus error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [fetchQuotes]
  );

  // -----------------------------------------------------------------
  // DELETE QUOTE (soft delete, only drafts)
  // -----------------------------------------------------------------
  const deleteQuote = useCallback(
    async (quoteId: string): Promise<boolean> => {
      try {
        const supabase = createClient();

        const { data: existing, error: fetchErr } = await supabase
          .from('financial_documents')
          .select('id, quote_status, converted_to_invoice_id')
          .eq('id', quoteId)
          .single();

        if (fetchErr || !existing) throw new Error('Devis introuvable');

        // Only block deletion if quote has been converted to invoice
        if (existing.converted_to_invoice_id) {
          toast.error(
            'Ce devis a été converti en facture et ne peut pas être supprimé'
          );
          return false;
        }

        const { error: delErr } = await supabase
          .from('financial_documents')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', quoteId);

        if (delErr) throw new Error(delErr.message);

        toast.success('Devis supprimé');
        await fetchQuotes();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotes] deleteQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [fetchQuotes]
  );

  // -----------------------------------------------------------------
  // FETCH SINGLE QUOTE
  // -----------------------------------------------------------------
  const fetchQuote = useCallback(
    async (quoteId: string): Promise<Quote | null> => {
      try {
        const supabase = createClient();

        const { data, error: fetchErr } = await supabase
          .from('financial_documents')
          .select(
            `
          id, document_number, document_date, due_date, validity_date,
          quote_status, customer_type, partner_id, partner_type,
          individual_customer_id, channel_id,
          total_ht, total_ttc, tva_amount,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          billing_address, shipping_address,
          qonto_invoice_id, qonto_pdf_url, qonto_public_url,
          converted_to_invoice_id, sales_order_id,
          linkme_selection_id, linkme_affiliate_id,
          description, notes, created_at, updated_at, created_by,
          partner:organisations!financial_documents_partner_id_fkey(id, legal_name, trade_name),
          individual_customer:individual_customers!individual_customer_id(id, first_name, last_name, email),
          channel:sales_channels!channel_id(id, name, code),
          items:financial_document_items(
            id, document_id, product_id, description, quantity,
            unit_price_ht, total_ht, tva_rate, tva_amount, total_ttc,
            discount_percentage, eco_tax, sort_order,
            linkme_selection_item_id, base_price_ht, retrocession_rate,
            product:products(id, name, sku, product_images(public_url, is_primary, display_order))
          )
        `
          )
          .eq('id', quoteId)
          .eq('document_type', 'customer_quote')
          .is('deleted_at', null)
          .single();

        if (fetchErr) throw new Error(fetchErr.message);

        return (data as unknown as Quote) ?? null;
      } catch (err) {
        console.error('[useQuotes] fetchQuote error:', err);
        return null;
      }
    },
    []
  );

  // -----------------------------------------------------------------
  // AUTO-FETCH
  // -----------------------------------------------------------------
  useEffect(() => {
    void fetchQuotes().catch((err: unknown) => {
      console.error('[useQuotes] auto-fetch error:', err);
    });
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    error,
    stats,
    filters,
    setFilters,
    fetchQuotes,
    fetchQuote,
    createQuote,
    updateQuote,
    changeQuoteStatus,
    deleteQuote,
  };
}
