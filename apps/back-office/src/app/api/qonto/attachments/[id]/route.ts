/**
 * API Route: GET /api/qonto/attachments/[id]
 *
 * Récupère l'URL temporaire d'un attachment Qonto (valide 30 min)
 * et redirige vers cette URL pour afficher/télécharger le PDF.
 *
 * Usage:
 * - Depuis l'UI: window.open('/api/qonto/attachments/{attachmentId}', '_blank')
 * - L'utilisateur est redirigé vers l'URL temporaire Qonto
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Récupérer l'ID de l'attachment
    const { id: attachmentId } = await params;

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID attachment requis' },
        { status: 400 }
      );
    }

    // 3. Créer le client Qonto et récupérer l'URL temporaire
    const qontoClient = new QontoClient();
    const attachmentUrl = await qontoClient.getAttachmentUrl(attachmentId);

    if (!attachmentUrl) {
      return NextResponse.json(
        { error: 'Attachment non trouvé' },
        { status: 404 }
      );
    }

    // 4. Proxy le contenu au lieu de redirect (évite problèmes CORS)
    // On télécharge le fichier côté serveur et on le renvoie au client
    const fileResponse = await fetch(attachmentUrl);

    if (!fileResponse.ok) {
      console.error(
        `[Qonto Attachment] Failed to fetch from Qonto: ${fileResponse.status}`
      );
      return NextResponse.json(
        { error: `Erreur Qonto: ${fileResponse.status}` },
        { status: fileResponse.status }
      );
    }

    const blob = await fileResponse.blob();
    const contentType =
      fileResponse.headers.get('Content-Type') || 'application/pdf';

    // Retourner le fichier avec les bons headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="qonto-${attachmentId}.pdf"`,
        'Cache-Control': 'private, max-age=1800', // Cache 30 min (durée URL Qonto)
      },
    });
  } catch (error) {
    console.error('[API] Qonto attachment error:', error);

    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    // Gérer les erreurs spécifiques Qonto
    if (message.includes('AUTH_ERROR') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Credentials Qonto invalides' },
        { status: 401 }
      );
    }

    if (message.includes('NOT_FOUND') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Attachment non trouvé sur Qonto' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
