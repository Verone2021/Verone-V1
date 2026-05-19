/**
 * API Route: GET /api/linkme/invoices/[requestId]/signed-url
 * Génère une URL signée (1h) pour accéder à la facture d'une demande de versement.
 *
 * Sécurité: Admin back-office uniquement (owner/admin).
 * Le path stocké dans invoice_file_url suit le format {request_id}/{timestamp}.pdf.
 *
 * @module api/linkme/invoices/[requestId]/signed-url
 * @since 2026-05-19
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import type { Database } from '@verone/types';

import { requireBackofficeAdmin } from '@/lib/guards';

type PaymentRequestRow =
  Database['public']['Tables']['linkme_payment_requests']['Row'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }

  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId manquant' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient('backoffice');

    // Charger la demande pour récupérer le path de la facture
    const { data: paymentRequest, error: fetchError } = await supabase
      .from('linkme_payment_requests')
      .select('id, invoice_file_url, invoice_received')
      .eq('id', requestId)
      .single<
        Pick<PaymentRequestRow, 'id' | 'invoice_file_url' | 'invoice_received'>
      >();

    if (fetchError) {
      console.error(
        '[LinkMe Invoice Signed URL] Erreur fetch demande:',
        fetchError
      );
      return NextResponse.json(
        { error: 'Demande introuvable' },
        { status: 404 }
      );
    }

    if (!paymentRequest.invoice_received || !paymentRequest.invoice_file_url) {
      return NextResponse.json(
        { error: 'Aucune facture déposée pour cette demande' },
        { status: 404 }
      );
    }

    const filePath = paymentRequest.invoice_file_url;
    const TTL = 3600; // 1 heure

    const { data: signedData, error: signedError } = await supabase.storage
      .from('linkme-invoices')
      .createSignedUrl(filePath, TTL);

    if (signedError || !signedData?.signedUrl) {
      console.error(
        '[LinkMe Invoice Signed URL] Erreur génération signed URL:',
        signedError
      );
      return NextResponse.json(
        { error: 'Impossible de générer le lien de téléchargement' },
        { status: 500 }
      );
    }

    const expiresAt = new Date(Date.now() + TTL * 1000).toISOString();

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      expiresAt,
    });
  } catch (err) {
    console.error('[LinkMe Invoice Signed URL] Erreur inattendue:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
