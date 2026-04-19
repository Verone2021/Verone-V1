/**
 * API Route: POST /api/qonto/quotes/by-order/[orderId]/regenerate
 *
 * Régénère un devis draft lié à une commande après modification de celle-ci.
 * - Soft delete local EN PREMIER (bloquant) — atomicité garantie
 * - Supprime le devis Qonto côté API (non-bloquant, avec log)
 * - Crée un nouveau devis avec revision_number incrémenté
 * - Préserve les customLines et notes choisis par l'utilisateur
 *
 * Règles métier respectées :
 * - R1 : items tirés de la commande, jamais de l'ancien devis
 * - R2 : prix items commande readonly (source = sales_order_items)
 * - R4 : 409 si status != 'draft'
 * - R6 : items/prix depuis la commande uniquement
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';

import {
  resolveRequestContext,
  linkQuoteToOrder,
} from '../../../route.context';
import {
  buildQuoteItems,
  computeQuoteDates,
  resolveBillingAddress,
  resolveCustomerInfo,
  resolveQontoClient,
} from '../../../route.helpers';
import type { IQontoQuoteRaw } from '../../../route.helpers';
import {
  getQontoClient,
  buildShippingFooter,
  persistNewQuote,
} from './_helpers';

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

// userId retiré — résolu via auth serveur (createServerClient)
const RegenerateBodySchema = z.object({
  preservedCustomLines: z.array(CustomLineSchema).optional(),
  preservedNotes: z.string().optional(),
  billingAddress: DocumentAddressSchema.optional(),
  shippingAddress: DocumentAddressSchema.optional(),
  fees: FeesDataSchema.optional(),
  expiryDays: z.number().int().positive().optional(),
});

type RegenerateBody = z.infer<typeof RegenerateBodySchema>;

// ---------------------------------------------------------------------------
// POST /api/qonto/quotes/by-order/[orderId]/regenerate
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    localDocId?: string | null;
    supersededIds?: string[];
    newRevisionNumber?: number;
    message?: string;
    error?: string;
  }>
> {
  try {
    // Auth serveur — userId depuis session, jamais depuis le body
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
    const userId = authUser.id;

    const { orderId } = await params;

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
    const parsed = RegenerateBodySchema.safeParse(rawBody);
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
    const body: RegenerateBody = parsed.data;

    // Opérations admin uniquement APRÈS auth validée
    const supabase = createAdminClient();

    const { data: existingDocs, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, status, qonto_invoice_id')
      .eq('sales_order_id', orderId)
      .eq('document_type', 'customer_quote')
      .is('deleted_at', null)
      .neq('status', 'cancelled');

    if (fetchError) {
      console.error(
        '[Regenerate Quote] Fetch existing docs failed:',
        fetchError
      );
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des devis' },
        { status: 500 }
      );
    }

    if (!existingDocs || existingDocs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Aucun devis draft lié à cette commande. Créer un nouveau devis depuis la commande.',
        },
        { status: 409 }
      );
    }

    // R4 : refus si un devis finalisé/accepté existe
    const finalizedDoc = existingDocs.find(
      d => d.status !== 'draft' && d.status !== 'cancelled'
    );
    if (finalizedDoc) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de régénérer : un devis finalisé ou accepté existe (${finalizedDoc.document_number ?? finalizedDoc.id}). Seuls les devis draft peuvent être régénérés.`,
          existingDocId: finalizedDoc.id,
        },
        { status: 409 }
      );
    }

    const draftDocs = existingDocs.filter(d => d.status === 'draft');
    const supersededIds = draftDocs.map(d => d.id);

    // revision_number correct depuis la DB via requête séparée
    // (colonne ajoutée en migration récente, pas encore dans les types générés)
    let newRevisionNumber = 2;
    if (supersededIds.length > 0) {
      const { data: revRows } = await (
        supabase as unknown as ReturnType<typeof createAdminClient>
      )
        .from('financial_documents')
        .select('revision_number')
        .in('id', supersededIds)
        .order('revision_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const maxRev =
        (revRows as { revision_number?: number } | null)?.revision_number ?? 1;
      newRevisionNumber = maxRev + 1;
    }

    // Soft-delete local EN PREMIER (bloquant) — garantit l'atomicité
    const { error: softDeleteError } = await supabase
      .from('financial_documents')
      .update({
        quote_status: 'superseded',
        deleted_at: new Date().toISOString(),
      })
      .in('id', supersededIds);

    if (softDeleteError) {
      console.error('[Regenerate Quote] Soft delete failed:', softDeleteError);
      return NextResponse.json(
        {
          success: false,
          error: `Erreur lors du soft-delete des devis existants : ${softDeleteError.message}`,
        },
        { status: 500 }
      );
    }

    // Qonto delete (non-bloquant, avec log explicite)
    const qontoClient = getQontoClient();
    for (const doc of draftDocs) {
      if (doc.qonto_invoice_id) {
        try {
          await qontoClient.deleteClientQuote(doc.qonto_invoice_id);
        } catch (err) {
          console.error(
            `[Regenerate Quote] Qonto delete failed for quote ${doc.qonto_invoice_id}:`,
            err
          );
          // Non-bloquant — soft-delete local déjà effectué
        }
      }
    }

    // Résoudre le contexte commande (R1 + R2 : items depuis la commande)
    const ctxResult = await resolveRequestContext(
      supabase,
      qontoClient,
      orderId,
      undefined
    );
    if ('errorResponse' in ctxResult) {
      return ctxResult.errorResponse as NextResponse<{
        success: boolean;
        error?: string;
      }>;
    }

    const {
      email: customerEmail,
      name: customerName,
      vatNumber,
      taxId,
    } = resolveCustomerInfo(
      ctxResult.customerType,
      ctxResult.customer,
      undefined
    );

    const qontoAddress = resolveBillingAddress(
      body.billingAddress,
      ctxResult.orderBillingAddress,
      ctxResult.customerType,
      ctxResult.customer
    );
    if (!qontoAddress) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Adresse de facturation incomplète. Ville et code postal requis.',
        },
        { status: 400 }
      );
    }

    const qontoClientType =
      ctxResult.customerType === 'organization' ? 'company' : 'individual';
    const qontoClientId = await resolveQontoClient(
      qontoClient,
      customerName,
      customerEmail,
      qontoClientType,
      qontoAddress,
      vatNumber,
      taxId
    );

    // R1 : items depuis la commande + customLines préservés
    const items = buildQuoteItems(
      ctxResult.orderItems,
      body.fees,
      ctxResult.orderFees,
      body.preservedCustomLines
    );

    const { issueDate, expiryDate } = computeQuoteDates(body.expiryDays ?? 30);
    const shippingFooter = buildShippingFooter(body.shippingAddress);

    const quoteParams: CreateClientQuoteParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      expiryDate,
      purchaseOrderNumber: ctxResult.orderNumber,
      items,
      ...(shippingFooter ? { footer: shippingFooter } : {}),
    };

    const rawQuote = await qontoClient.createClientQuote(quoteParams);
    const raw = rawQuote as IQontoQuoteRaw;
    const quote = {
      id: raw.id,
      quote_number: raw.number ?? raw.quote_number ?? '(brouillon)',
      status: raw.status,
      currency: raw.currency ?? 'EUR',
      total_amount: typeof raw.total_amount === 'number' ? raw.total_amount : 0,
      issue_date: raw.issue_date,
      expiry_date: raw.expiry_date,
      pdf_url: raw.pdf_url,
      public_url: raw.public_url,
    };

    await linkQuoteToOrder(supabase, orderId, quote.id, quote.quote_number);

    const customerId = (ctxResult.customer as { id?: string } | null)?.id;
    const localDocId = await persistNewQuote({
      supabase,
      userId,
      orderId,
      supersededIds,
      quoteId: quote.id,
      pdfUrl: raw.pdf_url,
      publicUrl: raw.public_url,
      issueDate,
      expiryDate,
      customerId,
      items,
      fees: body.fees,
      shippingAddress: body.shippingAddress,
      preservedNotes: body.preservedNotes,
      newRevisionNumber,
    });

    console.warn(
      `[Regenerate Quote] Order ${orderId}: superseded ${supersededIds.length} quote(s), created new revision ${newRevisionNumber}`
    );

    return NextResponse.json({
      success: true,
      quote,
      localDocId,
      supersededIds,
      newRevisionNumber,
      message: `Devis régénéré (révision ${newRevisionNumber}). ${supersededIds.length} ancien(s) devis superseded.`,
    });
  } catch (error) {
    const errorDetails =
      error && typeof error === 'object' && 'details' in error
        ? JSON.stringify((error as { details: unknown }).details, null, 2)
        : undefined;
    console.error('[Regenerate Quote] Error:', error);
    if (errorDetails) {
      console.error('[Regenerate Quote] Error details:', errorDetails);
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
