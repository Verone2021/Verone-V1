/**
 * API Route: /api/qonto/quotes/[id]
 * Gestion d'un devis spécifique
 *
 * GET    - Détail d'un devis
 * PATCH  - Modifie un devis brouillon
 * DELETE - Supprime un devis brouillon
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

/**
 * GET /api/qonto/quotes/[id]
 * Récupère les détails d'un devis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    const quote = await client.getClientQuoteById(id);

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('[API Qonto Quote] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

interface IPatchRequestBody {
  expiryDate?: string;
  header?: string;
  footer?: string;
  termsAndConditions?: string;
  items?: Array<{
    title: string;
    description?: string;
    quantity: string;
    unit?: string;
    unitPrice: { value: string; currency: string };
    vatRate: string;
  }>;
}

/**
 * PATCH /api/qonto/quotes/[id]
 * Modifie un devis brouillon
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const body = (await request.json()) as IPatchRequestBody;
    const client = getQontoClient();

    // Vérifier que le devis est en brouillon
    const currentQuote = await client.getClientQuoteById(id);

    if (currentQuote.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft quotes can be modified',
        },
        { status: 400 }
      );
    }

    const quote = await client.updateClientQuote(id, body);

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('[API Qonto Quote] PATCH error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qonto/quotes/[id]
 * Supprime un devis brouillon
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier que le devis est en brouillon
    const currentQuote = await client.getClientQuoteById(id);

    if (currentQuote.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft quotes can be deleted',
        },
        { status: 400 }
      );
    }

    await client.deleteClientQuote(id);

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('[API Qonto Quote] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
