/**
 * API Route: POST /api/quotes/[id]/push-to-qonto
 *
 * Pushes a local financial_documents quote to Qonto:
 * 1. Creates the quote as draft on Qonto (with client resolution)
 * 2. Updates local record with qonto_invoice_id
 * 3. If quote is already validated, also sends it (= finalize) to generate PDF
 */

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

interface QuoteItemRow {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  product_id: string | null;
  product: { id: string; name: string; sku: string | null } | null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Fetch local quote with items and partner
    const { data: localQuote, error: fetchError } = await supabase
      .from('financial_documents')
      .select(
        `
        id, document_number, document_type, quote_status,
        qonto_invoice_id, partner_id, partner_type,
        customer_type, individual_customer_id,
        total_ht, total_ttc, tva_amount,
        shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
        billing_address, shipping_address, validity_date, notes,
        items:financial_document_items(
          id, description, quantity, unit_price_ht, tva_rate,
          discount_percentage, eco_tax, product_id,
          product:products(id, name, sku)
        )
      `
      )
      .eq('id', id)
      .eq('document_type', 'customer_quote')
      .single();

    if (fetchError || !localQuote) {
      return NextResponse.json(
        { success: false, error: 'Devis introuvable en base' },
        { status: 404 }
      );
    }

    // Already linked to Qonto — if validated, finalize to get PDF
    if (localQuote.qonto_invoice_id) {
      const quoteStatus = localQuote.quote_status as string;
      if (quoteStatus === 'validated' || quoteStatus === 'sent') {
        try {
          const qontoClient = getQontoClient();
          const finalized = await qontoClient.finalizeClientQuote(
            localQuote.qonto_invoice_id
          );
          const updatePayload: Record<string, unknown> = {
            qonto_pdf_url: finalized.pdf_url ?? null,
            qonto_public_url: finalized.public_url ?? null,
            qonto_attachment_id: finalized.attachment_id ?? null,
            updated_at: new Date().toISOString(),
          };
          await supabase
            .from('financial_documents')
            .update(updatePayload)
            .eq('id', id);
          return NextResponse.json({
            success: true,
            qonto_invoice_id: localQuote.qonto_invoice_id,
            qonto_pdf_url: finalized.pdf_url ?? null,
            finalized: true,
          });
        } catch (finalizeErr) {
          const errLog =
            finalizeErr &&
            typeof finalizeErr === 'object' &&
            'toJSON' in finalizeErr
              ? (finalizeErr as { toJSON: () => unknown }).toJSON()
              : finalizeErr;
          console.error(
            '[push-to-qonto] Finalize existing quote failed:',
            JSON.stringify(errLog, null, 2)
          );
          return NextResponse.json(
            {
              success: false,
              error:
                finalizeErr instanceof Error
                  ? finalizeErr.message
                  : 'Erreur finalization Qonto',
              details: errLog,
            },
            { status: 500 }
          );
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Ce devis est déjà lié à Qonto',
          qonto_invoice_id: localQuote.qonto_invoice_id,
        },
        { status: 400 }
      );
    }

