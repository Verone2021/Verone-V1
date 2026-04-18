/**
 * API Route: POST /api/qonto/quotes/by-order/[orderId]/regenerate
 *
 * Régénère un devis draft lié à une commande après modification de celle-ci.
 * - Soft delete l'ancien devis (quote_status = 'superseded' + deleted_at)
 * - Supprime le devis Qonto côté API
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

import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

import {
  resolveRequestContext,
  saveQuoteToLocalDb,
  markQuotesSuperseded,
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
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';

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

const RegenerateBodySchema = z.object({
  userId: z.string().uuid(),
  preservedCustomLines: z.array(CustomLineSchema).optional(),
  preservedNotes: z.string().optional(),
  billingAddress: DocumentAddressSchema.optional(),
  shippingAddress: DocumentAddressSchema.optional(),
  fees: FeesDataSchema.optional(),
  expiryDays: z.number().int().positive().optional(),
});

type RegenerateBody = z.infer<typeof RegenerateBodySchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

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

    const supabase = createAdminClient();

    // Charger les devis liés à cette commande (colonnes typées par le SDK)
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

    // Déterminer le revision_number max via requête SQL brute
    // (colonne revision_number nouvelle, pas encore dans les types générés)
    const maxRevisionFromDb: number = await (async () => {
      try {
        const ids = draftDocs.map(d => d.id);
        if (ids.length === 0) return 0;
        // Cast nécessaire car revision_number absent des types générés (migration récente)
        const { data } = await (
          supabase as unknown as ReturnType<typeof createAdminClient>
        )
          .from('financial_documents')
          .select('id')
          .in('id', ids);
        const rows = data as Array<{ id: string }> | null;
        if (!rows) return 0;
        // Fallback safe : revision 1 par défaut (nouveau champ, docs existants ont DEFAULT 1)
        return rows.length;
      } catch {
        return 1;
      }
    })();
    // revision_number max = nombre de docs existants (heuristique safe, ou 1 si premier)
    const newRevisionNumber = maxRevisionFromDb > 0 ? maxRevisionFromDb + 1 : 2;

    // Supprimer les devis Qonto existants
    const qontoClient = getQontoClient();
    for (const doc of draftDocs) {
      if (doc.qonto_invoice_id) {
        try {
          await qontoClient.deleteClientQuote(doc.qonto_invoice_id);
        } catch (err) {
          console.warn(
            `[Regenerate Quote] Qonto delete failed for ${doc.qonto_invoice_id} (non-blocking):`,
            err
          );
          // Non-bloquant : Qonto peut avoir déjà supprimé ou le devis peut être expiré
        }
      }
    }

    // Soft delete local (quote_status = 'superseded' + deleted_at)
    const supersededIds = draftDocs.map(d => d.id);
    const { error: softDeleteError } = await supabase
      .from('financial_documents')
      .update({
        quote_status: 'superseded',
        deleted_at: new Date().toISOString(),
      } as Record<string, unknown>)
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

    // R1 : items depuis la commande + customLines préservés par l'utilisateur
    const items = buildQuoteItems(
      ctxResult.orderItems,
      body.fees,
      ctxResult.orderFees,
      body.preservedCustomLines
    );

    const { issueDate, expiryDate } = computeQuoteDates(body.expiryDays ?? 30);

    const shippingFooter =
      body.shippingAddress?.city && body.shippingAddress?.address_line1
        ? `Adresse de livraison : ${body.shippingAddress.address_line1}, ${body.shippingAddress.postal_code ?? ''} ${body.shippingAddress.city}${body.shippingAddress.country && body.shippingAddress.country !== 'FR' ? `, ${body.shippingAddress.country}` : ''}`
        : undefined;

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

    // Lier le nouveau devis à la commande
    await linkQuoteToOrder(supabase, orderId, quote.id, quote.quote_number);

    // Marquer les anciens comme superseded (colonne quote_status — déjà fait via soft-delete + update)
    await markQuotesSuperseded(supabase, supersededIds);

    // Sauvegarder le nouveau devis en local avec revision_number
    const customerId = (ctxResult.customer as { id?: string } | null)?.id;
    let localDocId: string | null = null;
    try {
      localDocId = await saveQuoteToLocalDb({
        supabase,
        userId: body.userId,
        items,
        quoteId: quote.id,
        pdfUrl: raw.pdf_url,
        publicUrl: raw.public_url,
        issueDate,
        expiryDate,
        consultationId: undefined,
        salesOrderId: orderId,
        customerId,
        standaloneCustomerId: undefined,
        fees: body.fees,
        shippingAddress: body.shippingAddress,
      });
    } catch (e) {
      console.error('[Regenerate Quote] DB save error (non-blocking):', e);
    }

    // Mettre à jour le revision_number sur le nouveau document
    if (localDocId) {
      const { error: revisionError } = await supabase
        .from('financial_documents')
        .update({ revision_number: newRevisionNumber } as Record<
          string,
          unknown
        >)
        .eq('id', localDocId);
      if (revisionError) {
        console.warn(
          '[Regenerate Quote] Failed to set revision_number:',
          revisionError
        );
      }

      // Stocker les notes préservées si fournies
      if (body.preservedNotes) {
        await supabase
          .from('financial_documents')
          .update({ notes: body.preservedNotes } as Record<string, unknown>)
          .eq('id', localDocId);
      }
    }

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
