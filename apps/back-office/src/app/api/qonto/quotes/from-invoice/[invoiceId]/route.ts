/**
 * API Route: POST /api/qonto/quotes/from-invoice/[invoiceId]
 *
 * Cree un devis Qonto a partir d'une facture brouillon (draft_validated).
 * Le devis est immediatement finalise pour generer le PDF.
 *
 * Note importante:
 * - L'URL du PDF est temporaire (~3 minutes)
 * - Le devis n'est PAS stocke localement
 * - Doit etre telecharge ou envoye immediatement
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// Type pour les items de facture
interface IInvoiceItem {
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  product_id: string | null;
}

// Type pour la facture locale
interface ILocalInvoice {
  id: string;
  document_number: string;
  workflow_status: string;
  partner_id: string | null;
  due_date: string | null;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  billing_address: Record<string, unknown> | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  notes: string | null;
  qonto_invoice_id: string | null;
}

// Type pour le partenaire
interface IPartner {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  email: string | null;
}

interface IQuoteResponse {
  success: boolean;
  quote?: {
    id: string;
    quote_number: string;
    pdf_url: string | null;
    status: string;
  };
  pdf_url?: string | null;
  expires_in?: string;
  message?: string;
  error?: string;
}

/**
 * POST /api/qonto/quotes/from-invoice/[invoiceId]
 * Cree un devis depuis une facture brouillon
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
): Promise<NextResponse<IQuoteResponse>> {
  try {
    const { invoiceId } = await params;
    const supabase = createAdminClient();
    const qontoClient = getQontoClient();

    // 1. Recuperer la facture locale
    const { data: invoice, error: invoiceError } = await supabase
      .from('financial_documents')
      .select(
        `
        id,
        document_number,
        workflow_status,
        partner_id,
        due_date,
        total_ht,
        total_ttc,
        tva_amount,
        billing_address,
        shipping_cost_ht,
        handling_cost_ht,
        insurance_cost_ht,
        fees_vat_rate,
        notes,
        qonto_invoice_id
      `
      )
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      console.error('[Quote from invoice] Invoice fetch error:', invoiceError);
      return NextResponse.json(
        { success: false, error: 'Facture introuvable' },
        { status: 404 }
      );
    }

    const typedInvoice = invoice as unknown as ILocalInvoice;

    // 2. Verifier que la facture est en brouillon valide
    if (typedInvoice.workflow_status !== 'draft_validated') {
      return NextResponse.json(
        {
          success: false,
          error: `La facture doit etre en brouillon valide (statut actuel: ${typedInvoice.workflow_status})`,
        },
        { status: 400 }
      );
    }

    // 3. Recuperer le partenaire
    if (!typedInvoice.partner_id) {
      return NextResponse.json(
        { success: false, error: "La facture n'a pas de client associe" },
        { status: 400 }
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from('organisations')
      .select('id, legal_name, trade_name, email')
      .eq('id', typedInvoice.partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('[Quote from invoice] Partner fetch error:', partnerError);
      return NextResponse.json(
        { success: false, error: 'Client introuvable' },
        { status: 404 }
      );
    }

    const typedPartner = partner as unknown as IPartner;

    // 4. Recuperer les lignes de la facture
    const { data: items, error: itemsError } = await (
      supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (
              column: string,
              value: string
            ) => {
              order: (
                column: string,
                options: { ascending: boolean }
              ) => Promise<{
                data: IInvoiceItem[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      }
    )
      .from('financial_document_items')
      .select('description, quantity, unit_price_ht, tva_rate, product_id')
      .eq('document_id', invoiceId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('[Quote from invoice] Items fetch error:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la recuperation des lignes' },
        { status: 500 }
      );
    }

    // 5. Trouver ou creer le client Qonto
    let qontoClientId: string;
    const customerEmail = typedPartner.email;
    const customerName =
      typedPartner.trade_name ?? typedPartner.legal_name ?? 'Client';

    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Le client doit avoir une adresse email' },
        { status: 400 }
      );
    }

    // Utiliser l'adresse de facturation de la facture (copiee depuis la commande)
    const billingAddress = typedInvoice.billing_address as {
      street?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    } | null;
    if (!billingAddress?.city || !billingAddress?.postal_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Adresse de facturation incomplete (ville et code postal requis). Verifiez que l'adresse est renseignee sur la facture.",
        },
        { status: 400 }
      );
    }

    // Chercher le client existant
    const existingClient = await qontoClient.findClientByEmail(customerEmail);
    if (existingClient) {
      qontoClientId = existingClient.id;
    } else {
      // Creer le client
      const newClient = await qontoClient.createClient({
        name: customerName,
        type: 'company',
        email: customerEmail,
        currency: 'EUR',
        address: {
          streetAddress: String(billingAddress?.street ?? ''),
          city: String(billingAddress?.city ?? ''),
          zipCode: String(billingAddress?.postal_code ?? ''),
          countryCode: String(billingAddress?.country ?? 'FR'),
        },
      });
      qontoClientId = newClient.id;
    }

    // 6. Construire les lignes du devis
    const quoteItems = (items ?? []).map(item => ({
      title: item.description,
      quantity: String(item.quantity),
      unit: 'piece',
      unitPrice: {
        value: String(item.unit_price_ht),
        currency: 'EUR',
      },
      vatRate: String(item.tva_rate / 100), // Convert % to decimal
    }));

    // Ajouter les frais
    const feesVatRate = typedInvoice.fees_vat_rate ?? 0.2;

    if ((typedInvoice.shipping_cost_ht ?? 0) > 0) {
      quoteItems.push({
        title: 'Frais de livraison',
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(typedInvoice.shipping_cost_ht),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    if ((typedInvoice.handling_cost_ht ?? 0) > 0) {
      quoteItems.push({
        title: 'Frais de manutention',
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(typedInvoice.handling_cost_ht),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    if ((typedInvoice.insurance_cost_ht ?? 0) > 0) {
      quoteItems.push({
        title: "Frais d'assurance",
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(typedInvoice.insurance_cost_ht),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
      });
    }

    // 7. Calculer dates
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // Valide 30 jours

    // 8. Recuperer IBAN
    const bankAccounts = await qontoClient.getBankAccounts();
    const mainAccount = bankAccounts.find(a => a.status === 'active');
    if (!mainAccount) {
      return NextResponse.json(
        { success: false, error: 'Aucun compte bancaire Qonto actif trouve' },
        { status: 500 }
      );
    }

    // 9. Creer le devis
    // Note: paymentMethods n'est pas supporte pour les devis, seulement pour les factures
    const quote = await qontoClient.createClientQuote({
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      expiryDate,
      items: quoteItems,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Empty notes must become undefined (omitted in API payload)
      footer: typedInvoice.notes ?? undefined,
    });

    console.warn(
      `[Quote from invoice] Created quote ${quote.quote_number} for invoice ${typedInvoice.document_number}`
    );

    // 10. Finaliser le devis pour generer le PDF
    // Note: La methode finalizeClientQuote appelle /send qui genere le PDF
    const finalizedQuote = await qontoClient.finalizeClientQuote(quote.id);

    console.warn(
      `[Quote from invoice] Finalized quote ${finalizedQuote.quote_number}, PDF URL: ${finalizedQuote.pdf_url ? 'available' : 'not available'}`
    );

    return NextResponse.json({
      success: true,
      quote: {
        id: finalizedQuote.id,
        quote_number: finalizedQuote.quote_number,
        pdf_url: finalizedQuote.pdf_url ?? null,
        status: finalizedQuote.status,
      },
      pdf_url: finalizedQuote.pdf_url ?? null,
      expires_in: '3 minutes',
      message:
        "Devis cree et finalise. L'URL du PDF expire dans environ 3 minutes.",
    });
  } catch (error) {
    console.error('[Quote from invoice] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inattendue',
      },
      { status: 500 }
    );
  }
}
