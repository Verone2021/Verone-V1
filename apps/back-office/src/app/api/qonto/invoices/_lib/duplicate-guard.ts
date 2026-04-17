import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import type { QontoClient } from '@verone/integrations/qonto';

export async function checkAndCleanExistingInvoices(
  supabase: SupabaseClient<Database>,
  qontoClient: QontoClient,
  salesOrderId: string
): Promise<{ conflict: NextResponse | null }> {
  // Guard anti-doublon : une seule facture active par commande.
  // - Si une proforma DRAFT existe : on la supprime (Qonto + soft-delete local) puis on continue
  //   (règle métier : re-générer une proforma écrase l'ancienne)
  // - Si une facture FINALISÉE ou PAYÉE existe : on refuse 409 (protection comptable)
  const { data: existingInvoices, error: checkError } = await supabase
    .from('financial_documents')
    .select('id, document_number, status, qonto_invoice_id')
    .eq('sales_order_id', salesOrderId)
    .eq('document_type', 'customer_invoice')
    .is('deleted_at', null)
    .not('status', 'eq', 'cancelled');

  if (checkError) {
    console.error('[API Qonto Invoices] Duplicate check failed:', checkError);
    // Continue anyway - Qonto will be the fallback guard
    return { conflict: null };
  }

  if (existingInvoices && existingInvoices.length > 0) {
    const finalized = existingInvoices.find(inv => inv.status !== 'draft');
    if (finalized) {
      return {
        conflict: NextResponse.json(
          {
            success: false,
            error: `Une facture finalisée existe déjà pour cette commande : ${finalized.document_number ?? finalized.id}. Impossible de la remplacer.`,
            existingInvoiceId: finalized.id,
          },
          { status: 409 }
        ),
      };
    }

    for (const existing of existingInvoices) {
      if (existing.qonto_invoice_id) {
        try {
          await qontoClient.deleteClientInvoice(existing.qonto_invoice_id);
        } catch (err) {
          console.warn(
            `[API Qonto Invoices] Qonto delete failed for ${existing.qonto_invoice_id} (non-blocking):`,
            err
          );
        }
      }
      const { error: softDeleteError } = await supabase
        .from('financial_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (softDeleteError) {
        console.error(
          `[API Qonto Invoices] Soft-delete failed for ${existing.id}:`,
          softDeleteError
        );
        return {
          conflict: NextResponse.json(
            {
              success: false,
              error: `Impossible de supprimer la proforma existante (${existing.document_number ?? existing.id}). Veuillez reessayer.`,
            },
            { status: 500 }
          ),
        };
      }
    }
  }

  return { conflict: null };
}
