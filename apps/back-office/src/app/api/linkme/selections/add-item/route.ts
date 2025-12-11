/**
 * API Route: POST /api/linkme/selections/add-item
 * Ajoute un produit à une sélection LinkMe via Supabase Admin API (bypass RLS)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

// CORS headers pour permettre les requêtes cross-origin depuis LinkMe
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler OPTIONS pour les preflight requests CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Fonction pour créer le client Admin Supabase (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

interface AddItemInput {
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body: AddItemInput = await request.json();
    const { selection_id, product_id, base_price_ht, margin_rate } = body;

    // Validation
    if (!selection_id || !product_id) {
      return NextResponse.json(
        { message: 'selection_id et product_id sont requis' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof base_price_ht !== 'number' || base_price_ht < 0) {
      return NextResponse.json(
        { message: 'base_price_ht doit être un nombre positif' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      typeof margin_rate !== 'number' ||
      margin_rate < 0 ||
      margin_rate > 100
    ) {
      return NextResponse.json(
        { message: 'margin_rate doit être un nombre entre 0 et 100' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Vérifier que la sélection existe
    const { data: selection, error: selectError } = await supabaseAdmin
      .from('linkme_selections')
      .select('id, name, status, affiliate_id')
      .eq('id', selection_id)
      .single();

    if (selectError || !selection) {
      return NextResponse.json(
        { message: 'Sélection introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Vérifier que le produit existe
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { message: 'Produit introuvable' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 3. Vérifier si le produit existe déjà dans la sélection
    const { data: existingItem } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('id')
      .eq('selection_id', selection_id)
      .eq('product_id', product_id)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { message: 'Ce produit est déjà dans la sélection' },
        { status: 409, headers: corsHeaders }
      );
    }

    // 4. Récupérer le prochain display_order
    const { data: lastItem } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('display_order')
      .eq('selection_id', selection_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = lastItem ? lastItem.display_order + 1 : 1;

    // 5. Insérer le produit dans la sélection
    // Note: selling_price_ht est une colonne GENERATED - ne pas l'inclure
    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('linkme_selection_items')
      .insert({
        selection_id,
        product_id,
        base_price_ht,
        margin_rate,
        is_featured: false,
        display_order: nextOrder,
      })
      .select(
        'id, product_id, base_price_ht, margin_rate, selling_price_ht, display_order'
      )
      .single();

    if (insertError) {
      console.error('Erreur ajout produit à sélection:', insertError);
      return NextResponse.json(
        { message: insertError.message },
        { status: 400, headers: corsHeaders }
      );
    }

    // 6. Mettre à jour le compteur de produits de la sélection
    const { count } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('*', { count: 'exact', head: true })
      .eq('selection_id', selection_id);

    await supabaseAdmin
      .from('linkme_selections')
      .update({ products_count: count || 0 })
      .eq('id', selection_id);

    return NextResponse.json(
      {
        success: true,
        message: `Produit "${product.name}" ajouté à la sélection "${selection.name}"`,
        item: newItem,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Erreur API add-item:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500, headers: corsHeaders }
    );
  }
}
