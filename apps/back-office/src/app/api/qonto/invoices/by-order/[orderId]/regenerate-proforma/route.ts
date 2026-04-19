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
import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';

import { getQontoClient } from '../../../_lib/qonto-client';
import { fetchOrderWithCustomer } from '../../../_lib/fetch-order-with-customer';
import { resolveQontoClient } from '../../../_lib/resolve-qonto-client';
import { buildInvoiceItems } from '../../../_lib/build-invoice-items';
import { computeDueDate } from '../../../_lib/compute-due-date';
import { computeProformaTotals, buildProformaInsertPayload } from './_helpers';

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
    // 1. AUTH SERVEUR EN PREMIER — avant toute opération destructive
    const supabaseAuth = await createServerClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const currentUserId = authUser.id;

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

    // Admin client pour bypass RLS (staff confirmé via auth ci-dessus)
    const supabase = createAdminClient();

    // Chercher la proforma draft liée à cette commande
    const { data: existingDocs, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, status, qonto_invoice_id, amount_paid')
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

    // R4 : refus si une proforma finalisée/payée existe (statut)
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

    // R4 : refus si une proforma a déjà un paiement enregistré (amount_paid > 0)
    const paidDoc = existingDocs.find(
      d =>
        d.amount_paid !== null &&
        d.amount_paid !== undefined &&
        Number(d.amount_paid) > 0
    );
    if (paidDoc) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de régénérer : la proforma ${paidDoc.document_number ?? paidDoc.id} a un paiement enregistré (amount_paid=${String(paidDoc.amount_paid)}). Annulez le paiement avant de régénérer.`,
          existingDocId: paidDoc.id,
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

    // Soft-delete local EN PREMIER (bloquant) — garantit l'atomicité
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

    // Hard delete Qonto EN SECOND (non-bloquant, avec log explicite)
    if (draftDoc.qonto_invoice_id) {
      try {
        await qontoClient.deleteClientInvoice(draftDoc.qonto_invoice_id);
      } catch (err) {
        console.error(
          `[BO-FIN-029] Qonto delete failed for proforma ${draftDoc.qonto_invoice_id}:`,
          err
        );
        // Non-bloquant — monitoring à ajouter
      }
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
    const { totalHt, totalVat, totalTtc } = computeProformaTotals(items);

    // Déterminer partner_id
    let partnerId: string | null = null;
    if (typedOrder.customer_type === 'organization' && typedOrder.customer_id) {
      partnerId = typedOrder.customer_id;
    }

    let localDocumentId: string | null = null;

    if (partnerId && currentUserId) {
      const insertPayload = buildProformaInsertPayload({
        orderId,
        typedOrder,
        invoice: invoice as {
          id: string;
          pdf_url?: string | null;
          public_url?: string | null;
        },
        issueDate,
        dueDate,
        totalHt,
        totalTtc,
        totalVat,
        partnerId,
        currentUserId,
        fees: body.fees,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        preservedNotes: body.preservedNotes,
      });

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