    const items = (localQuote.items ?? []) as unknown as QuoteItemRow[];

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le devis ne contient aucune ligne' },
        { status: 400 }
      );
    }

    // 2. Resolve customer (organisation or individual)
    let customer: Organisation | IndividualCustomer | null = null;
    const customerType = localQuote.customer_type ?? 'organization';

    if (customerType === 'organization' && localQuote.partner_id) {
      const { data: org } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', localQuote.partner_id)
        .single();
      customer = org;
    } else if (
      customerType === 'individual' &&
      localQuote.individual_customer_id
    ) {
      const { data: indiv } = await supabase
        .from('individual_customers')
        .select('*')
        .eq('id', localQuote.individual_customer_id)
        .single();
      customer = indiv;
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Client introuvable pour ce devis' },
        { status: 400 }
      );
    }

    // Extract customer info
    let customerEmail: string | null = null;
    let customerName = 'Client';
    let vatNumber: string | undefined;

    if (customerType === 'organization') {
      const org = customer as Organisation;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
      vatNumber = org.vat_number ?? org.siret ?? undefined;
    } else {
      const indiv = customer as IndividualCustomer;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    // Validate VAT number for organisations
    if (customerType === 'organization' && !vatNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le SIRET ou numéro de TVA de l'organisation est requis pour créer un devis Qonto.",
        },
        { status: 400 }
      );
    }

    // 3. Resolve Qonto address
    const billingAddr = localQuote.billing_address as Record<
      string,
      string
    > | null;
    let orgAddress: Record<string, string> | null = null;
    if (!billingAddr && customerType === 'organization') {
      const org = customer as Organisation;
      orgAddress = {
        street: org.address_line1 ?? '',
        city: org.city ?? 'Paris',
        postal_code: org.postal_code ?? '75001',
        country: org.country ?? 'FR',
      };
    }

    const addressSource = billingAddr ?? orgAddress;
    const qontoAddress = {
      streetAddress:
        addressSource?.street ??
        addressSource?.address ??
        addressSource?.address_line1 ??
        '',
      city: addressSource?.city ?? 'Paris',
      zipCode: addressSource?.postal_code ?? '75001',
      countryCode: addressSource?.country ?? 'FR',
    };

    const qontoClientType =
      customerType === 'organization' ? 'company' : 'individual';

    // 4. Find or create Qonto client
    const qontoClient = getQontoClient();

    let existingClient = customerEmail
      ? await qontoClient.findClientByEmail(customerEmail)
      : null;

    existingClient ??= await qontoClient.findClientByName(customerName);

    let qontoClientId: string;
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
        email: customerEmail ?? undefined,
        currency: 'EUR',
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = newClient.id;
    }

    // 5. Map local items to Qonto quote items
    const feesVatRate = localQuote.fees_vat_rate ?? 0.2;

    const qontoItems: CreateClientQuoteParams['items'] = items.map(item => ({
      title: item.product?.name ?? item.description ?? 'Article',
      description: item.description || undefined,
      quantity: String(item.quantity),
      unit: 'pièce',
      unitPrice: {
        value: String(item.unit_price_ht),
        currency: 'EUR',
      },
      vatRate: String(item.tva_rate / 100), // tva_rate is stored as % (20.00) -> 0.20
    }));

    // Add fee lines
    const shippingCost = localQuote.shipping_cost_ht ?? 0;
    if (shippingCost > 0) {
      qontoItems.push({
        title: 'Frais de livraison',
        quantity: '1',
        unit: 'forfait',
        unitPrice: { value: String(shippingCost), currency: 'EUR' },
        vatRate: String(feesVatRate),
      });
    }

    const handlingCost = localQuote.handling_cost_ht ?? 0;
    if (handlingCost > 0) {
      qontoItems.push({
        title: 'Frais de manutention',
        quantity: '1',
        unit: 'forfait',
        unitPrice: { value: String(handlingCost), currency: 'EUR' },
        vatRate: String(feesVatRate),
      });
    }

    const insuranceCost = localQuote.insurance_cost_ht ?? 0;
    if (insuranceCost > 0) {
      qontoItems.push({
        title: "Frais d'assurance",
        quantity: '1',
        unit: 'forfait',
        unitPrice: { value: String(insuranceCost), currency: 'EUR' },
        vatRate: String(feesVatRate),
      });
    }

    // 6. Create quote on Qonto
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate =
      localQuote.validity_date ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    const quoteParams: CreateClientQuoteParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      expiryDate,
      purchaseOrderNumber: localQuote.document_number ?? undefined,
      items: qontoItems,
    };

    let qontoQuote = await qontoClient.createClientQuote(quoteParams);

    // 7. Update local record with Qonto ID
    const updatePayload: Record<string, unknown> = {
      qonto_invoice_id: qontoQuote.id,
      qonto_pdf_url: qontoQuote.pdf_url ?? null,
      qonto_public_url: qontoQuote.public_url ?? null,
      qonto_attachment_id: qontoQuote.attachment_id ?? null,
      updated_at: new Date().toISOString(),
    };

    // 8. If quote is validated (not draft), finalize on Qonto to generate PDF
    const quoteStatus = localQuote.quote_status as string;
    if (quoteStatus !== 'draft') {
      try {
        qontoQuote = await qontoClient.finalizeClientQuote(qontoQuote.id);
        updatePayload.qonto_pdf_url = qontoQuote.pdf_url ?? null;
        updatePayload.qonto_public_url = qontoQuote.public_url ?? null;
        updatePayload.qonto_attachment_id = qontoQuote.attachment_id ?? null;
      } catch (finalizeErr) {
        const errLog =
          finalizeErr &&
          typeof finalizeErr === 'object' &&
          'toJSON' in finalizeErr
            ? (finalizeErr as { toJSON: () => unknown }).toJSON()
            : finalizeErr;
        console.error(
          '[push-to-qonto] Failed to finalize quote on Qonto:',
          JSON.stringify(errLog, null, 2)
        );
        // Don't fail — the draft was created, PDF will come later at validation
      }
    }

    const { error: updateError } = await supabase
      .from('financial_documents')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      console.error('[push-to-qonto] DB update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour en base' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qonto_invoice_id: qontoQuote.id,
      qonto_pdf_url: qontoQuote.pdf_url ?? null,
      qonto_public_url: qontoQuote.public_url ?? null,
      finalized: quoteStatus !== 'draft',
    });
  } catch (err) {
    console.error('[push-to-qonto] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
