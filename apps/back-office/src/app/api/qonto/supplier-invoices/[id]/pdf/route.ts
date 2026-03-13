/**
 * API Route: GET /api/qonto/supplier-invoices/[id]/pdf
 * Télécharge le PDF d'une facture fournisseur
 *
 * Priorité:
 * 1. Supabase Storage local (local_pdf_path)
 * 2. Qonto attachment (via qonto_attachment_id)
 * 3. uploaded_file_url fallback
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch document metadata
    const { data: doc } = await supabase
      .from('financial_documents')
      .select(
        'id, document_number, local_pdf_path, qonto_attachment_id, uploaded_file_url'
      )
      .eq('id', id)
      .single();

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const filename = `${doc.document_number ?? id}.pdf`;

    // Priority 1: Local storage
    if (doc.local_pdf_path) {
      const { data: pdfData, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(doc.local_pdf_path);

      if (!downloadError && pdfData) {
        const buffer = await pdfData.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Content-Length': String(buffer.byteLength),
            'X-PDF-Source': 'local',
          },
        });
      }
    }

    // Priority 2: Qonto attachment
    if (doc.qonto_attachment_id) {
      try {
        const client = getQontoClient();
        const attachment = await client.getAttachment(doc.qonto_attachment_id);

        if (attachment.url) {
          const pdfResponse = await fetch(attachment.url);
          if (pdfResponse.ok) {
            const buffer = await pdfResponse.arrayBuffer();

            // Store-on-read (non-blocking)
            if (buffer.byteLength > 0) {
              const year = new Date().getFullYear();
              const storagePath = `supplier/${year}/${filename}`;

              void supabase.storage
                .from('invoices')
                .upload(storagePath, buffer, {
                  contentType: 'application/pdf',
                  upsert: true,
                })
                .then(async ({ error: uploadError }) => {
                  if (!uploadError) {
                    await supabase
                      .from('financial_documents')
                      .update({
                        local_pdf_path: storagePath,
                        pdf_stored_at: new Date().toISOString(),
                      })
                      .eq('id', doc.id);
                  }
                })
                .catch((err: unknown) => {
                  console.error('[Supplier PDF] Store-on-read error:', err);
                });

              return new NextResponse(buffer, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="${filename}"`,
                  'Content-Length': String(buffer.byteLength),
                  'X-PDF-Source': 'qonto-attachment',
                },
              });
            }
          }
        }
      } catch (attachErr) {
        console.warn(
          '[Supplier PDF] Qonto attachment fetch failed:',
          attachErr
        );
      }
    }

    // Priority 3: uploaded_file_url
    if (doc.uploaded_file_url) {
      try {
        const response = await fetch(doc.uploaded_file_url);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          if (buffer.byteLength > 0) {
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': String(buffer.byteLength),
                'X-PDF-Source': 'uploaded',
              },
            });
          }
        }
      } catch (uploadErr) {
        console.warn(
          '[Supplier PDF] uploaded_file_url fetch failed:',
          uploadErr
        );
      }
    }

    return NextResponse.json(
      { error: 'No PDF available for this document' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Supplier PDF] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
