/**
 * API Route: POST /api/qonto/invoices/[id]/mark-paid
 * Marque une facture comme payée dans Qonto
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
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier que la facture existe et est finalisée
    const invoice = await client.getClientInvoiceById(id);

    if (invoice.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de marquer une facture brouillon comme payée',
        },
        { status: 400 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cette facture est déjà marquée comme payée',
        },
        { status: 400 }
      );
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de marquer une facture annulée comme payée',
        },
        { status: 400 }
      );
    }

    // Marquer comme payée
    const updatedInvoice = await client.markClientInvoiceAsPaid(id);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Facture marquée comme payée',
    });
  } catch (error) {
    console.error('[API Qonto Invoice Mark Paid] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
