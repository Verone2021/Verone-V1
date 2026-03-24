/**
 * API Route: /api/quotes/[id]/finalize
 *
 * Finalizes a local quote by syncing it to Qonto:
 * 1. Read local quote + items + customer from financial_documents
 * 2. Find or create Qonto client
 * 3. Map items to Qonto format
 * 4. Create draft on Qonto
 * 5. Finalize on Qonto
 * 6. Update local quote with Qonto IDs and status
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

function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return 'FR';
  const upper = country.toUpperCase().trim();
  if (upper.length === 2) return upper;
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
  return countryMap[upper] ?? 'FR';
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: quoteId } = await params;
    const supabase = createAdminClient();

    // 1. Read local quote
    const { data: quote, error: quoteError } = await supabase
      .from('financial_documents')
      .select(
        `
        *,
        items:financial_document_items(
          id, product_id, description, quantity,
          unit_price_ht, tva_rate, discount_percentage, eco_tax
        ),
        partner:organisations!partner_id(
          id, legal_name, trade_name, email, siret, vat_number,
          billing_address_line1, address_line1,
          billing_city, city,
          billing_postal_code, postal_code,
          billing_country, country
        ),
        individual_customer:individual_customers!individual_customer_id(
          id, first_name, last_name, email,
          address_line1, city, postal_code, country
        )
      `
      )
      .eq('id', quoteId)
      .eq('document_type', 'customer_quote')
      .is('deleted_at', null)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Devis introuvable' },
        { status: 404 }
      );
    }

    if (quote.quote_status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Seuls les brouillons peuvent être finalisés',
        },
        { status: 400 }
      );
    }

    if (quote.qonto_invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Ce devis est déjà synchronisé avec Qonto' },
        { status: 400 }
      );
    }

    // 2. Determine customer info
    const isOrg = quote.customer_type === 'organization';
    let customerName = 'Client';
    let customerEmail: string | null = null;
    let qontoAddress: {
      streetAddress: string;
      city: string;
      zipCode: string;
      countryCode: string;
    };
    let vatNumber: string | undefined;

    if (isOrg && quote.partner) {
      const org = quote.partner as unknown as Organisation;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
      customerEmail = org.email ?? null;
      vatNumber = org.vat_number ?? org.siret ?? undefined;
      qontoAddress = {
        streetAddress: org.billing_address_line1 ?? org.address_line1 ?? '',
        city: org.billing_city ?? org.city ?? 'Paris',
        zipCode: org.billing_postal_code ?? org.postal_code ?? '75001',
        countryCode: normalizeCountryCode(org.billing_country ?? org.country),
      };
    } else if (quote.individual_customer) {
      const indiv = quote.individual_customer as unknown as IndividualCustomer;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
      customerEmail = indiv.email ?? null;
      qontoAddress = {
        streetAddress: indiv.address_line1 ?? '',
        city: indiv.city ?? 'Paris',
        zipCode: indiv.postal_code ?? '75001',
        countryCode: normalizeCountryCode(indiv.country),
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Client introuvable pour ce devis' },
        { status: 400 }
      );
    }

    // If email is missing, try to get it from the linked consultation
    if (!customerEmail && quote.consultation_id) {
      const { data: consultation } = await supabase
        .from('client_consultations')
        .select('client_email')
        .eq('id', quote.consultation_id)
        .single();
      if (consultation?.client_email) {
        customerEmail = consultation.client_email;
      }
    }

    // 3. Find or create Qonto client
    const emailForQonto =
      customerEmail ?? `noreply+${quoteId.slice(0, 8)}@verone.app`;
    const qontoClientType = isOrg ? 'company' : 'individual';

    const qontoClient = getQontoClient();
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

    // 4. Map items to Qonto format
    interface QuoteItemRow {
      description: string;
      quantity: number;
      unit_price_ht: number;
      tva_rate: number;
      discount_percentage: number;
      eco_tax: number;
    }

    const quoteItems = ((quote.items ?? []) as unknown as QuoteItemRow[]).map(
      item => {
        const discountMultiplier = 1 - (item.discount_percentage ?? 0) / 100;
        const effectivePrice = item.unit_price_ht * discountMultiplier;
        const ecoTaxPerUnit = item.eco_tax ?? 0;
        const priceWithEcoTax = effectivePrice + ecoTaxPerUnit;

        return {
          title: item.description || 'Article',
          quantity: String(item.quantity),
          unit: 'unit',
          unitPrice: {
            value: String(priceWithEcoTax.toFixed(2)),
            currency: 'EUR',
          },
          vatRate: String(item.tva_rate / 100), // Convert 20 -> 0.2
        };
      }
    );

    // Add fees as separate items if > 0
    const feeItems: Array<{
      title: string;
      quantity: string;
      unit: string;
      unitPrice: { value: string; currency: string };
      vatRate: string;
    }> = [];

    if ((quote.shipping_cost_ht ?? 0) > 0) {
      feeItems.push({
        title: 'Frais de livraison',
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(Number(quote.shipping_cost_ht).toFixed(2)),
          currency: 'EUR',
        },
        vatRate: String(quote.fees_vat_rate ?? 0.2),
      });
    }

    if ((quote.handling_cost_ht ?? 0) > 0) {
      feeItems.push({
        title: 'Frais de manutention',
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(Number(quote.handling_cost_ht).toFixed(2)),
          currency: 'EUR',
        },
        vatRate: String(quote.fees_vat_rate ?? 0.2),
      });
    }

    if ((quote.insurance_cost_ht ?? 0) > 0) {
      feeItems.push({
        title: "Frais d'assurance",
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(Number(quote.insurance_cost_ht).toFixed(2)),
          currency: 'EUR',
        },
        vatRate: String(quote.fees_vat_rate ?? 0.2),
      });
    }

    const allItems = [...quoteItems, ...feeItems];

    // 5. Create Qonto quote (draft)
    const quoteParams: CreateClientQuoteParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate: quote.document_date,
      expiryDate:
        quote.validity_date ??
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      purchaseOrderNumber: quote.document_number,
      items: allItems,
    };

    const qontoQuote = await qontoClient.createClientQuote(quoteParams);

    // 6. Finalize on Qonto
    const finalizedQuote = await qontoClient.finalizeClientQuote(qontoQuote.id);

    // 7. Update local quote
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        qonto_invoice_id: finalizedQuote.id,
        qonto_pdf_url:
          ((finalizedQuote as unknown as Record<string, unknown>)
            .pdf_url as string) ?? null,
        qonto_public_url:
          ((finalizedQuote as unknown as Record<string, unknown>)
            .public_url as string) ?? null,
        quote_status: 'sent',
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error(
        '[/api/quotes/finalize] Failed to update local quote:',
        updateError.message
      );
      // Don't fail - Qonto quote was created successfully
    }

    return NextResponse.json({
      success: true,
      qonto_quote: finalizedQuote,
      message: 'Devis finalisé et synchronisé avec Qonto',
    });
  } catch (error) {
    console.error('[/api/quotes/finalize] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la finalisation',
      },
      { status: 500 }
    );
  }
}
