/**
 * API Route: DELETE /api/library/documents/[id]?source=financial_documents|bank_transactions
 *
 * Deletes the LOCAL PDF from Supabase Storage and resets local_pdf_path.
 * Does NOT delete the Qonto attachment or the DB record.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

const querySchema = z.object({
  source: z.enum(['financial_documents', 'bank_transactions']),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate source query param
    const sourceParam = request.nextUrl.searchParams.get('source');
    const parsed = querySchema.safeParse({ source: sourceParam });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'Query param "source" is required: financial_documents | bank_transactions',
          },
        },
        { status: 400 }
      );
    }

    const { source } = parsed.data;
    const supabase = await createServerClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Non authentifie' } },
        { status: 401 }
      );
    }

    // Step 1: Get current local_pdf_path
    const { data: record, error: fetchError } = await supabase
      .from(source)
      .select('id, local_pdf_path')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Document ${id} not found in ${source}`,
          },
        },
        { status: 404 }
      );
    }

    const localPdfPath = record.local_pdf_path as string | null;

    if (!localPdfPath) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_PDF',
            message: 'No local PDF to delete',
          },
        },
        { status: 404 }
      );
    }

    // Step 2: Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('justificatifs')
      .remove([localPdfPath]);

    if (storageError) {
      console.error(
        '[API Library Delete] Storage delete failed:',
        storageError
      );
      // Continue — still reset DB even if storage delete fails
    }

    // Step 3: Reset local_pdf_path and pdf_stored_at in DB
    const { error: updateError } = await supabase
      .from(source)
      .update({ local_pdf_path: null, pdf_stored_at: null })
      .eq('id', id);

    if (updateError) {
      console.error('[API Library Delete] DB update failed:', updateError);
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    console.warn(
      `[API Library Delete] PDF deleted: ${localPdfPath} (source: ${source}, id: ${id})`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Library Delete] Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
