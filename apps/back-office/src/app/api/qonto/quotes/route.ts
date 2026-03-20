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
        purchase_order_number: q.purchase_order_number ?? null,
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

/**
 * Données client pour devis standalone (sans commande)
 */
interface IStandaloneCustomer {
  customerId: string; // ID organisation ou individual_customer
  customerType: 'organization' | 'individual';
}

interface IPostRequestBody {
  salesOrderId?: string; // Optionnel: si absent, création standalone
  customer?: IStandaloneCustomer; // Requis si pas de salesOrderId
  expiryDays?: number; // Nombre de jours avant expiration (défaut: 30)
  billingAddress?: {
    address_line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  fees?: IFeesData;
  customLines?: ICustomLine[];
}

/**
 * POST /api/qonto/quotes
 * Crée un devis depuis une commande client
 *
 * Body:
 * - salesOrderId?: UUID de la commande (optionnel pour devis standalone)
 * - customer?: { customerId, customerType } (requis si pas de salesOrderId)
 * - expiryDays: nombre de jours avant expiration (défaut: 30)
 * - customLines: lignes personnalisées (requises si pas de salesOrderId)
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
    const {
      salesOrderId,
      customer: standaloneCustomer,
      expiryDays = 30,
      billingAddress: bodyBillingAddress,
      fees,
      customLines,
    } = body;

    // Validation: soit salesOrderId, soit customer + customLines
    if (!salesOrderId && !standaloneCustomer) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId ou customer est requis' },
        { status: 400 }
      );
    }

    if (!salesOrderId && (!customLines || customLines.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'customLines est requis pour un devis standalone (sans commande)',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const qontoClient = getQontoClient();

    // Variables communes
    let customer: Organisation | IndividualCustomer | null = null;
    let customerType: string = 'organization';
    let orderNumber: string | undefined;
    let orderItems: ISalesOrderWithItems['sales_order_items'] = [];
    let orderShippingCostHt = 0;
    let orderHandlingCostHt = 0;
    let orderInsuranceCostHt = 0;
    let orderFeesVatRate = 0.2;
    let orderBillingAddress: Record<string, string> | null = null;

    if (salesOrderId) {
      // Mode commande: récupérer la commande avec ses lignes
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id, order_number, customer_id, customer_type, individual_customer_id,
          billing_address, shipping_address,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          sales_order_items (
            id, quantity, unit_price_ht, tax_rate, notes,
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

      // Fetch customer depuis la commande
      if (orderWithItems.customer_id && orderWithItems.customer_type) {
        if (orderWithItems.customer_type === 'organization') {
          const { data: org } = await supabase
            .from('organisations')
            .select('*')
            .eq('id', orderWithItems.customer_id)
            .single();
          customer = org;
        } else if (
          orderWithItems.customer_type === 'individual' &&
          orderWithItems.individual_customer_id
        ) {
          const { data: indiv } = await supabase
            .from('individual_customers')
            .select('id, first_name, last_name, email')
            .eq('id', orderWithItems.individual_customer_id)
            .single();
          customer = indiv as IndividualCustomer | null;
        }
      }

      customerType = orderWithItems.customer_type ?? 'organization';
      orderNumber = orderWithItems.order_number ?? undefined;

      // Guard anti-doublon: vérifier si un devis Qonto existe déjà pour cette commande
      if (orderNumber) {
        try {
          const existingQuotes = await qontoClient.getClientQuotes();
          const duplicate = existingQuotes.client_quotes.find(
            q =>
              q.purchase_order_number === orderNumber &&
              q.status !== 'declined' &&
              q.status !== 'expired'
          );
          if (duplicate) {
            const qDup = duplicate as typeof duplicate & { number?: string };
            return NextResponse.json(
              {
                success: false,
                error: `Un devis existe déjà pour la commande ${orderNumber} (${qDup.number ?? qDup.quote_number ?? duplicate.id}). Modifiez-le ou supprimez-le avant d'en créer un nouveau.`,
                existingQuoteId: duplicate.id,
              },
              { status: 409 }
            );
          }
        } catch (checkErr) {
          // Non-blocking: if check fails, proceed with creation (Qonto is fallback)
          console.warn(
            '[API Qonto Quotes] Duplicate check failed (non-blocking):',
            checkErr
          );
        }
      }

      orderItems = orderWithItems.sales_order_items ?? [];
      orderShippingCostHt = orderWithItems.shipping_cost_ht ?? 0;
      orderHandlingCostHt = orderWithItems.handling_cost_ht ?? 0;
      orderInsuranceCostHt = orderWithItems.insurance_cost_ht ?? 0;
      orderFeesVatRate = orderWithItems.fees_vat_rate ?? 0.2;
      orderBillingAddress = orderWithItems.billing_address as Record<
        string,
        string
      > | null;
    } else if (standaloneCustomer) {
      // Mode standalone: récupérer le customer directement
      customerType = standaloneCustomer.customerType;

      if (standaloneCustomer.customerType === 'organization') {
        const { data: org } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', standaloneCustomer.customerId)
          .single();
        customer = org;
      } else {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('id, first_name, last_name, email')
          .eq('id', standaloneCustomer.customerId)
          .single();
        customer = indiv as IndividualCustomer | null;
      }

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Client introuvable' },
          { status: 404 }
        );
      }
    }

    // Extraire email et nom selon le type de customer
    let customerEmail: string | null = null;
    let customerName = 'Client';

    // Tax identification: vatNumber = TVA EU, taxId = SIRET
    let vatNumber: string | undefined;
    let taxId: string | undefined;

    if (customerType === 'organization' && customer) {
      const org = customer as Organisation;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
      // Separate VAT number (TVA intra-communautaire) and SIRET
      vatNumber = org.vat_number ?? undefined;
      taxId = org.siret ?? undefined;
    } else if (customerType === 'individual' && customer) {
      const indiv = customer as IndividualCustomer;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    // Note: vatNumber/taxId NOT mandatory for quotes (unlike invoices)

    // Récupérer ou créer le client Qonto
    let qontoClientId: string;

    // Résoudre l'adresse de facturation (3 priorités) :
    // Priorité 1: bodyBillingAddress (envoyé par le modal)
    // Priorité 2: orderBillingAddress (JSONB de la commande en DB)
    // Priorité 3: colonnes directes de l'organisation (fallback)
    let resolvedCity: string | undefined;
    let resolvedZipCode: string | undefined;
    let resolvedStreet = '';
    let resolvedCountry = 'FR';

    if (bodyBillingAddress?.city) {
      resolvedCity = bodyBillingAddress.city;
      resolvedZipCode = bodyBillingAddress.postal_code;
      resolvedStreet = bodyBillingAddress.address_line1 ?? '';
      resolvedCountry = bodyBillingAddress.country ?? 'FR';
    } else if (orderBillingAddress?.city) {
      resolvedCity = orderBillingAddress.city;
      resolvedZipCode = orderBillingAddress.postal_code;
      resolvedStreet =
        orderBillingAddress.street ??
        orderBillingAddress.address ??
        orderBillingAddress.address_line1 ??
        '';
      resolvedCountry = orderBillingAddress.country ?? 'FR';
    } else if (customerType === 'organization' && customer) {
      const org = customer as Organisation;
      resolvedCity = org.city ?? undefined;
      resolvedZipCode = org.postal_code ?? undefined;
      resolvedStreet = org.address_line1 ?? '';
      resolvedCountry = org.country ?? 'FR';
    }

    if (!resolvedCity && !resolvedZipCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Adresse de facturation incomplète. Ville et code postal requis.',
        },
        { status: 400 }
      );
    }

    const qontoAddress = {
      streetAddress: resolvedStreet,
      city: resolvedCity ?? '',
      zipCode: resolvedZipCode ?? '',
      countryCode: resolvedCountry,
    };

    const qontoClientType =
      customerType === 'organization' ? 'company' : 'individual';

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
        vatNumber: vatNumber ?? taxId,
      });
      qontoClientId = existingClient.id;
    } else {
      const newClient = await qontoClient.createClient({
        name: customerName ?? 'Client',
        type: qontoClientType,
        email: customerEmail ?? undefined,
        currency: 'EUR',
        address: qontoAddress,
        vatNumber: vatNumber ?? taxId,
      });
      qontoClientId = newClient.id;
    }

    // Mapper les lignes de commande vers items devis
    const items = orderItems.map(item => ({
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
    const feesVatRate = fees?.fees_vat_rate ?? orderFeesVatRate;

    // Ajouter les frais de livraison
    const shippingCost = fees?.shipping_cost_ht ?? orderShippingCostHt;
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
    const handlingCost = fees?.handling_cost_ht ?? orderHandlingCostHt;
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
    const insuranceCost = fees?.insurance_cost_ht ?? orderInsuranceCostHt;
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

      purchaseOrderNumber: orderNumber,
      items,
    };

    const rawQuote = await qontoClient.createClientQuote(quoteParams);

    // Map Qonto response (same logic as GET handler)
    const q = rawQuote as typeof rawQuote & {
      number?: string;
      total_amount?:
        | number
        | string
        | { value: string; currency?: string }
        | null;
    };

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
        parsedAmount = parseFloat(totalAmt.value) || 0;
      }
    } else if (q.total_amount_cents) {
      parsedAmount = q.total_amount_cents / 100;
    }

    const mappedQuote = {
      id: q.id,
      quote_number: q.number ?? q.quote_number ?? '(brouillon)',
      status: q.status,
      currency: q.currency ?? 'EUR',
      total_amount: parsedAmount,
      issue_date: q.issue_date,
      expiry_date: q.expiry_date,
      pdf_url: q.pdf_url,
      public_url: q.public_url,
    };

    return NextResponse.json({
      success: true,
      quote: mappedQuote,
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
