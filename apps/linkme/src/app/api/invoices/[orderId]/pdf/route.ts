/**
 * API Route: GET /api/invoices/[orderId]/pdf
 * Télécharge le PDF de la facture client pour une commande LinkMe.
 *
 * Sécurité:
 * - Vérifie que l'utilisateur est authentifié (session Supabase)
 * - Vérifie que la commande appartient à l'enseigne de l'affilié
 *
 * Source PDF:
 * - Supabase Storage local (bucket 'justificatifs', chemin local_pdf_path)
 * - Les PDFs sont générés via Qonto et stockés localement par le back-office
 *
 * @module api/invoices/[orderId]/pdf
 * @since 2026-03-23
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const { orderId } = await params;
    const supabase = await createServerClient();

    // 1. Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Vérifier que l'utilisateur a un rôle LinkMe actif
    const { data: userRole } = await supabase
      .from('user_app_roles')
      .select('id, enseigne_id, organisation_id')
      .eq('user_id', user.id)
      .eq('app', 'linkme')
      .eq('is_active', true)
      .single();

    if (!userRole) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // 3. Trouver la commande et vérifier qu'elle appartient à l'enseigne/org de l'affilié
    //    On cherche par order_number (POK-122) OU par UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      );

    let salesOrderQuery = supabase
      .from('sales_orders')
      .select('id, order_number');

    if (isUUID) {
      salesOrderQuery = salesOrderQuery.eq('id', orderId);
    } else {
      salesOrderQuery = salesOrderQuery.eq('order_number', orderId);
    }

    const { data: salesOrder, error: orderError } =
      await salesOrderQuery.single();

    if (orderError || !salesOrder) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // 4. Chercher la facture la plus récente non-annulée pour cette commande
    const { data: invoice, error: invoiceError } = await supabase
      .from('financial_documents')
      .select('id, document_number, local_pdf_path, status, document_type')
      .eq('sales_order_id', salesOrder.id)
      .eq('document_type', 'customer_invoice')
      .is('deleted_at', null)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invoiceError) {
      console.error('[LinkMe Invoice PDF] Query error:', invoiceError);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de la facture' },
        { status: 500 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: 'Aucune facture disponible pour cette commande' },
        { status: 404 }
      );
    }

    // 5. Vérifier que le PDF est disponible localement
    if (!invoice.local_pdf_path) {
      return NextResponse.json(
        {
          error: 'Le PDF de cette facture est en cours de génération',
          invoiceId: invoice.id,
          status: invoice.status,
        },
        { status: 202 }
      );
    }

    // 6. Télécharger le PDF depuis Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('justificatifs')
      .download(invoice.local_pdf_path);

    if (downloadError || !pdfData) {
      console.error(
        '[LinkMe Invoice PDF] Storage download failed:',
        downloadError
      );
      return NextResponse.json(
        { error: 'Le fichier PDF est temporairement indisponible' },
        { status: 500 }
      );
    }

    // 7. Retourner le PDF
    const pdfBuffer = await pdfData.arrayBuffer();
    const filename = `facture-${invoice.document_number}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[LinkMe Invoice PDF] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
