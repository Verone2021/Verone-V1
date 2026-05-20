/**
 * API Route: GET /api/profil/facturation/invoice/[requestId]/url
 * Génère une URL signée (1h) pour qu'un affilié accède à sa propre facture.
 *
 * Sécurité:
 * - Vérifie que l'utilisateur est authentifié avec un rôle LinkMe actif.
 * - Vérifie que la demande appartient à l'affilié de l'utilisateur connecté.
 * - La RLS storage filtre également au niveau bucket.
 *
 * @module api/profil/facturation/invoice/[requestId]/url
 * @since 2026-05-19
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import type { Database } from '@verone/types';

type PaymentRequestRow =
  Database['public']['Tables']['linkme_payment_requests']['Row'];
type UserAppRoleRow = Database['public']['Tables']['user_app_roles']['Row'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
): Promise<NextResponse> {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId manquant' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 1. Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Vérifier le rôle LinkMe et récupérer l'affilié associé
    const { data: userRole } = await supabase
      .from('user_app_roles')
      .select('id, enseigne_id, organisation_id')
      .eq('user_id', user.id)
      .eq('app', 'linkme')
      .eq('is_active', true)
      .single<Pick<UserAppRoleRow, 'id' | 'enseigne_id' | 'organisation_id'>>();

    if (!userRole) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // 3. Trouver l'affilié de l'utilisateur
    const affiliateQuery = supabase.from('linkme_affiliates').select('id');

    const { data: affiliate } = await (
      userRole.enseigne_id
        ? affiliateQuery.eq('enseigne_id', userRole.enseigne_id)
        : affiliateQuery.eq('organisation_id', userRole.organisation_id ?? '')
    ).single<{ id: string }>();

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affilié introuvable' },
        { status: 403 }
      );
    }

    // 4. Charger la demande et vérifier qu'elle appartient à l'affilié
    const { data: paymentRequest, error: fetchError } = await supabase
      .from('linkme_payment_requests')
      .select('id, invoice_file_url, invoice_received, affiliate_id')
      .eq('id', requestId)
      .eq('affiliate_id', affiliate.id)
      .single<
        Pick<
          PaymentRequestRow,
          'id' | 'invoice_file_url' | 'invoice_received' | 'affiliate_id'
        >
      >();

    if (fetchError || !paymentRequest) {
      console.error(
        '[LinkMe Affiliate Invoice URL] Demande introuvable ou accès interdit:',
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
        '[LinkMe Affiliate Invoice URL] Erreur génération signed URL:',
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
    console.error('[LinkMe Affiliate Invoice URL] Erreur inattendue:', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
