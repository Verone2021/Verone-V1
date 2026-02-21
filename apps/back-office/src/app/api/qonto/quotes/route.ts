/**
 * API Route: /api/qonto/quotes
 * Gestion des devis clients via Qonto API
 *
 * GET  - Liste les devis
 * POST - Crée un devis depuis une commande
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';
import { createAdminClient } from '@verone/utils/supabase/server';

type SalesOrder = Database['public']['Tables']['sales_orders']['Row'];
type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

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
 * GET /api/qonto/quotes
 * Liste les devis avec filtre optionnel par status
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    quotes?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'draft'
      | 'finalized'
      | 'accepted'
      | 'declined'
      | 'expired'
      | null;

    const client = getQontoClient();
    const result = await client.getClientQuotes(
      status ? { status } : undefined
    );

    // Map Qonto response to our expected format
    // Qonto API uses 'number' for quote number and amounts might be strings or objects
    const mappedQuotes = result.client_quotes.map(quote => {
      // Cast to any to access potential extra fields from Qonto API
      const q = quote as typeof quote & {
        number?: string;
        total_amount?:
          | number
          | string
          | { value: string; currency?: string }
          | null;
      };

      // Parse total_amount from various formats Qonto might return
      let parsedAmount = 0;
      const totalAmt = q.total_amount as
        | number
        | string
        | { value: string }
        | null
        | undefined;

      if (totalAmt !== null && totalAmt !== undefined) {
        if (typeof totalAmt === 'number') {
          parsedAmount = totalAmt;
        } else if (typeof totalAmt === 'string') {
          parsedAmount = parseFloat(totalAmt) || 0;
        } else if (typeof totalAmt === 'object' && 'value' in totalAmt) {
          // Handle { value: "123.45", currency: "EUR" } format
          parsedAmount = parseFloat(totalAmt.value) || 0;
        }
      } else if (q.total_amount_cents) {
        // Fallback to cents
        parsedAmount = q.total_amount_cents / 100;
      }

      return {
        id: q.id,
        // Qonto uses 'number' not 'quote_number'
        quote_number: q.number ?? q.quote_number ?? '-',
        status: q.status,
        currency: q.currency ?? 'EUR',
        total_amount: parsedAmount,
        issue_date: q.issue_date,
        expiry_date: q.expiry_date,
        client: q.client,
        converted_to_invoice_id: q.converted_to_invoice_id,
      };
    });

    return NextResponse.json({
      success: true,
      quotes: mappedQuotes,
      count: mappedQuotes.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Quotes] GET error:', error);
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
  expiryDays?: number; // Nombre de jours avant expiration (défaut: 30)
  fees?: IFeesData;
  customLines?: ICustomLine[];
}

/**
 * POST /api/qonto/quotes
 * Crée un devis depuis une commande client
 *
 * Body:
 * - salesOrderId: UUID de la commande
 * - expiryDays: nombre de jours avant expiration (défaut: 30)
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const body = (await request.json()) as IPostRequestBody;
    const { salesOrderId, expiryDays = 30, fees, customLines } = body;

    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Récupérer la commande avec ses lignes
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
      console.error('[API Qonto Quotes] Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderWithItems = order as ISalesOrderWithItems;

    // Fetch manuel du customer selon customer_type
    let customer: Organisation | IndividualCustomer | null = null;

    if (orderWithItems.customer_id && orderWithItems.customer_type) {
      if (orderWithItems.customer_type === 'organization') {
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

    // Extraire email et nom selon le type de customer
    let customerEmail: string | null = null;
    let customerName = 'Client';

    // Tax identification number (SIRET/TVA) for Qonto client creation
    let vatNumber: string | undefined;

    if (typedOrder.customer_type === 'organization' && typedOrder.customer) {
      const org = typedOrder.customer as Organisation;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
      // Priority: vat_number (TVA intra-communautaire), then siret
      vatNumber = org.vat_number ?? org.siret ?? undefined;
    } else if (
      typedOrder.customer_type === 'individual' &&
      typedOrder.customer
    ) {
      const indiv = typedOrder.customer as IndividualCustomer;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    // Validate: organisations MUST have a tax identification number for quotes
    if (typedOrder.customer_type === 'organization' && !vatNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le SIRET ou numéro de TVA de l'organisation est requis pour créer un devis. Veuillez le renseigner dans la fiche organisation.",
        },
        { status: 400 }
      );
    }

    // Récupérer ou créer le client Qonto
    let qontoClientId: string;
    const billingAddress = typedOrder.billing_address as Record<
      string,
      string
    > | null;

    const qontoAddress = {
      streetAddress: billingAddress?.street ?? billingAddress?.address ?? '',
      city: billingAddress?.city ?? 'Paris',
      zipCode: billingAddress?.postal_code ?? '75001',
      countryCode: billingAddress?.country ?? 'FR',
    };

    const qontoClientType =
      typedOrder.customer_type === 'organization' ? 'company' : 'individual';

    // Stratégie : chercher par email SI disponible, sinon par nom
    let existingClient = customerEmail
      ? await qontoClient.findClientByEmail(customerEmail)
      : null;

    existingClient ??= await qontoClient.findClientByName(customerName);

    if (existingClient) {
      await qontoClient.updateClient(existingClient.id, {
        name: customerName ?? existingClient.name,
        type: qontoClientType,
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = existingClient.id;
    } else {
      const newClient = await qontoClient.createClient({
        name: customerName ?? 'Client',
        type: qontoClientType,
        email: customerEmail ?? undefined,
        currency: 'EUR',
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = newClient.id;
    }

    // Mapper les lignes de commande vers items devis
    const items = (typedOrder.sales_order_items ?? []).map(item => ({
      title: item.products?.name ?? 'Article',

      description: item.notes ?? undefined,
      quantity: String(item.quantity ?? 1),
      unit: 'pièce',
      unitPrice: {
        value: String(item.unit_price_ht ?? 0),
        currency: 'EUR',
      },
      vatRate: String(item.tax_rate ?? 0.2),
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

    // Calculer les dates
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Créer le devis
    const quoteParams: CreateClientQuoteParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      expiryDate,

      purchaseOrderNumber: typedOrder.order_number ?? undefined,
      items,
    };

    const quote = await qontoClient.createClientQuote(quoteParams);

    return NextResponse.json({
      success: true,
      quote,
      message: 'Quote created as draft',
    });
  } catch (error) {
    console.error('[API Qonto Quotes] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
