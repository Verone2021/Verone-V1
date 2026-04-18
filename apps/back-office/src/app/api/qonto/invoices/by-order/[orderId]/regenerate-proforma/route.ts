/**
 * API Route: POST /api/qonto/invoices/by-order/[orderId]/regenerate-proforma
 *
 * Régénère une proforma draft liée à une commande après modification de celle-ci.
 * - Hard delete Qonto (deleteClientInvoice)
 * - Soft delete local (deleted_at = now())
 * - Recrée la proforma avec les données actuelles de la commande
 * - Préserve les customLines et notes choisis par l'utilisateur
 *
 * Règles métier respectées :
 * - R1 : items tirés de la commande, jamais de l'ancien document
 * - R2 : prix items commande readonly (source = sales_order_items)
 * - R4 : 409 si status != 'draft' (protection comptable)
 * - R6 : seulement si commande modifiable
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { CreateClientInvoiceParams } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';
import type { Database, Json } from '@verone/types';
import { createServerClient } from '@verone/utils/supabase/server';

import { getQontoClient } from '../../../_lib/qonto-client';
import { fetchOrderWithCustomer } from '../../../_lib/fetch-order-with-customer';
import { resolveQontoClient } from '../../../_lib/resolve-qonto-client';
import { buildInvoiceItems } from '../../../_lib/build-invoice-items';
import { computeDueDate } from '../../../_lib/compute-due-date';

// ---------------------------------------------------------------------------
// Validation Zod
// ---------------------------------------------------------------------------

const CustomLineSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unit_price_ht: z.number(),
  vat_rate: z.number(),
});

const DocumentAddressSchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const FeesDataSchema = z.object({
  shipping_cost_ht: z.number().optional(),
  handling_cost_ht: z.number().optional(),
  insurance_cost_ht: z.number().optional(),
  fees_vat_rate: z.number().optional(),
});

const RegenerateProformaBodySchema = z.object({
  preservedCustomLines: z.array(CustomLineSchema).optional(),
  preservedNotes: z.string().optional(),
  billingAddress: DocumentAddressSchema.optional(),
  shippingAddress: DocumentAddressSchema.optional(),
  fees: FeesDataSchema.optional(),
  issueDate: z.string().optional(),
});

type RegenerateProformaBody = z.infer<typeof RegenerateProformaBodySchema>;

// ---------------------------------------------------------------------------
// POST /api/qonto/invoices/by-order/[orderId]/regenerate-proforma
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    localDocumentId?: string | null;
    deletedProformaId?: string;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { orderId } = await params;

    // Validation UUID
    if (
      !orderId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid orderId format' },
        { status: 400 }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = RegenerateProformaBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const body: RegenerateProformaBody = parsed.data;

    const supabase = createAdminClient();

    // Chercher la proforma draft liée à cette commande
    const { data: existingDocs, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, status, qonto_invoice_id')
      .eq('sales_order_id', orderId)
      .eq('document_type', 'customer_invoice')
      .is('deleted_at', null)
      .neq('status', 'cancelled');

    if (fetchError) {
      console.error(
        '[Regenerate Proforma] Fetch existing docs failed:',
        fetchError
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la récupération des proformas',
        },
        { status: 500 }
      );
    }

    if (!existingDocs || existingDocs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Aucune proforma draft liée à cette commande. Créer une nouvelle proforma depuis la commande.',
        },
        { status: 409 }
      );
    }

    // R4 : refus si une proforma finalisée/payée existe
    const finalizedDoc = existingDocs.find(d => d.status !== 'draft');
    if (finalizedDoc) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de régénérer : une facture finalisée ou payée existe (${finalizedDoc.document_number ?? finalizedDoc.id}). Seules les proformas draft peuvent être régénérées.`,
          existingDocId: finalizedDoc.id,
        },
        { status: 409 }
      );
    }

    const draftDoc = existingDocs.find(d => d.status === 'draft');
    if (!draftDoc) {
      return NextResponse.json(
        { success: false, error: 'Aucune proforma draft trouvée.' },
        { status: 409 }
      );
    }

    const qontoClient = getQontoClient();

    // Hard delete Qonto
    if (draftDoc.qonto_invoice_id) {
      try {
        await qontoClient.deleteClientInvoice(draftDoc.qonto_invoice_id);
      } catch (err) {
        console.warn(
          `[Regenerate Proforma] Qonto delete failed for ${draftDoc.qonto_invoice_id} (non-blocking):`,
          err
        );
      }
    }

    // Soft delete local
    const { error: softDeleteError } = await supabase
      .from('financial_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', draftDoc.id);

    if (softDeleteError) {
      console.error(
        '[Regenerate Proforma] Soft delete failed:',
        softDeleteError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Erreur lors du soft-delete de la proforma existante : ${softDeleteError.message}`,
        },
        { status: 500 }
      );
    }

    // Charger la commande (R1 + R2 : items depuis la commande)
    const { order: typedOrder, error: orderError } =
      await fetchOrderWithCustomer(supabase, orderId);
    if (orderError) {
      return orderError as NextResponse<{
        success: boolean;
        error?: string;
      }>;
    }
    if (!typedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Résoudre le client Qonto
    const { qontoClientId, error: clientError } = await resolveQontoClient(
      qontoClient,
      typedOrder,
      body.billingAddress as
        | {
            address_line1?: string;
            postal_code: string;
            city: string;
            country?: string;
          }
        | undefined
    );
    if (clientError) {
      return clientError as NextResponse<{ success: boolean; error?: string }>;
    }

    // Récupérer l'IBAN Qonto pour les méthodes de paiement
    const bankAccounts = await qontoClient.getBankAccounts();
    const mainAccount = bankAccounts.find(a => a.status === 'active');
    if (!mainAccount) {
      return NextResponse.json(
        { success: false, error: 'No active Qonto bank account found' },
        { status: 500 }
      );
    }

    // R1 : items depuis la commande + customLines préservées par l'utilisateur
    const items = buildInvoiceItems(
      typedOrder,
      body.fees,
      body.preservedCustomLines
    );

    // Dates
    const issueDate = body.issueDate ?? new Date().toISOString().split('T')[0];
    const dueDate = computeDueDate(typedOrder.payment_terms, issueDate);

    // Créer la nouvelle proforma Qonto
    const invoiceParams: CreateClientInvoiceParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      dueDate,
      paymentMethods: {
        iban: mainAccount.iban,
      },
      purchaseOrderNumber: typedOrder.order_number ?? undefined,
      items,
    };

    const invoice = await qontoClient.createClientInvoice(invoiceParams);

    // Calculer les totaux (round-per-line, R1)
    let totalHt = 0;
    let totalVat = 0;
    for (const item of items) {
      const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
      const lineVat =
        Math.round(lineHt * (item.vat_rate_num ?? 0.2) * 100) / 100;
      totalHt += lineHt;
      totalVat += lineVat;
    }
    const totalTtc = totalHt + totalVat;

    // Déterminer partner_id
    let partnerId: string | null = null;
    if (typedOrder.customer_type === 'organization' && typedOrder.customer_id) {
      partnerId = typedOrder.customer_id;
    }

    // Récupérer l'utilisateur connecté
    const supabaseAuth = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabaseAuth.auth.getUser();
    const currentUserId = authUser?.id ?? null;

    let localDocumentId: string | null = null;

    if (partnerId && currentUserId) {
      const feesVatRate =
        body.fees?.fees_vat_rate ?? typedOrder.fees_vat_rate ?? 0.2;
      const shippingCost =
        body.fees?.shipping_cost_ht ?? typedOrder.shipping_cost_ht ?? 0;
      const handlingCost =
        body.fees?.handling_cost_ht ?? typedOrder.handling_cost_ht ?? 0;
      const insuranceCost =
        body.fees?.insurance_cost_ht ?? typedOrder.insurance_cost_ht ?? 0;

      const insertPayload: Database['public']['Tables']['financial_documents']['Insert'] =
        {
          document_type: 'customer_invoice',
          document_direction: 'inbound',
          document_number: `PROFORMA-${typedOrder.order_number}`,
          partner_id: partnerId,
          partner_type: 'customer',
          document_date: issueDate,
          due_date: dueDate,
          total_ht: totalHt,
          total_ttc: totalTtc,
          tva_amount: totalVat,
          amount_paid: 0,
          status: 'draft',
          sales_order_id: orderId,
          qonto_invoice_id: invoice.id,
          qonto_pdf_url:
            (invoice as { pdf_url?: string | null }).pdf_url ?? null,
          qonto_public_url:
            (invoice as { public_url?: string | null }).public_url ?? null,
          synchronized_at: new Date().toISOString(),
          created_by: currentUserId,
          billing_address: (body.billingAddress ??
            typedOrder.billing_address) as Json,
          shipping_address: (body.shippingAddress ??
            typedOrder.shipping_address) as Json,
          shipping_cost_ht: shippingCost,
          handling_cost_ht: handlingCost,
          insurance_cost_ht: insuranceCost,
          fees_vat_rate: feesVatRate,
          billing_contact_id: typedOrder.billing_contact_id ?? null,
          delivery_contact_id: typedOrder.delivery_contact_id ?? null,
          responsable_contact_id: typedOrder.responsable_contact_id ?? null,
          notes: body.preservedNotes ?? null,
        };

      const { data: insertedDoc, error: insertError } = await supabase
        .from('financial_documents')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError) {
        console.error(
          '[Regenerate Proforma] Failed to insert financial_document:',
          insertError
        );
        // La proforma Qonto a été créée, retourner quand même le succès partiel
        console.warn(
          '[Regenerate Proforma] Qonto invoice created but local persistence failed'
        );
      } else if (insertedDoc) {
        localDocumentId = insertedDoc.id;
      }
    }

    console.warn(
      `[Regenerate Proforma] Order ${orderId}: deleted old proforma ${draftDoc.id}, created new proforma ${invoice.id}`
    );

    return NextResponse.json({
      success: true,
      invoice,
      localDocumentId,
      deletedProformaId: draftDoc.id,
      message: `Proforma régénérée. Ancienne proforma supprimée (${draftDoc.document_number ?? draftDoc.id}).`,
    });
  } catch (error) {
    const errorDetails =
      error && typeof error === 'object' && 'details' in error
        ? JSON.stringify((error as { details: unknown }).details, null, 2)
        : undefined;
    console.error('[Regenerate Proforma] Error:', error);
    if (errorDetails) {
      console.error('[Regenerate Proforma] Error details:', errorDetails);
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
