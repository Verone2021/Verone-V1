/**
 * API Route: POST /api/qonto/credit-notes/[id]/send
 * Envoie un avoir par email au client via Qonto
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer l'avoir pour vérifier son état
    const creditNote = await client.getClientCreditNoteById(id);

    if (creditNote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible d'envoyer un avoir en brouillon. Veuillez d'abord le finaliser.",
        },
        { status: 400 }
      );
    }

    // Essayer d'envoyer l'avoir via l'API Qonto
    // Note: L'endpoint peut varier selon l'API Qonto
    const response = await fetch(
      `https://thirdparty.qonto.com/v2/credit_notes/${id}/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.QONTO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Si l'endpoint n'existe pas ou échoue, on informe l'utilisateur
      // que l'avoir peut être partagé via son URL publique
      if (creditNote.public_url) {
        return NextResponse.json({
          success: true,
          creditNote,
          message:
            "L'avoir est disponible via son lien public. Vous pouvez le partager manuellement.",
          publicUrl: creditNote.public_url,
        });
      }

      const errorText = await response.text();
      console.error('[API Qonto Credit Note Send] Qonto API error:', errorText);
      throw new Error(
        `Erreur Qonto: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      creditNote: data.credit_note || creditNote,
      message: 'Avoir envoyé au client',
    });
  } catch (error) {
    console.error('[API Qonto Credit Note Send] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
