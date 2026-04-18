/**
 * API Route: /api/qonto/quotes/service
 * Création de devis de services (sans commande)
 *
 * POST - Crée un devis de service directement
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';
import { createAdminClient } from '@verone/utils/supabase/server';

import { ServicePostRequestBodySchema } from '../route.schemas';
import type { IServiceItem, IServicePostRequestBody } from '../route.schemas';

type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

type CustomerData = {
  customer: Organisation | IndividualCustomer;
  email: string | null;
  name: string;
};

type QontoAddress = {
  streetAddress: string;
  city: string;
  zipCode: string;
  countryCode: string;
};

// Normaliser country code vers ISO 2 lettres
const COUNTRY_MAP: Record<string, string> = {
  FRANCE: 'FR',
  BELGIQUE: 'BE',
  BELGIUM: 'BE',
  SUISSE: 'CH',
  SWITZERLAND: 'CH',
  LUXEMBOURG: 'LU',
  ALLEMAGNE: 'DE',
  GERMANY: 'DE',
  ESPAGNE: 'ES',
  SPAIN: 'ES',
  ITALIE: 'IT',
  ITALY: 'IT',
  'ROYAUME-UNI': 'GB',
  'UNITED KINGDOM': 'GB',
  UK: 'GB',
};

function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return 'FR';
  const upper = country.toUpperCase().trim();
  if (upper.length === 2) return upper;
  return COUNTRY_MAP[upper] ?? 'FR';
}

/** Fetch customer from Supabase by ID and type */
async function fetchCustomer(
  clientId: string,
  clientType: 'organization' | 'individual'
): Promise<CustomerData | NextResponse> {
  const supabase = createAdminClient();

  if (clientType === 'organization') {
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', clientId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: 'Organisation not found' },
        { status: 404 }
      );
    }
    return {
      customer: org,
      email: org.email ?? null,
      name: org.trade_name ?? org.legal_name ?? 'Client',
    };
  }

  const { data: indiv, error: indivError } = await supabase
    .from('individual_customers')
    .select('*')
    .eq('id', clientId)
    .single();

  if (indivError || !indiv) {
    return NextResponse.json(
      { success: false, error: 'Individual customer not found' },
      { status: 404 }
    );
  }
  return {
    customer: indiv,
    email: indiv.email ?? null,
    name:
      `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client',
  };
}

/** Build Qonto-compatible address from customer */
function buildQontoAddress(
  customer: Organisation | IndividualCustomer,
  clientType: 'organization' | 'individual'
): QontoAddress {
  if (clientType === 'organization') {
    const org = customer as Organisation;
    return {
      streetAddress: org.billing_address_line1 ?? org.address_line1 ?? '',
      city: org.billing_city ?? org.city ?? 'Paris',
      zipCode: org.billing_postal_code ?? org.postal_code ?? '75001',
      countryCode: normalizeCountryCode(org.billing_country ?? org.country),
    };
  }
  const indiv = customer as IndividualCustomer;
  return {
    streetAddress: indiv.address_line1 ?? '',
    city: indiv.city ?? 'Paris',
    zipCode: indiv.postal_code ?? '75001',
    countryCode: normalizeCountryCode(indiv.country),
  };
}

/** Find or create Qonto client, returns client ID */
async function findOrCreateQontoClient(
  qontoClient: QontoClient,
  customerName: string,
  customerEmail: string | undefined,
  clientType: 'organization' | 'individual',
  address: QontoAddress,
  vatNumber: string | undefined
): Promise<string> {
  const qontoClientType =
    clientType === 'organization' ? 'company' : 'individual';

  const existingClient = customerEmail
    ? await qontoClient.findClientByEmail(customerEmail)
    : await qontoClient.findClientByName(customerName);

  if (existingClient) {
    await qontoClient.updateClient(existingClient.id, {
      name: customerName,
      type: qontoClientType,
      email: customerEmail ?? existingClient.email,
      address,
      vatNumber,
    });
    return existingClient.id;
  }

  const newClient = await qontoClient.createClient({
    name: customerName,
    type: qontoClientType,
    email: customerEmail,
    currency: 'EUR',
    address,
    vatNumber,
  });
  return newClient.id;
}

// validateRequest est remplacé par ServicePostRequestBodySchema.safeParse dans le handler POST.

/** Build Qonto quote params from items and dates */
function buildQuoteParams(
  qontoClientId: string,
  items: IServiceItem[],
  validityDays: number,
  reference: string | undefined
): CreateClientQuoteParams {
  const quoteItems = items.map(item => ({
    title: item.title,
    description: item.description,
    quantity: String(item.quantity),
    unit: 'unit',
    unitPrice: { value: String(item.unitPrice), currency: 'EUR' },
    vatRate: String(item.vatRate),
  }));

  const issueDate = new Date().toISOString().split('T')[0];
  const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return {
    clientId: qontoClientId,
    currency: 'EUR',
    issueDate,
    expiryDate,
    purchaseOrderNumber: reference,
    items: quoteItems,
  };
}

/** Format API error for response */
function formatError(error: unknown): NextResponse {
  const errorDetails =
    error && typeof error === 'object' && 'details' in error
      ? JSON.stringify((error as { details: unknown }).details, null, 2)
      : undefined;
  console.error('[API Qonto Quotes Service] POST error:', error);
  if (errorDetails) {
    console.error('[API Qonto Quotes Service] Error details:', errorDetails);
  }
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}

/**
 * POST /api/qonto/quotes/service
 * Crée un devis de service (sans commande)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const parsed = ServicePostRequestBodySchema.safeParse(rawBody);
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
    const body: IServicePostRequestBody = parsed.data;

    const {
      clientId,
      clientType,
      items,
      validityDays = 30,
      reference,
      autoFinalize = false,
    } = body;

    // Fetch customer from DB
    const result = await fetchCustomer(clientId, clientType);
    if (result instanceof NextResponse) return result;
    const { customer, email: customerEmail, name: customerName } = result;

    const hasRealEmail = !!customerEmail;
    const emailForQonto = customerEmail ?? undefined;

    // Resolve address + VAT
    const address = buildQontoAddress(customer, clientType);
    let vatNumber: string | undefined;
    if (clientType === 'organization') {
      vatNumber =
        (customer as Organisation).vat_number ??
        (customer as Organisation).siret ??
        undefined;
    }

    // Qonto client + quote
    const qontoClient = getQontoClient();
    const qontoClientId = await findOrCreateQontoClient(
      qontoClient,
      customerName,
      emailForQonto,
      clientType,
      address,
      vatNumber
    );
    const quoteParams = buildQuoteParams(
      qontoClientId,
      items,
      validityDays,
      reference
    );
    const quote = await qontoClient.createClientQuote(quoteParams);

    // Finalize if requested
    const finalizedQuote =
      autoFinalize && quote.status === 'draft'
        ? await qontoClient.finalizeClientQuote(quote.id)
        : quote;

    return NextResponse.json({
      success: true,
      quote: finalizedQuote,
      hasRealEmail,
      message: autoFinalize
        ? 'Service quote created and finalized'
        : hasRealEmail
          ? 'Service quote created as draft'
          : 'Service quote created as draft (no email - sending disabled)',
    });
  } catch (error) {
    return formatError(error);
  }
}
