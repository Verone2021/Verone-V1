/**
 * API Route: POST /api/qonto/quotes/[id]/accept
 * Marque un devis comme accepté par le client
 *
 * Note: Qonto API utilise l'endpoint /v2/quotes/{id}/accept
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { QontoClientQuote } from '@verone/integrations/qonto';
import { QontoClient } from '@verone/integrations/qonto';

interface QontoAcceptQuoteResponse {
  quote: QontoClientQuote;
}

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
          error: 'Le devis doit être finalisé avant de pouvoir être accepté',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'accepted') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ce devis est déjà accepté',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'declined') {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'accepter un devis déjà refusé",
        },
        { status: 400 }
      );
    }

    // Appeler l'API Qonto pour accepter le devis
    // L'API Qonto utilise POST /v2/quotes/{id}/accept
    const response = await fetch(
      `https://thirdparty.qonto.com/v2/quotes/${id}/accept`,
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
      console.error('[API Qonto Quote Accept] Qonto API error:', errorText);
      throw new Error(
        `Erreur Qonto: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as QontoAcceptQuoteResponse;

    return NextResponse.json({
      success: true,
      quote: data.quote,
      message: 'Devis marqué comme accepté',
    });
  } catch (error) {
    console.error('[API Qonto Quote Accept] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
