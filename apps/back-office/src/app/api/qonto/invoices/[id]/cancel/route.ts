/**
 * API Route: POST /api/qonto/invoices/[id]/cancel
 * Annule une facture non payée (unpaid → canceled)
 *
 * Note: Seules les factures avec statut "unpaid" peuvent être annulées.
 * Les factures annulées restent dans le système pour la traçabilité comptable.
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    const invoice = await client.cancelClientInvoice(id);

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice canceled successfully',
    });
  } catch (error) {
    console.error('[API Qonto Invoice Cancel] POST error:', error);

    // Détails d'erreur pour QontoError
    const errorDetails =
      error && typeof error === 'object' && 'details' in error
        ? JSON.stringify((error as { details: unknown }).details, null, 2)
        : undefined;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
