/**
 * API Route: POST /api/qonto/quotes/[id]/finalize
 * Finalise un devis brouillon
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
    const client = getQontoClient();

    // Vérifier l'état actuel avant finalisation
    const currentQuote = await client.getClientQuoteById(id);

    // Qonto uses 'pending_approval' for drafts, we accept both
    const isDraft =
      currentQuote.status === 'draft' ||
      currentQuote.status === 'pending_approval';

    if (!isDraft) {
      return NextResponse.json(
        {
          success: false,
          error: `Quote is already ${currentQuote.status}, cannot finalize`,
        },
        { status: 400 }
      );
    }

    const quote = await client.finalizeClientQuote(id);

    return NextResponse.json({
      success: true,
      quote,
      message: 'Quote finalized successfully',
    });
  } catch (error) {
    console.error('[API Qonto Quote Finalize] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
