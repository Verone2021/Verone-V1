'use client';

import { useCallback } from 'react';

import type { Json } from '@verone/types/supabase';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'react-hot-toast';

import type { CreateQuoteData, QuoteStatus, UpdateQuoteData } from './types';
import {
  buildItemsToInsert,
  computeDocumentTotals,
  computeItemTotals,
  computeValidityDate,
  generateQuoteNumber,
  LOCKED_EDITABLE_FIELDS,
  VALID_TRANSITIONS,
} from './helpers';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'brouillon',
  validated: 'validé',
  sent: 'envoyé',
  accepted: 'accepté',
  declined: 'refusé',
  expired: 'expiré',
  converted: 'converti',
  superseded: 'remplacé',
};

export function useQuotesMutations(onMutationSuccess: () => Promise<void>) {
  const createQuote = useCallback(
    async (data: CreateQuoteData): Promise<string | null> => {
      try {
        const supabase = createClient();
        const itemsWithTotals = data.items.map(item => ({
          ...item,
          ...computeItemTotals(item),
        }));
        const { total_ht, tva_amount, total_ttc } = computeDocumentTotals(
          itemsWithTotals,
          data
        );

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Non authentifié');

        const { data: doc, error: docError } = await supabase
          .from('financial_documents')
          .insert({
            document_type: 'customer_quote' as const,
            document_direction: 'inbound' as const,
            document_number: data.reference ?? generateQuoteNumber(),
            document_date: new Date().toISOString().split('T')[0],
            validity_date: computeValidityDate(data.validity_days),
            quote_status: 'draft',
            customer_type: data.customer_type,
            partner_id: data.customer_id,
            partner_type: 'customer',
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
          })
          .select('id')
          .single();

        if (docError) throw new Error(docError.message);
        if (!doc) throw new Error('Document non créé');

        const { error: itemsError } = await supabase
          .from('financial_document_items')
          .insert(buildItemsToInsert(doc.id, itemsWithTotals));

        if (itemsError) throw new Error(itemsError.message);

        toast.success('Devis créé avec succès');

        // Push to Qonto — rollback if fails (no ghost devis)
        try {
          const pushRes = await fetch(`/api/quotes/${doc.id}/push-to-qonto`, {
            method: 'POST',
          });
          if (pushRes.ok) {
            toast.success('Devis synchronisé avec Qonto');
            const { data: synced } = await supabase
              .from('financial_documents')
              .select('qonto_invoice_id')
              .eq('id', doc.id)
              .single();
            if (synced?.qonto_invoice_id) {
              await onMutationSuccess();
              return synced.qonto_invoice_id;
            }
          } else {
            const pushData = (await pushRes.json()) as { error?: string };
            console.warn(
              '[useQuotesMutations] Push to Qonto failed:',
              pushData.error
            );
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
            await onMutationSuccess();
            return null;
          }
        } catch (pushErr) {
          console.warn('[useQuotesMutations] Push to Qonto error:', pushErr);
          await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', doc.id);
          await supabase.from('financial_documents').delete().eq('id', doc.id);
          toast.error("Erreur de connexion Qonto. Le devis n'a pas été créé.");
          await onMutationSuccess();
          return null;
        }

        await onMutationSuccess();
        return doc.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotesMutations] createQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return null;
      }
    },
    [onMutationSuccess]
  );

  const updateQuote = useCallback(
    async (quoteId: string, data: UpdateQuoteData): Promise<boolean> => {
      try {
        const supabase = createClient();

        const { data: existing, error: fetchErr } = await supabase
          .from('financial_documents')
          .select('id, quote_status, qonto_invoice_id')
          .eq('id', quoteId)
          .single();

        if (fetchErr || !existing) throw new Error('Devis introuvable');

        const status = existing.quote_status as QuoteStatus;

        if (existing.qonto_invoice_id) {
          toast.error(
            'Les devis synchronisés Qonto ne peuvent pas être modifiés'
          );
          return false;
        }

        if (status !== 'draft' && status !== 'validated' && status !== 'sent') {
          toast.error('Ce devis ne peut plus être modifié');
          return false;
        }

        if (status === 'validated' || status === 'sent') {
          const disallowedKeys = (
            Object.keys(data) as (keyof UpdateQuoteData)[]
          ).filter(
            key => data[key] !== undefined && !LOCKED_EDITABLE_FIELDS.has(key)
          );
          if (disallowedKeys.length > 0) {
            toast.error(
              'En statut "validé" ou "envoyé", seuls les notes, adresses et date de validité sont modifiables'
            );
            return false;
          }
        }

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
        if (data.validity_days !== undefined)
          updatePayload.validity_date = computeValidityDate(data.validity_days);

        if (data.items) {
          const itemsWithTotals = data.items.map(item => ({
            ...item,
            ...computeItemTotals(item),
          }));
          const totals = computeDocumentTotals(itemsWithTotals, data);
          updatePayload.total_ht = totals.total_ht;
          updatePayload.tva_amount = totals.tva_amount;
          updatePayload.total_ttc = totals.total_ttc;

          const { error: delErr } = await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', quoteId);
          if (delErr) throw new Error(delErr.message);

          const { error: insertErr } = await supabase
            .from('financial_document_items')
            .insert(buildItemsToInsert(quoteId, itemsWithTotals));
          if (insertErr) throw new Error(insertErr.message);
        }

        const { error: updateErr } = await supabase
          .from('financial_documents')
          .update(updatePayload)
          .eq('id', quoteId);
        if (updateErr) throw new Error(updateErr.message);

        toast.success('Devis mis à jour');
        await onMutationSuccess();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotesMutations] updateQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [onMutationSuccess]
  );

  const changeQuoteStatus = useCallback(
    async (quoteId: string, newStatus: QuoteStatus): Promise<boolean> => {
      try {
        const supabase = createClient();

        const { data: existing, error: fetchErr } = await supabase
          .from('financial_documents')
          .select('id, quote_status, qonto_invoice_id')
          .eq('id', quoteId)
          .single();

        if (fetchErr || !existing) throw new Error('Devis introuvable');

        const currentStatus = existing.quote_status as QuoteStatus;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];

        if (!allowedTransitions.includes(newStatus)) {
          toast.error(
            `Transition impossible : ${currentStatus} → ${newStatus}`
          );
          return false;
        }

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
                '[useQuotesMutations] Push to Qonto on validation failed:',
                pushData.error
              );
              toast.error(
                'Devis validé localement mais erreur Qonto — réessayez via "Lier à Qonto"'
              );
            }
          } catch (pushErr) {
            console.warn(
              '[useQuotesMutations] Push to Qonto on validation error:',
              pushErr
            );
          }
        }

        toast.success(`Devis marqué comme "${STATUS_LABELS[newStatus]}"`);
        await onMutationSuccess();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotesMutations] changeQuoteStatus error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [onMutationSuccess]
  );

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
        await onMutationSuccess();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[useQuotesMutations] deleteQuote error:', err);
        toast.error(`Erreur: ${message}`);
        return false;
      }
    },
    [onMutationSuccess]
  );

  return { createQuote, updateQuote, changeQuoteStatus, deleteQuote };
}
