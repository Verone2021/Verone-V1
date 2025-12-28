/**
 * API Route: GET /api/documents/[id]/download
 *
 * Route unifiee pour telecharger les documents financiers (factures).
 * Gere plusieurs sources de fichiers:
 * - Qonto attachments (URL temporaire 30 min)
 * - Supabase Storage (signed URL)
 * - Abby PDF URL (redirect direct)
 *
 * Usage:
 * - Depuis l'UI: window.open('/api/documents/{documentId}/download', '_blank')
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

/**
 * Extrait l'ID d'attachment Qonto depuis les notes du document
 * Format attendu: "Qonto attachment: {attachmentId}"
 */
function extractQontoAttachmentId(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Qonto attachment:\s*([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // 2. Recuperer l'ID du document
    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: 'ID document requis' },
        { status: 400 }
      );
    }

    // 3. Recuperer le document financier
    const { data: document, error: docError } = await supabase
      .from('financial_documents')
      .select('id, notes, uploaded_file_url')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document non trouve' },
        { status: 404 }
      );
    }

    // 4. Determiner la source du fichier et generer l'URL

    // Option A: Qonto attachment (extrait des notes)
    const qontoAttachmentId = extractQontoAttachmentId(document.notes);
    if (qontoAttachmentId) {
      try {
        const qontoClient = new QontoClient();
        const attachmentUrl =
          await qontoClient.getAttachmentUrl(qontoAttachmentId);

        if (attachmentUrl) {
          return NextResponse.redirect(attachmentUrl);
        }
      } catch (qontoError) {
        console.error(
          '[Documents Download] Qonto attachment error:',
          qontoError
        );
        // Continue to try other sources
      }
    }

    // Option B: Supabase Storage
    if (document.uploaded_file_url) {
      // Generate signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from('documents')
          .createSignedUrl(document.uploaded_file_url, 3600);

      if (signedUrlError) {
        console.error('[Documents Download] Signed URL error:', signedUrlError);
      } else if (signedUrlData?.signedUrl) {
        return NextResponse.redirect(signedUrlData.signedUrl);
      }
    }

    // Aucune source de fichier disponible
    return NextResponse.json(
      { error: 'Aucun fichier disponible pour ce document' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Documents Download] Error:', error);

    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
