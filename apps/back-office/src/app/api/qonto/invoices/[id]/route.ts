/**
 * API Route: /api/qonto/invoices/[id]
 * Gestion d'une facture spécifique
 *
 * GET   - Détail d'une facture
 * PATCH - Modifie une facture brouillon
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
 * GET /api/qonto/invoices/[id]
 * Récupère les détails d'une facture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();
    const invoice = await client.getClientInvoiceById(id);

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('[API Qonto Invoice] GET error:', error);
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
  dueDate?: string;
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
 * PATCH /api/qonto/invoices/[id]
 * Modifie une facture brouillon
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const body = (await request.json()) as IPatchRequestBody;
    const client = getQontoClient();

    // Vérifier que la facture est en brouillon
    const currentInvoice = await client.getClientInvoiceById(id);

    if (currentInvoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft invoices can be modified',
        },
        { status: 400 }
      );
    }

    const invoice = await client.updateClientInvoice(id, body);

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('[API Qonto Invoice] PATCH error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
