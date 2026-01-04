/**
 * API Route: /api/qonto/invoices
 * Gestion des factures clients via Qonto API
 *
 * GET  - Liste les factures (query params: status)
 * POST - Crée une facture depuis une commande
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientInvoiceParams } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/server';

type SalesOrder = Database['public']['Tables']['sales_orders']['Row'];
type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

interface ISalesOrderWithRelations extends SalesOrder {
  organisations: Organisation | null;
  individual_customers: IndividualCustomer | null;
  sales_order_items: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number | null;
    notes: string | null;
    products: { id: string; name: string; sku: string | null } | null;
  }>;
}

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

/**
 * GET /api/qonto/invoices
 * Liste les factures avec filtre optionnel par status
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

    return NextResponse.json({
      success: true,
      invoices: result.client_invoices,
      count: result.client_invoices.length,
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

interface IPostRequestBody {
  salesOrderId: string;
  autoFinalize?: boolean;
}

/**
 * POST /api/qonto/invoices
 * Crée une facture depuis une commande client
 *
 * Body:
 * - salesOrderId: UUID de la commande
 * - autoFinalize: boolean (défaut: true)
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const body = (await request.json()) as IPostRequestBody;
    const { salesOrderId, autoFinalize = true } = body;

    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Récupérer la commande avec ses lignes et client
    const supabase = createClient();
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(
        `
        *,
        organisations:organisation_id (*),
        individual_customers:individual_customer_id (*),
        sales_order_items (
          *,
          products:product_id (id, name, sku)
        )
      `
      )
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Cast to typed order
    const typedOrder = order as unknown as ISalesOrderWithRelations;

    const qontoClient = getQontoClient();

    // Récupérer ou créer le client Qonto
    let qontoClientId: string;
    const customerEmail =
      typedOrder.organisations?.email ?? typedOrder.individual_customers?.email;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const customerName: string =
      typedOrder.organisations?.trade_name ??
      typedOrder.organisations?.legal_name ??
      `${typedOrder.individual_customers?.first_name ?? ''} ${typedOrder.individual_customers?.last_name ?? ''}`.trim();

    if (customerEmail) {
      // Chercher le client par email
      const existingClient = await qontoClient.findClientByEmail(customerEmail);
      if (existingClient) {
        qontoClientId = existingClient.id;
      } else {
        // Créer le client
        const billingAddress = typedOrder.billing_address as Record<
          string,
          string
        > | null;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const newClient = await qontoClient.createClient({
          name: customerName ?? 'Client',
          email: customerEmail,
          currency: 'EUR',
          address: billingAddress
            ? {
                streetAddress: billingAddress.street ?? '',
                city: billingAddress.city ?? '',
                zipCode: billingAddress.postal_code ?? '',
                countryCode: billingAddress.country ?? 'FR',
              }
            : undefined,
        });
        qontoClientId = newClient.id;
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
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

    // Mapper les lignes de commande vers items facture
    const items = (typedOrder.sales_order_items ?? []).map(item => ({
      title: item.products?.name ?? 'Article',
      description: item.notes ?? undefined,
      quantity: String(item.quantity ?? 1),
      unit: 'pièce',
      unitPrice: {
        value: String(item.unit_price_ht ?? 0),
        currency: 'EUR',
      },
      vatRate: String((item.tax_rate ?? 20) / 100), // Qonto attend 0.20 pour 20%
    }));

    // Calculer la date d'échéance selon les termes de paiement
    const issueDate = new Date().toISOString().split('T')[0];
    let dueDate: string;
    switch (typedOrder.payment_terms) {
      case 'immediate':
        dueDate = issueDate;
        break;
      case 'net_15':
        dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case 'net_30':
        dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case 'net_60':
        dueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      default:
        dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
    }

    // Créer la facture
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

    // Finaliser automatiquement si demandé
    let finalizedInvoice = invoice;
    if (autoFinalize && invoice.status === 'draft') {
      finalizedInvoice = await qontoClient.finalizeClientInvoice(invoice.id);
    }

    // TODO: Optionnel - stocker la référence dans financial_documents
    // (nécessite d'adapter le schema ou d'utiliser un autre mécanisme)

    return NextResponse.json({
      success: true,
      invoice: finalizedInvoice,
      message: autoFinalize
        ? 'Invoice created and finalized'
        : 'Invoice created as draft',
    });
  } catch (error) {
    console.error('[API Qonto Invoices] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
