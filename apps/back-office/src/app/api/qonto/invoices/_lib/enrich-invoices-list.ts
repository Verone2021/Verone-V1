import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import type { ILocalDocData } from './types';

type DocWithExtras = {
  id: string;
  qonto_invoice_id: string | null;
  local_pdf_path?: string | null;
  deleted_at: string | null;
  sales_order_id?: string | null;
  status?: string | null;
  amount_paid?: number | null;
  total_ttc?: number | null;
  partner_id?: string | null;
  /** [BO-FIN-046 Étape 6] Timestamp création document pour détection out-of-sync */
  created_at?: string | null;
  sales_orders?: {
    order_number: string | null;
    /** [BO-FIN-046 Étape 6] Timestamp dernière modification commande */
    updated_at: string | null;
  } | null;
  organisations?: {
    legal_name: string | null;
    trade_name: string | null;
  } | null;
};

export async function enrichInvoicesList(
  result: { client_invoices: Array<{ id: string; status: string }> },
  supabase: SupabaseClient<Database>
): Promise<Array<{ id: string; status: string } & Record<string, unknown>>> {
  const qontoInvoiceIds = result.client_invoices.map(
    (inv: { id: string }) => inv.id
  );

  let localDataMap: Record<string, ILocalDocData> = {};

  if (qontoInvoiceIds.length > 0) {
    // Note: local_pdf_path sera disponible après migration 20260122_005
    const { data: localDocs } = await supabase
      .from('financial_documents')
      // [BO-FIN-046 Étape 6] Ajout created_at + sales_orders.updated_at pour détection out-of-sync
      .select(
        'id, qonto_invoice_id, deleted_at, sales_order_id, status, amount_paid, partner_id, total_ttc, created_at, sales_orders!financial_documents_sales_order_id_fkey(order_number, updated_at), organisations!financial_documents_partner_id_fkey(legal_name, trade_name)'
      )
      .in('qonto_invoice_id', qontoInvoiceIds);

    if (localDocs) {
      localDataMap = (localDocs as DocWithExtras[]).reduce(
        (acc, doc) => {
          if (doc.qonto_invoice_id) {
            acc[doc.qonto_invoice_id] = {
              local_pdf_path: doc.local_pdf_path ?? null,
              local_document_id: doc.id,
              deleted_at: doc.deleted_at,
              sales_order_id: doc.sales_order_id ?? null,
              order_number: doc.sales_orders?.order_number ?? null,
              local_status: doc.status ?? null,
              local_amount_paid: doc.amount_paid
                ? parseFloat(String(doc.amount_paid))
                : null,
              local_total_ttc:
                doc.total_ttc != null
                  ? parseFloat(String(doc.total_ttc))
                  : null,
              partner_id: doc.partner_id ?? null,
              partner_legal_name: doc.organisations?.legal_name ?? null,
              partner_trade_name: doc.organisations?.trade_name ?? null,
              // [BO-FIN-046 Étape 6] Out-of-sync detection fields
              document_created_at: doc.created_at ?? null,
              order_updated_at: doc.sales_orders?.updated_at ?? null,
            };
          }
          return acc;
        },
        {} as Record<string, ILocalDocData>
      );
    }
  }

  // Fusionner les données
  return result.client_invoices.map(
    (invoice: { id: string; status: string }) => {
      const localData = localDataMap[invoice.id];
      // Si le rapprochement local a marqué la facture comme payée, utiliser ce statut
      const localStatus = localData?.local_status;
      const effectiveStatus =
        localStatus === 'paid' || localStatus === 'partially_paid'
          ? localStatus
          : invoice.status;

      return {
        ...invoice,
        status: effectiveStatus,
        // Données locales
        local_pdf_path: localData?.local_pdf_path ?? null,
        local_document_id: localData?.local_document_id ?? null,
        has_local_pdf: !!localData?.local_pdf_path,
        deleted_at: localData?.deleted_at ?? null,
        sales_order_id: localData?.sales_order_id ?? null,
        order_number: localData?.order_number ?? null,
        local_amount_paid: localData?.local_amount_paid ?? null,
        local_total_ttc: localData?.local_total_ttc ?? null,
        partner_id: localData?.partner_id ?? null,
        partner_legal_name: localData?.partner_legal_name ?? null,
        partner_trade_name: localData?.partner_trade_name ?? null,
        // [BO-FIN-046 Étape 6] Out-of-sync detection
        document_created_at: localData?.document_created_at ?? null,
        order_updated_at: localData?.order_updated_at ?? null,
      };
    }
  );
}
