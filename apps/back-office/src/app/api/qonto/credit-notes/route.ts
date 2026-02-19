/**
 * API Route: /api/qonto/credit-notes
 * Gestion des avoirs clients via Qonto API
 *
 * GET  - Liste les avoirs
 * POST - Crée un avoir depuis une facture
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';
import type { CreateClientCreditNoteParams } from '@verone/integrations/qonto';

/**
 * GET /api/qonto/credit-notes
 * Liste les avoirs avec filtre optionnel par status
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    credit_notes?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'finalized' | null;

    const client = getQontoClient();
    const result = await client.getClientCreditNotes(
      status ? { status } : undefined
    );

    return NextResponse.json({
      success: true,
      credit_notes: result.client_credit_notes,
      count: result.client_credit_notes.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Credit Notes] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

interface IPostRequestBody {
  invoiceId: string; // Facture de référence
  reason?: string; // Motif de l'avoir
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
 * POST /api/qonto/credit-notes
 * Crée un avoir depuis une facture existante
 *
 * Body:
 * - invoiceId: UUID de la facture Qonto
 * - reason: string (motif de l'avoir)
 * - items: optionnel, si non fourni, copie les items de la facture
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    credit_note?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const body = (await request.json()) as IPostRequestBody;
    const { invoiceId, reason, items } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    const qontoClient = getQontoClient();

    // Récupérer la facture pour obtenir le client et les items
    const invoice = await qontoClient.getClientInvoiceById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Préparer les items de l'avoir
    // Si items fournis, les utiliser, sinon copier de la facture
    const creditNoteItems =
      items ??
      invoice.items.map(item => ({
        title: item.title,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        unitPrice: {
          value: String(item.unit_price),
          currency: invoice.currency,
        },
        vatRate: String(item.vat_rate),
      }));

    // Créer l'avoir (TOUJOURS en brouillon)
    const creditNoteParams: CreateClientCreditNoteParams = {
      clientId: invoice.client_id,
      currency: invoice.currency,
      issueDate: new Date().toISOString().split('T')[0],
      invoiceId: invoice.id,
      reason: reason ?? `Avoir sur facture ${invoice.invoice_number}`,
      items: creditNoteItems,
    };

    const creditNote =
      await qontoClient.createClientCreditNote(creditNoteParams);

    return NextResponse.json({
      success: true,
      credit_note: creditNote,
      message: 'Credit note created as draft',
    });
  } catch (error) {
    console.error('[API Qonto Credit Notes] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
