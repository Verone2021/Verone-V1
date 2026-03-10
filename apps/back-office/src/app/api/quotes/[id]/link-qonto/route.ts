/**
 * API Route: POST /api/quotes/[id]/link-qonto
 *
 * Links a local financial_documents quote to its Qonto counterpart
 * by matching document_number against Qonto quote_number or purchase_order_number.
 */

import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // 1. Read the local quote
    const supabase = createAdminClient();
    const { data: localQuote, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, document_type, qonto_invoice_id')
      .eq('id', id)
      .single();

    if (fetchError || !localQuote) {
      return NextResponse.json(
        { success: false, error: 'Devis introuvable en base' },
        { status: 404 }
      );
    }

    if (localQuote.qonto_invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Ce devis est déjà lié à Qonto' },
        { status: 400 }
      );
    }

    const docNumber = localQuote.document_number;

    // 2. Fetch quotes from Qonto (paginate to find the match)
    const qonto = getQontoClient();
    let matchedQuote: {
      id: string;
      pdf_url?: string;
      public_url?: string;
      attachment_id?: string;
    } | null = null;

    let currentPage = 1;
    const maxPages = 10;

    while (currentPage <= maxPages) {
      const result = await qonto.getClientQuotes({
        perPage: 100,
        currentPage,
      });

      for (const q of result.client_quotes) {
        // Match by quote_number or purchase_order_number
        if (
          q.quote_number === docNumber ||
          q.purchase_order_number === docNumber
        ) {
          matchedQuote = {
            id: q.id,
            pdf_url: q.pdf_url,
            public_url: q.public_url,
            attachment_id: q.attachment_id,
          };
          break;
        }
      }

      if (matchedQuote || currentPage >= result.meta.total_pages) break;
      currentPage++;
    }

    if (!matchedQuote) {
      return NextResponse.json(
        {
          success: false,
          error: `Devis "${docNumber}" non trouvé sur Qonto. Vérifiez que le numéro correspond.`,
        },
        { status: 404 }
      );
    }

    // 3. If we have the Qonto quote ID but no pdf_url, fetch the full quote details
    if (!matchedQuote.pdf_url && matchedQuote.id) {
      try {
        const fullQuote = await qonto.getClientQuoteById(matchedQuote.id);
        matchedQuote.pdf_url = fullQuote.pdf_url;
        matchedQuote.public_url = fullQuote.public_url;
        matchedQuote.attachment_id = fullQuote.attachment_id;
      } catch (detailErr) {
        console.error(
          '[link-qonto] Failed to fetch full quote details:',
          detailErr
        );
      }
    }

    // 4. Update the local quote with Qonto data
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        qonto_invoice_id: matchedQuote.id,
        qonto_pdf_url: matchedQuote.pdf_url ?? null,
        qonto_public_url: matchedQuote.public_url ?? null,
        qonto_attachment_id: matchedQuote.attachment_id ?? null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[link-qonto] DB update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour en base' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qonto_invoice_id: matchedQuote.id,
      qonto_pdf_url: matchedQuote.pdf_url ?? null,
      qonto_public_url: matchedQuote.public_url ?? null,
    });
  } catch (err) {
    console.error('[link-qonto] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
