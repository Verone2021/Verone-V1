/**
 * API Route: POST /api/qonto/invoices/[id]/reconcile
 * Rapproche une facture avec une transaction bancaire
 *
 * Body:
 * - transactionId: ID de la transaction Qonto à associer
 *
 * Actions:
 * 1. Vérifie que la facture existe et est finalisée
 * 2. Vérifie que la transaction existe
 * 3. Marque la facture comme payée
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

interface IReconcileRequestBody {
  transactionId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as IReconcileRequestBody;
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'transactionId est requis',
        },
        { status: 400 }
      );
    }

    const client = getQontoClient();

    // 1. Get the invoice
    const invoice = await client.getClientInvoiceById(id);

    if (invoice.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de rapprocher une facture brouillon. Veuillez d'abord la finaliser.",
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
          error: 'Impossible de rapprocher une facture annulée',
        },
        { status: 400 }
      );
    }

    // 2. Get the transaction to verify it exists and has matching amount
    const transaction = await client.getTransactionById(transactionId);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction non trouvée',
        },
        { status: 404 }
      );
    }

    // Verify the transaction is a credit (incoming payment)
    if (transaction.side !== 'credit') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Seules les transactions entrantes (crédit) peuvent être rapprochées',
        },
        { status: 400 }
      );
    }

    // 3. Mark the invoice as paid
    const updatedInvoice = await client.markClientInvoiceAsPaid(id);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      transaction: {
        id: transaction.transaction_id,
        amount: transaction.amount,
        label: transaction.label,
        emitted_at: transaction.emitted_at,
      },
      message: `Facture rapprochée avec la transaction ${transaction.label ?? transaction.transaction_id}`,
    });
  } catch (error) {
    console.error('[API Qonto Invoice Reconcile] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
