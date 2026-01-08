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
import { createAdminClient } from '@verone/utils/supabase/server';

type SalesOrder = Database['public']['Tables']['sales_orders']['Row'];
type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

// Interface pour la commande avec items (relations polymorphiques gérées manuellement)
interface ISalesOrderWithItems extends SalesOrder {
  sales_order_items: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number | null;
    notes: string | null;
    products: { id: string; name: string; sku: string | null } | null;
  }>;
}

// Interface enrichie avec customer (après fetch manuel)
interface ISalesOrderWithCustomer extends ISalesOrderWithItems {
  customer: Organisation | IndividualCustomer | null;
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

/**
 * Interface pour les frais de service
 */
interface IFeesData {
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
}

/**
 * Interface pour les lignes personnalisées
 */
interface ICustomLine {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

interface IPostRequestBody {
  salesOrderId: string;
  autoFinalize?: boolean;
  fees?: IFeesData;
  customLines?: ICustomLine[];
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
    const { salesOrderId, autoFinalize = false, fees, customLines } = body; // Défaut: brouillon pour validation

    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Récupérer la commande avec ses lignes (sans jointures polymorphiques)
    // Utilise createAdminClient pour bypasser RLS (API route sans contexte user)
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(
        `
        *,
        sales_order_items (
          *,
          products:product_id (id, name, sku)
        )
      `
      )
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) {
      console.error('[API Qonto Invoices] Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Cast to typed order
    const orderWithItems = order as unknown as ISalesOrderWithItems;

    // Fetch manuel du customer selon customer_type (pattern polymorphique)
    let customer: Organisation | IndividualCustomer | null = null;

    if (orderWithItems.customer_id && orderWithItems.customer_type) {
      if (orderWithItems.customer_type === 'organisation') {
        const { data: org } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', orderWithItems.customer_id)
          .single();
        customer = org;
      } else if (orderWithItems.customer_type === 'individual') {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('*')
          .eq('id', orderWithItems.customer_id)
          .single();
        customer = indiv;
      }
    }

    const typedOrder: ISalesOrderWithCustomer = {
      ...orderWithItems,
      customer,
    };

    const qontoClient = getQontoClient();

    // Récupérer ou créer le client Qonto
    let qontoClientId: string;

    // Extraire email et nom selon le type de customer
    let customerEmail: string | null = null;
    let customerName = 'Client';

    if (typedOrder.customer_type === 'organisation' && typedOrder.customer) {
      const org = typedOrder.customer as Organisation;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
    } else if (
      typedOrder.customer_type === 'individual' &&
      typedOrder.customer
    ) {
      const indiv = typedOrder.customer as IndividualCustomer;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    if (customerEmail) {
      // Construire une adresse valide pour Qonto (fallbacks si données manquantes)
      // Note: billing_address peut avoir différents formats (legacy vs nouveau)
      const billingAddress = typedOrder.billing_address as Record<
        string,
        string
      > | null;

      const qontoAddress = {
        streetAddress: billingAddress?.street ?? billingAddress?.address ?? '',
        city: billingAddress?.city ?? 'Paris', // Fallback requis par Qonto
        zipCode: billingAddress?.postal_code ?? '75001',
        countryCode: billingAddress?.country ?? 'FR',
      };

      // Mapper customer_type vers type Qonto
      const qontoClientType =
        typedOrder.customer_type === 'organisation' ? 'company' : 'individual';

      // Chercher le client par email
      const existingClient = await qontoClient.findClientByEmail(customerEmail);
      if (existingClient) {
        // Client existant - mettre à jour son adresse pour s'assurer qu'elle est présente
        // (Qonto requiert billing_address pour la facturation)
        await qontoClient.updateClient(existingClient.id, {
          name: customerName || existingClient.name,
          type: qontoClientType,
          address: qontoAddress,
        });
        qontoClientId = existingClient.id;
      } else {
        // Créer un nouveau client
        const newClient = await qontoClient.createClient({
          name: customerName || 'Client',
          type: qontoClientType,
          email: customerEmail,
          currency: 'EUR',
          address: qontoAddress,
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
      vatRate: String(item.tax_rate ?? 0.2), // tax_rate est déjà en decimal (0.2 = 20%)
    }));

    // Déterminer la TVA des frais (priorité: body > commande > défaut 20%)
    const feesVatRate = fees?.fees_vat_rate ?? typedOrder.fees_vat_rate ?? 0.2;

    // Ajouter les frais de livraison
    const shippingCost =
      fees?.shipping_cost_ht ?? typedOrder.shipping_cost_ht ?? 0;
    if (shippingCost > 0) {
      items.push({
        title: 'Frais de livraison',
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(shippingCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    // Ajouter les frais de manutention
    const handlingCost =
      fees?.handling_cost_ht ?? typedOrder.handling_cost_ht ?? 0;
    if (handlingCost > 0) {
      items.push({
        title: 'Frais de manutention',
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(handlingCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    // Ajouter les frais d'assurance
    const insuranceCost =
      fees?.insurance_cost_ht ?? typedOrder.insurance_cost_ht ?? 0;
    if (insuranceCost > 0) {
      items.push({
        title: "Frais d'assurance",
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(insuranceCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    // Ajouter les lignes personnalisées (custom lines)
    if (customLines && customLines.length > 0) {
      for (const line of customLines) {
        items.push({
          title: line.title,
          description: line.description,
          quantity: String(line.quantity),
          unit: 'pièce',
          unitPrice: {
            value: String(line.unit_price_ht),
            currency: 'EUR',
          },
          vatRate: String(line.vat_rate),
        });
      }
    }

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
