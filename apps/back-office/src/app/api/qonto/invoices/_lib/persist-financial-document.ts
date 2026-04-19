import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';
import type {
  ISalesOrderWithCustomer,
  IInvoiceItem,
  IAddressData,
} from './types';

interface IPersistCtx {
  order: ISalesOrderWithCustomer;
  items: IInvoiceItem[];
  issueDate: string;
  dueDate: string;
  autoFinalize: boolean;
  salesOrderId: string;
  bodyBillingAddress: IAddressData | undefined;
  bodyShippingAddress: IAddressData | undefined;
  fees: {
    shippingCost: number;
    handlingCost: number;
    insuranceCost: number;
    feesVatRate: number;
  };
  finalizedInvoice: {
    id: string;
    invoice_number?: string | null;
    pdf_url?: string | null;
    public_url?: string | null;
  };
  /** [BO-FIN-037] Org de facturation effective (si différente de order.customer_id) */
  billingOrgId?: string;
}

export async function persistFinancialDocument(
  supabase: SupabaseClient<Database>,
  ctx: IPersistCtx
): Promise<{ localDocumentId: string | null; error: NextResponse | null }> {
  const {
    order,
    items,
    issueDate,
    dueDate,
    autoFinalize,
    salesOrderId,
    bodyBillingAddress,
    bodyShippingAddress,
    fees,
    finalizedInvoice,
  } = ctx;

  // Calculer les totaux
  let totalHt = 0;
  let totalVat = 0;
  for (const item of items) {
    const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
    const lineVat = lineHt * (item.vat_rate_num ?? 0.2);
    totalHt += lineHt;
    totalVat += lineVat;
  }
  const totalTtc = totalHt + totalVat;

  // Déterminer le partner_id (organisation uniquement pour l'instant)
  // [BO-FIN-037] Si billingOrgId fourni, il prime sur order.customer_id
  let partnerId: string | null = null;
  if (order.customer_type === 'organization') {
    partnerId = ctx.billingOrgId ?? order.customer_id ?? null;
  }

  // Récupérer l'utilisateur connecté
  const supabaseAuth = await createServerClient();
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();
  const currentUserId = authUser?.id ?? null;

  // INSERT dans financial_documents (avec données sync de la commande)
  let localDocumentId: string | null = null;
  if (partnerId) {
    const insertPayload: Database['public']['Tables']['financial_documents']['Insert'] =
      {
        document_type: 'customer_invoice',
        document_direction: 'inbound',
        document_number: autoFinalize
          ? (finalizedInvoice.invoice_number ??
            ((finalizedInvoice as unknown as Record<string, unknown>)
              .number as string))
          : `PROFORMA-${order.order_number}`,
        partner_id: partnerId,
        partner_type: 'customer',
        document_date: issueDate,
        due_date: dueDate,
        total_ht: totalHt,
        total_ttc: totalTtc,
        tva_amount: totalVat,
        amount_paid: 0,
        status: autoFinalize ? 'sent' : 'draft',
        sales_order_id: salesOrderId,
        qonto_invoice_id: finalizedInvoice.id,
        qonto_pdf_url: finalizedInvoice.pdf_url ?? null,
        qonto_public_url: finalizedInvoice.public_url ?? null,
        synchronized_at: new Date().toISOString(),
        created_by: currentUserId!,
        // Données synchronisées : body (édité par l'utilisateur) > commande DB
        billing_address: (bodyBillingAddress ?? order.billing_address) as Json,
        shipping_address: (bodyShippingAddress ??
          order.shipping_address) as Json,
        shipping_cost_ht: fees.shippingCost,
        handling_cost_ht: fees.handlingCost,
        insurance_cost_ht: fees.insuranceCost,
        fees_vat_rate: fees.feesVatRate,
        billing_contact_id: order.billing_contact_id ?? null,
        delivery_contact_id: order.delivery_contact_id ?? null,
        responsable_contact_id: order.responsable_contact_id ?? null,
      };
    const { data: insertedDoc, error: insertDocError } = await supabase
      .from('financial_documents')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertDocError) {
      console.error(
        '[API Qonto Invoices] Failed to insert financial_document:',
        JSON.stringify(insertDocError)
      );
      // TEMPORAIRE: retourner l'erreur pour diagnostic
      return {
        localDocumentId: null,
        error: NextResponse.json(
          {
            success: false,
            error: `Erreur creation document local: ${insertDocError.message ?? insertDocError.code ?? JSON.stringify(insertDocError)}`,
            invoice: {
              id: finalizedInvoice.id,
              invoice_number: finalizedInvoice.invoice_number,
            },
          },
          { status: 500 }
        ),
      };
    } else if (insertedDoc) {
      localDocumentId = insertedDoc.id;

      // INSERT dans financial_document_items
      // Note: Cette table existe dans la DB mais peut ne pas être dans les types générés
      const documentItems = items.map((item, index) => ({
        document_id: localDocumentId,
        product_id: item.product_id ?? null,
        description:
          item.title + (item.description ? ` - ${item.description}` : ''),
        quantity: item.quantity_num ?? 1,
        unit_price_ht: item.unit_price_ht ?? 0,
        total_ht: (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1),
        tva_rate: (item.vat_rate_num ?? 0.2) * 100, // Stocké en % (20.00)
        tva_amount:
          (item.unit_price_ht ?? 0) *
          (item.quantity_num ?? 1) *
          (item.vat_rate_num ?? 0.2),
        total_ttc:
          (item.unit_price_ht ?? 0) *
          (item.quantity_num ?? 1) *
          (1 + (item.vat_rate_num ?? 0.2)),
        sort_order: index,
      }));

      // Table financial_document_items existe dans la DB mais pas dans les types générés
      const { error: insertItemsError } = await (
        supabase as unknown as {
          from: (table: string) => {
            insert: (data: unknown[]) => Promise<{ error: unknown }>;
          };
        }
      )
        .from('financial_document_items')
        .insert(documentItems);

      if (insertItemsError) {
        console.error(
          '[API Qonto Invoices] Failed to insert document items:',
          insertItemsError
        );
      }
    }
  } else {
    console.warn(
      '[API Qonto Invoices] Skipping local storage - no organisation partner_id (individual customer)'
    );
  }

  return { localDocumentId, error: null };
}
