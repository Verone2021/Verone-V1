/**
 * API Route: /api/qonto/credit-notes/[id]
 * Gestion d'un avoir spécifique
 *
 * GET    - Détail d'un avoir
 * PATCH  - Modifie un avoir brouillon
 * DELETE - Supprime un avoir brouillon
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
 * GET /api/qonto/credit-notes/[id]
 * Récupère les détails d'un avoir
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    credit_note?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    const creditNote = await client.getClientCreditNoteById(id);

    return NextResponse.json({
      success: true,
      credit_note: creditNote,
    });
  } catch (error) {
    console.error('[API Qonto Credit Note] GET error:', error);
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
  reason?: string;
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
 * PATCH /api/qonto/credit-notes/[id]
 * Modifie un avoir brouillon
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    credit_note?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const body = (await request.json()) as IPatchRequestBody;
    const client = getQontoClient();

    // Vérifier que l'avoir est en brouillon
    const currentCreditNote = await client.getClientCreditNoteById(id);

    if (currentCreditNote.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft credit notes can be modified',
        },
        { status: 400 }
      );
    }

    const creditNote = await client.updateClientCreditNote(id, body);

    return NextResponse.json({
      success: true,
      credit_note: creditNote,
    });
  } catch (error) {
    console.error('[API Qonto Credit Note] PATCH error:', error);
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
 * DELETE /api/qonto/credit-notes/[id]
 * Supprime un avoir brouillon
 * Note: Seuls les avoirs avec statut "draft" peuvent être supprimés
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

    // Vérifier que l'avoir est en brouillon avant suppression
    const creditNote = await client.getClientCreditNoteById(id);

    if (creditNote.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft credit notes can be deleted',
        },
        { status: 400 }
      );
    }

    await client.deleteClientCreditNote(id);

    return NextResponse.json({
      success: true,
      message: 'Credit note deleted successfully',
    });
  } catch (error) {
    console.error('[API Qonto Credit Note] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
