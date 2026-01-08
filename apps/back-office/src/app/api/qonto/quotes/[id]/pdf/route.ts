/**
 * API Route: GET /api/qonto/quotes/[id]/pdf
 * Télécharge le PDF d'un devis
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer le devis pour obtenir l'URL du PDF
    const quote = await client.getClientQuoteById(id);

    if (!quote.pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF not available. Quote may not be finalized yet.',
        },
        { status: 404 }
      );
    }

    // Télécharger le PDF depuis Qonto
    const pdfResponse = await fetch(quote.pdf_url);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download PDF from Qonto',
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devis-${quote.quote_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API Qonto Quote PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
