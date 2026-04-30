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

  // [BO-FIN-009 Phase 2] Round-per-line aligné avec trigger DB (R1 zéro discordance Qonto)
  let totalHt = 0;
  let totalTtc = 0;
  for (const item of items) {
    const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
    const lineTtc =
      Math.round(lineHt * (1 + (item.vat_rate_num ?? 0.2)) * 100) / 100;
    totalHt += lineHt;
    totalTtc += lineTtc;
  }
  const totalVat = Math.round((totalTtc - totalHt) * 100) / 100;

  // Déterminer le partner_id (organisation uniquement pour l'instant)
  // [BO-FIN-039] partner_id = org commande TOUJOURS (R5 finance.md)
  // billing_org_id porte l'org de facturation si différente
  let partnerId: string | null = null;
  if (order.customer_type === 'organization') {
    partnerId = order.customer_id ?? null;
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
        billing_org_id: ctx.billingOrgId ?? null,
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
      // [BO-FIN-009 Phase 2] Round-per-line par item, aligné avec trigger DB
      const documentItems = items.map((item, index) => {
        const qty = item.quantity_num ?? 1;
        const unitPriceHt = item.unit_price_ht ?? 0;
        const vatRate = item.vat_rate_num ?? 0.2;
        const lineHt = unitPriceHt * qty;
        const lineTtc = Math.round(lineHt * (1 + vatRate) * 100) / 100;
        const lineTva = Math.round((lineTtc - lineHt) * 100) / 100;
        return {
          document_id: localDocumentId,
          product_id: item.product_id ?? null,
          description:
            item.title + (item.description ? ` - ${item.description}` : ''),
          quantity: qty,
          unit_price_ht: unitPriceHt,
          total_ht: lineHt,
          tva_rate: vatRate * 100,
          tva_amount: lineTva,
          total_ttc: lineTtc,
          sort_order: index,
        };
      });

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
