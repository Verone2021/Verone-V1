/**
 * API Route: POST /api/qonto/invoices/[id]/send
 * Envoie une facture par email au client via Qonto
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

interface ISendRequestBody {
  emails?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as ISendRequestBody;
    const client = getQontoClient();

    // Récupérer la facture pour avoir l'email du client
    const invoice = await client.getClientInvoiceById(id);

    if (invoice.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible d'envoyer une facture brouillon. Veuillez d'abord la finaliser.",
        },
        { status: 400 }
      );
    }

    // Déterminer les emails destinataires
    let emails = body.emails;
    if (!emails || emails.length === 0) {
      // Essayer de récupérer l'email du client
      if (invoice.client?.email) {
        emails = [invoice.client.email];
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              "Aucune adresse email spécifiée et le client n'a pas d'email enregistré.",
          },
          { status: 400 }
        );
      }
    }

    // Envoyer par email
    await client.sendClientInvoiceByEmail(id, emails);

    return NextResponse.json({
      success: true,
      message: `Facture envoyée à ${emails.join(', ')}`,
    });
  } catch (error) {
    console.error('[API Qonto Invoice Send] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
