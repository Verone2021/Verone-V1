/**
 * API Route: POST /api/qonto/quotes/[id]/decline
 * Marque un devis comme refusé par le client
 *
 * Note: Qonto API utilise l'endpoint /v2/quotes/{id}/decline
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

    // Vérifier que le devis existe et est finalisé
    const quote = await client.getClientQuoteById(id);

    if (quote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Le devis doit être finalisé avant de pouvoir être refusé',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'declined') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ce devis est déjà refusé',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'accepted') {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de refuser un devis déjà accepté',
        },
        { status: 400 }
      );
    }

    // Appeler l'API Qonto pour refuser le devis
    // L'API Qonto utilise POST /v2/quotes/{id}/decline
    const response = await fetch(
      `https://thirdparty.qonto.com/v2/quotes/${id}/decline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.QONTO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Qonto Quote Decline] Qonto API error:', errorText);
      throw new Error(
        `Erreur Qonto: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      quote: data.quote,
      message: 'Devis marqué comme refusé',
    });
  } catch (error) {
    console.error('[API Qonto Quote Decline] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
