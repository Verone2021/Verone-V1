/**
 * API Route: DELETE /api/qonto/invoices/[id]/delete
 * Supprime une facture brouillon (draft uniquement)
 *
 * Note: Seules les factures avec statut "draft" peuvent être supprimées.
 * Les factures finalisées (unpaid, paid, overdue) ne peuvent qu'être annulées.
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier d'abord le statut de la facture
    const invoice = await client.getClientInvoiceById(id);

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete invoice with status "${invoice.status}". Only draft invoices can be deleted. Use cancel endpoint for unpaid invoices.`,
          currentStatus: invoice.status,
        },
        { status: 400 }
      );
    }

    // Supprimer la facture brouillon
    await client.deleteClientInvoice(id);

    return NextResponse.json({
      success: true,
      message: 'Draft invoice deleted successfully',
      deletedInvoiceId: id,
    });
  } catch (error) {
    console.error('[API Qonto Invoice Delete] DELETE error:', error);

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
