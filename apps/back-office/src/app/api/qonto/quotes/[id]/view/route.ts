/**
 * API Route: GET /api/qonto/quotes/[id]/view
 * Affiche le PDF d'un devis dans le navigateur (inline)
 *
 * Différence avec /pdf : Content-Disposition: inline (pas attachment)
 * Permet de visualiser le PDF dans un nouvel onglet avant téléchargement.
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer le devis
    const quote = await client.getClientQuoteById(id);

    console.log('[API Qonto Quote View] Quote data:', {
      id: quote.id,
      quote_number: quote.quote_number,
      status: quote.status,
      pdf_url: quote.pdf_url,
      public_url: quote.public_url,
      attachment_id: quote.attachment_id,
    });

    // Déterminer l'URL du PDF (priorité: pdf_url > attachment_id)
    let pdfUrl: string | undefined = quote.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && quote.attachment_id) {
      console.log(
        '[API Qonto Quote View] No pdf_url, trying attachment_id:',
        quote.attachment_id
      );
      try {
        const attachment = await client.getAttachment(quote.attachment_id);
        console.log('[API Qonto Quote View] Attachment response:', attachment);
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Qonto Quote View] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error('[API Qonto Quote View] No PDF URL found for quote:', id);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head><title>PDF non disponible</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>PDF non disponible</h1>
          <p>Le PDF du devis n'est pas encore disponible.</p>
          <p>Le devis doit être finalisé pour générer un PDF.</p>
          <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    console.log('[API Qonto Quote View] Fetching PDF from:', pdfUrl);

    // Télécharger le PDF depuis l'URL
    const pdfResponse = await fetch(pdfUrl);

    console.log(
      '[API Qonto Quote View] PDF response status:',
      pdfResponse.status
    );

    if (!pdfResponse.ok) {
      console.error(
        '[API Qonto Quote View] Failed to fetch PDF:',
        pdfResponse.status,
        pdfResponse.statusText
      );
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head><title>Erreur</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Erreur de téléchargement</h1>
          <p>Impossible de récupérer le PDF depuis Qonto.</p>
          <p>Erreur: ${pdfResponse.status} ${pdfResponse.statusText}</p>
          <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    console.log(
      '[API Qonto Quote View] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Vérifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Qonto Quote View] PDF buffer is empty!');
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head><title>PDF vide</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>PDF vide</h1>
          <p>Le PDF téléchargé depuis Qonto est vide.</p>
          <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Retourner le PDF avec Content-Disposition: inline (pour affichage)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="devis-${quote.quote_number || quote.id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'private, max-age=300', // Cache 5 min
      },
    });
  } catch (error) {
    console.error('[API Qonto Quote View] GET error:', error);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head><title>Erreur</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1>Erreur</h1>
        <p>${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
        <button onclick="window.close()">Fermer</button>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
