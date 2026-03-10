/**
 * API Route: POST /api/consultations/associations
 * Ajoute un produit à une consultation via Supabase Admin API (bypass RLS)
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';

interface IAddConsultationProductInput {
  consultation_id: string;
  product_id: string;
  quantity?: number;
  proposed_price?: number;
  is_free?: boolean;
  notes?: string;
  is_primary_proposal?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IAddConsultationProductInput;
    const {
      consultation_id: consultationId,
      product_id: productId,
      quantity,
      proposed_price: proposedPrice,
      is_free: isFree,
      notes,
      is_primary_proposal: isPrimaryProposal,
    } = body;

    // 1. Validation champs requis
    if (!consultationId || !productId) {
      return NextResponse.json(
        { error: 'consultation_id et product_id sont requis' },
        { status: 400 }
      );
    }

    // 2. Vérifier que la consultation existe
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('client_consultations')
      .select('id')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: 'Consultation introuvable' },
        { status: 404 }
      );
    }

    // 3. Vérifier que le produit existe
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      );
    }

    // 4. Vérifier doublon (produit déjà dans cette consultation)
    const { data: existingItem } = await supabaseAdmin
      .from('consultation_products')
      .select('id')
      .eq('consultation_id', consultationId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: 'Ce produit est déjà dans cette consultation' },
        { status: 409 }
      );
    }

    // 5. Récupérer l'utilisateur connecté pour created_by
    const userId = guardResult.user.id;

    // 6. INSERT dans consultation_products
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('consultation_products')
      .insert({
        consultation_id: consultationId,
        product_id: productId,
        quantity: quantity ?? 1,
        proposed_price:
          proposedPrice && proposedPrice > 0 ? proposedPrice : null,
        is_free: isFree ?? false,
        notes: notes ?? null,
        is_primary_proposal: isPrimaryProposal ?? false,
        created_by: userId,
      })
      .select(
        'id, consultation_id, product_id, quantity, proposed_price, is_free, notes, status, created_at'
      )
      .single();

    if (insertError) {
      console.error('Erreur ajout produit à consultation:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Produit "${product.name}" ajouté à la consultation`,
      data: newItem,
    });
  } catch (error) {
    console.error('Erreur API consultations/associations:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
