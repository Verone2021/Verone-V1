/**
 * API Route: POST /api/qonto/quotes/[id]/convert
 * Convertit un devis finalisé en facture
 *
 * IMPORTANT: La facture créée est en brouillon (draft)
 * Elle doit être finalisée manuellement via l'UI
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier que le devis est finalisé
    const currentQuote = await client.getClientQuoteById(id);

    if (currentQuote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote must be finalized before conversion to invoice',
        },
        { status: 400 }
      );
    }

    if (currentQuote.converted_to_invoice_id) {
      return NextResponse.json(
        {
          success: false,
          error: `Quote already converted to invoice ${currentQuote.converted_to_invoice_id}`,
        },
        { status: 400 }
      );
    }

    // Convertir en facture (créée en brouillon)
    const invoice = await client.convertQuoteToInvoice(id);

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Quote converted to draft invoice successfully',
    });
  } catch (error) {
    console.error('[API Qonto Quote Convert] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
