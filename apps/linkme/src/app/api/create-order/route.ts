import { type NextRequest, NextResponse } from 'next/server';

import { createRevolutOrder } from '../../../lib/revolut';
import type { LinkMeOrderData } from '../../../lib/revolut';

/**
 * POST /api/create-order
 * Crée une commande Revolut pour le paiement
 */
export async function POST(request: NextRequest) {
  try {
    const body: LinkMeOrderData = await request.json();

    // Validation des données requises
    if (!body.customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Email client requis' },
        { status: 400 }
      );
    }

    if (!body.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Panier vide' },
        { status: 400 }
      );
    }

    if (!body.affiliate_id || !body.selection_id) {
      return NextResponse.json(
        { success: false, error: 'Identifiants affilié/sélection requis' },
        { status: 400 }
      );
    }

    // Montant en centimes (Revolut attend les montants en centimes)
    const amountInCents = Math.round(body.total_ttc * 100);

    // Générer une référence unique pour la commande
    const orderRef = `LINKME-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Créer la commande Revolut
    const result = await createRevolutOrder({
      amount: amountInCents,
      currency: 'EUR',
      description: `Commande LinkMe - ${body.items.length} article(s)`,
      merchant_order_ext_ref: orderRef,
      customer_email: body.customer.email,
      capture_mode: 'automatic',
      metadata: {
        affiliate_id: body.affiliate_id,
        selection_id: body.selection_id,
        customer_name: `${body.customer.firstName} ${body.customer.lastName}`,
        items_count: String(body.items.length),
        total_ht: String(body.total_ht),
        total_tva: String(body.total_tva),
      },
    });

    if (!result.success) {
      console.error('Failed to create Revolut order:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Échec création commande' },
        { status: 500 }
      );
    }

    // Retourner le token pour le SDK frontend
    return NextResponse.json({
      success: true,
      token: result.token,
      order_id: result.order?.id,
      order_ref: orderRef,
    });
  } catch (error) {
    console.error('Error in create-order:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
