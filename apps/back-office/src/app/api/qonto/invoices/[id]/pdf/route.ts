/**
 * API Route: GET /api/qonto/invoices/[id]/pdf
 * Télécharge le PDF de la facture depuis Qonto
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
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer la facture pour obtenir le pdf_url
    const invoice = await client.getClientInvoiceById(id);

    if (!invoice.pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF not available. Invoice may not be finalized.',
        },
        { status: 404 }
      );
    }

    // Télécharger le PDF depuis Qonto
    const pdfResponse = await fetch(invoice.pdf_url);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch PDF from Qonto' },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoice_number}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API Qonto Invoice PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
