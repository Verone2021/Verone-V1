/**
 * API Route: POST /api/qonto/invoices/[id]/convert-to-quote
 * Convertit une facture brouillon en devis
 *
 * IMPORTANT: Seules les factures DRAFT peuvent etre converties
 * Les factures finalisees sont irreversibles
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

interface IPostRequestBody {
  deleteOriginal?: boolean; // Supprimer la facture brouillon apres conversion
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { deleteOriginal = false } = body as IPostRequestBody;

    const client = getQontoClient();

    // Recuperer la facture
    const invoice = await client.getClientInvoiceById(id);

    // Verifier que la facture est en brouillon
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot convert invoice with status '${invoice.status}'. Only draft invoices can be converted to quotes.`,
        },
        { status: 400 }
      );
    }

    // Calculer la date d'expiration (30 jours apres emission)
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Mapper les items de la facture vers le format devis
    const quoteItems = invoice.items.map(item => ({
      title: item.title,
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit || 'unit',
      unitPrice: {
        value: String(item.unit_price),
        currency: invoice.currency,
      },
      vatRate: String(item.vat_rate),
    }));

    // Creer le devis avec les donnees de la facture
    const quoteParams: CreateClientQuoteParams = {
      clientId: invoice.client_id,
      currency: invoice.currency,
      issueDate,
      expiryDate,
      purchaseOrderNumber: invoice.purchase_order_number,
      items: quoteItems,
    };

    const quote = await client.createClientQuote(quoteParams);

    // Supprimer la facture brouillon si demande
    if (deleteOriginal) {
      try {
        await client.deleteClientInvoice(id);
      } catch (deleteError) {
        // Log mais ne pas echouer si la suppression echoue
        console.warn(
          '[API Invoice Convert] Failed to delete original invoice:',
          deleteError
        );
      }
    }

    return NextResponse.json({
      success: true,
      quote,
      message: deleteOriginal
        ? 'Invoice converted to quote and original deleted'
        : 'Invoice converted to draft quote successfully',
    });
  } catch (error) {
    console.error('[API Qonto Invoice Convert to Quote] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
