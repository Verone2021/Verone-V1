/**
 * API Route: /api/qonto/invoices
 * Gestion des factures clients via Qonto API
 *
 * GET  - Liste les factures (query params: status)
 * POST - Crée une facture depuis une commande
 *
 * Security:
 * - Rate limited (60 req/min)
 * - Input validation with Zod
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { CreateClientInvoiceParams } from '@verone/integrations/qonto';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@verone/utils/security';
import { createAdminClient } from '@verone/utils/supabase/server';

import { getQontoClient } from './_lib/qonto-client';
import { enrichInvoicesList } from './_lib/enrich-invoices-list';
import { checkAndCleanExistingInvoices } from './_lib/duplicate-guard';
import { fetchOrderWithCustomer } from './_lib/fetch-order-with-customer';
import { resolveQontoClient } from './_lib/resolve-qonto-client';
import { buildInvoiceItems } from './_lib/build-invoice-items';
import { computeDueDate } from './_lib/compute-due-date';
import { persistFinancialDocument } from './_lib/persist-financial-document';
import type { IPostRequestBody } from './_lib/types';

/**
 * GET /api/qonto/invoices
 * Liste les factures avec filtre optionnel par status
 * Enrichit les factures Qonto avec les données locales (local_pdf_path, etc.)
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    invoices?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'draft'
      | 'unpaid'
      | 'paid'
      | 'overdue'
      | 'cancelled'
      | null;

    const client = getQontoClient();
    const result = await client.getClientInvoices(
      status ? { status } : undefined
    );

    const supabase = createAdminClient();
    const enrichedInvoices = await enrichInvoicesList(result, supabase);

    return NextResponse.json({
      success: true,
      invoices: enrichedInvoices,
      count: enrichedInvoices.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Invoices] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qonto/invoices
 * Crée une facture depuis une commande client
 *
 * Body:
 * - salesOrderId: UUID de la commande
 * - autoFinalize: boolean (défaut: false)
 * - fees: optional fee overrides
 * - customLines: optional additional invoice lines
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    message?: string;
    error?: string;
  }>
> {
  // Rate limiting
  const rateLimitResult = withRateLimit(request, RATE_LIMIT_PRESETS.api);
  if (!rateLimitResult.success) {
    return rateLimitResult.response as NextResponse<{
      success: boolean;
      error?: string;
    }>;
  }

  try {
    // Parse request body (simple validation, no DOMPurify to avoid ERR_REQUIRE_ESM)
    const body = (await request.json()) as IPostRequestBody;

    const {
      salesOrderId,
      autoFinalize = false,
      issueDate: customIssueDate,
      label,
      billingAddress: bodyBillingAddress,
      shippingAddress: bodyShippingAddress,
      fees,
      customLines,
      billingOrgId,
    } = body;

    // Basic validation
    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Utilise createAdminClient pour bypasser RLS (API route sans contexte user)
    const supabase = createAdminClient();

    const qontoClientForDelete = getQontoClient();

    // Guard anti-doublon
    const { conflict } = await checkAndCleanExistingInvoices(
      supabase,
      qontoClientForDelete,
      salesOrderId
    );
    if (conflict)
      return conflict as NextResponse<{
        success: boolean;
        error?: string;
      }>;

    // Fetch order + customer
    const { order: typedOrder, error: orderError } =
      await fetchOrderWithCustomer(supabase, salesOrderId);
    if (orderError)
      return orderError as NextResponse<{
        success: boolean;
        error?: string;
      }>;
    if (!typedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const qontoClient = getQontoClient();

    // Resolve Qonto client (avec override org de facturation si fourni)
    const { qontoClientId, error: clientError } = await resolveQontoClient(
      qontoClient,
      typedOrder,
      bodyBillingAddress,
      billingOrgId,
      supabase
    );
    if (clientError)
      return clientError as NextResponse<{
        success: boolean;
        error?: string;
      }>;

    // Récupérer l'IBAN Qonto pour les méthodes de paiement
    const bankAccounts = await qontoClient.getBankAccounts();
    const mainAccount = bankAccounts.find(a => a.status === 'active');
    if (!mainAccount) {
      return NextResponse.json(
        { success: false, error: 'No active Qonto bank account found' },
        { status: 500 }
      );
    }

    // Build items
    const items = buildInvoiceItems(typedOrder, fees, customLines);

    // Compute dates
    const issueDate = customIssueDate ?? new Date().toISOString().split('T')[0];
    const dueDate = computeDueDate(typedOrder.payment_terms, issueDate);

    // Créer la facture
    const invoiceParams: CreateClientInvoiceParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      dueDate,
      paymentMethods: {
        iban: mainAccount.iban,
      },
      header: label ?? undefined,
      purchaseOrderNumber: typedOrder.order_number ?? undefined,
      items,
    };

    let invoice = await qontoClient.createClientInvoice(invoiceParams);

    // Vérifier que Qonto a respecté la date envoyée
    // Si Qonto a overridé la date (ex: lors de la création), on corrige via update
    const qontoIssueDate = (invoice as { issue_date?: string }).issue_date;
    if (qontoIssueDate && qontoIssueDate !== issueDate) {
      console.warn(
        `[API Qonto Invoices] Date mismatch: sent ${issueDate}, got ${qontoIssueDate}. Correcting...`
      );
      invoice = await qontoClient.updateClientInvoice(invoice.id, {
        issueDate,
      });
      console.warn(`[API Qonto Invoices] Date corrected to ${issueDate}`);
    }

    // Finaliser automatiquement si demandé
    let finalizedInvoice = invoice;
    if (autoFinalize && invoice.status === 'draft') {
      finalizedInvoice = await qontoClient.finalizeClientInvoice(invoice.id);
    }

    // Computed fees values for persist ctx
    const feesVatRate = fees?.fees_vat_rate ?? typedOrder.fees_vat_rate ?? 0.2;
    const shippingCost =
      fees?.shipping_cost_ht ?? typedOrder.shipping_cost_ht ?? 0;
    const handlingCost =
      fees?.handling_cost_ht ?? typedOrder.handling_cost_ht ?? 0;
    const insuranceCost =
      fees?.insurance_cost_ht ?? typedOrder.insurance_cost_ht ?? 0;

    // ========================================
    // STOCKAGE LOCAL DANS FINANCIAL_DOCUMENTS
    // ========================================
    const { localDocumentId, error: persistError } =
      await persistFinancialDocument(supabase, {
        order: typedOrder,
        items,
        issueDate,
        dueDate,
        autoFinalize,
        salesOrderId,
        bodyBillingAddress,
        bodyShippingAddress,
        fees: { shippingCost, handlingCost, insuranceCost, feesVatRate },
        finalizedInvoice,
      });
    if (persistError)
      return persistError as NextResponse<{
        success: boolean;
        error?: string;
      }>;

    return NextResponse.json({
      success: true,
      invoice: finalizedInvoice,
      localDocumentId,
      message: autoFinalize
        ? 'Invoice created and finalized'
        : 'Invoice created as draft',
    });
  } catch (error) {
    // Log avec détails complets pour QontoError
    const errorDetails =
      error && typeof error === 'object' && 'details' in error
        ? JSON.stringify((error as { details: unknown }).details, null, 2)
        : undefined;
    console.error('[API Qonto Invoices] POST error:', error);
    if (errorDetails) {
      console.error('[API Qonto Invoices] Error details:', errorDetails);
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
