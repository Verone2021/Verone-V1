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

interface IServiceItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface IPostRequestBody {
  clientId: string;
  clientType: 'organisation' | 'individual';
  items: IServiceItem[];
  validityDays?: number; // Durée de validité en jours (défaut: 30)
  reference?: string;
  autoFinalize?: boolean;
}

/**
 * POST /api/qonto/quotes/service
 * Crée un devis de service (sans commande)
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
      clientId,
      clientType,
      items,
      validityDays = 30,
      reference,
      autoFinalize = false,
    } = body;

    // Validation
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId is required' },
        { status: 400 }
      );
    }

    if (!clientType || !['organisation', 'individual'].includes(clientType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'clientType must be organisation or individual',
        },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Récupérer le client depuis Supabase
    const supabase = createAdminClient();
    let customer: Organisation | IndividualCustomer | null = null;
    let customerEmail: string | null = null;
    let customerName = 'Client';

    if (clientType === 'organisation') {
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
      customer = org;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
    } else {
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
      customer = indiv;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    // Email optionnel - utiliser placeholder si pas d'email
    // Cela permet de créer le devis, mais l'envoi automatique sera désactivé
    const hasRealEmail = !!customerEmail;
    const emailForQonto =
      customerEmail || `noreply+${clientId.slice(0, 8)}@verone.app`;

    const qontoClient = getQontoClient();

    // Normaliser country code vers ISO 2 lettres
    const normalizeCountryCode = (
      country: string | null | undefined
    ): string => {
      if (!country) return 'FR';
      const upper = country.toUpperCase().trim();
      // Si déjà 2 caractères, c'est bon
      if (upper.length === 2) return upper;
      // Mapper les noms de pays courants
      const countryMap: Record<string, string> = {
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
      return countryMap[upper] || 'FR';
    };

    // Construire adresse pour Qonto
    let qontoAddress: {
      streetAddress: string;
      city: string;
      zipCode: string;
      countryCode: string;
    };

    if (clientType === 'organisation') {
      const org = customer as Organisation;
      qontoAddress = {
        streetAddress: org.billing_address_line1 || org.address_line1 || '',
        city: org.billing_city || org.city || 'Paris',
        zipCode: org.billing_postal_code || org.postal_code || '75001',
        countryCode: normalizeCountryCode(org.billing_country || org.country),
      };
    } else {
      const indiv = customer as IndividualCustomer;
      qontoAddress = {
        streetAddress: indiv.address_line1 || '',
        city: indiv.city || 'Paris',
        zipCode: indiv.postal_code || '75001',
        countryCode: normalizeCountryCode(indiv.country),
      };
    }

    // Mapper customer_type vers type Qonto
    const qontoClientType =
      clientType === 'organisation' ? 'company' : 'individual';

    // Récupérer le numéro TVA/SIRET pour les entreprises
    let vatNumber: string | undefined;
    if (clientType === 'organisation') {
      const org = customer as Organisation;
      // Priorité: vat_number (TVA intra), sinon siret
      vatNumber = org.vat_number || org.siret || undefined;
    }

    // Chercher ou créer le client Qonto
    let qontoClientId: string;
    const existingClient = await qontoClient.findClientByEmail(emailForQonto);

    if (existingClient) {
      await qontoClient.updateClient(existingClient.id, {
        name: customerName,
        type: qontoClientType,
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = existingClient.id;
    } else {
      const newClient = await qontoClient.createClient({
        name: customerName,
        type: qontoClientType,
        email: emailForQonto,
        currency: 'EUR',
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = newClient.id;
    }

    // Mapper les items de service
    const quoteItems = items.map(item => ({
      title: item.title,
      description: item.description,
      quantity: String(item.quantity),
      unit: 'prestation',
      unitPrice: {
        value: String(item.unitPrice),
        currency: 'EUR',
      },
      vatRate: String(item.vatRate),
    }));

    // Calculer les dates
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Créer le devis
    const quoteParams: CreateClientQuoteParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      expiryDate,
      purchaseOrderNumber: reference,
      items: quoteItems,
    };

    const quote = await qontoClient.createClientQuote(quoteParams);

    // Finaliser si demandé
    let finalizedQuote = quote;
    if (autoFinalize && quote.status === 'draft') {
      finalizedQuote = await qontoClient.finalizeClientQuote(quote.id);
    }

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
}
