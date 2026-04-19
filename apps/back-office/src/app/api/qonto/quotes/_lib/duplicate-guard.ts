/**
 * Guard anti-doublon pour les devis (symétrique de invoices/_lib/duplicate-guard.ts)
 *
 * Logique :
 * - Si un devis DRAFT existe : soft delete (quote_status='superseded' + deleted_at) + delete Qonto
 *   (règle métier R4 : régénération = écrasement du draft)
 * - Si un devis FINALISÉ/ACCEPTÉ existe : refus 409 (protection comptable)
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import type { QontoClient } from '@verone/integrations/qonto';

export async function checkAndCleanExistingQuotes(
  supabase: SupabaseClient<Database>,
  qontoClient: QontoClient,
  salesOrderId: string
): Promise<{ conflict: NextResponse | null }> {
  // Guard anti-doublon : un seul devis actif par commande.
  // - Si un devis DRAFT existe : on le supprime (Qonto + soft-delete local) puis on continue
  //   (règle métier R4 : régénérer un devis écrase l'ancien)
  // - Si un devis FINALISÉ ou ACCEPTÉ existe : on refuse 409 (protection comptable)
  const { data: existingQuotes, error: checkError } = await supabase
    .from('financial_documents')
    .select('id, document_number, status, qonto_invoice_id')
    .eq('sales_order_id', salesOrderId)
    .eq('document_type', 'customer_quote')
    .is('deleted_at', null)
    .not('status', 'eq', 'cancelled');

  if (checkError) {
    console.error('[API Qonto Quotes] Duplicate check failed:', checkError);
    // Continue anyway - Qonto will be the fallback guard
    return { conflict: null };
  }

  if (existingQuotes && existingQuotes.length > 0) {
    const finalized = existingQuotes.find(q => q.status !== 'draft');
    if (finalized) {
      return {
        conflict: NextResponse.json(
          {
            success: false,
            error: `Un devis finalisé ou accepté existe déjà pour cette commande : ${finalized.document_number ?? finalized.id}. Impossible de le remplacer.`,
            existingQuoteId: finalized.id,
          },
          { status: 409 }
        ),
      };
    }

    for (const existing of existingQuotes) {
      if (existing.qonto_invoice_id) {
        try {
          await qontoClient.deleteClientQuote(existing.qonto_invoice_id);
        } catch (err) {
          console.warn(
            `[API Qonto Quotes] Qonto delete failed for ${existing.qonto_invoice_id} (non-blocking):`,
            err
          );
        }
      }
      const { error: softDeleteError } = await supabase
        .from('financial_documents')
        .update({
          deleted_at: new Date().toISOString(),
          quote_status: 'superseded',
        } as Record<string, unknown>)
        .eq('id', existing.id);
      if (softDeleteError) {
        console.error(
          `[API Qonto Quotes] Soft-delete failed for ${existing.id}:`,
          softDeleteError
        );
        return {
          conflict: NextResponse.json(
            {
              success: false,
              error: `Impossible de supprimer le devis existant (${existing.document_number ?? existing.id}). Veuillez reessayer.`,
            },
            { status: 500 }
          ),
        };
      }
    }
  }

  return { conflict: null };
}
