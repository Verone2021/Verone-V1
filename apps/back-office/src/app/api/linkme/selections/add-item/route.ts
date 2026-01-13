/**
 * API Route: POST /api/linkme/selections/add-item
 * Ajoute un produit à une sélection LinkMe via Supabase Admin API (bypass RLS)
 *
 * 🔐 SECURITE: Requiert authentification admin back-office (owner/admin)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';
import type { Database } from '@/types/supabase';

type LinkmeSelectionRow =
  Database['public']['Tables']['linkme_selections']['Row'];
type LinkmeSelectionItemRow =
  Database['public']['Tables']['linkme_selection_items']['Row'];
type LinkmeSelectionItemInsert =
  Database['public']['Tables']['linkme_selection_items']['Insert'];
type ProductRow = Database['public']['Tables']['products']['Row'];

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://linkme.verone.app',
  'https://verone-linkme.vercel.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : null,
].filter(Boolean) as string[];

// CORS headers pour permettre les requêtes cross-origin depuis LinkMe
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handler OPTIONS pour les preflight requests CORS
export function OPTIONS(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

interface IAddItemInput {
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 🔐 GUARD: Vérifier authentification admin back-office
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult; // 401 ou 403
  }

  try {
    const supabaseAdmin = createAdminClient();
    const body = (await request.json()) as IAddItemInput;
    const {
      selection_id: selectionId,
      product_id: productId,
      base_price_ht: basePriceHt,
      margin_rate: marginRate,
    } = body;

    // Validation
    if (!selectionId || !productId) {
      return NextResponse.json(
        { message: 'selection_id et product_id sont requis' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    if (typeof basePriceHt !== 'number' || basePriceHt < 0) {
      return NextResponse.json(
        { message: 'base_price_ht doit être un nombre positif' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    if (typeof marginRate !== 'number' || marginRate < 0 || marginRate > 100) {
      return NextResponse.json(
        { message: 'margin_rate doit être un nombre entre 0 et 100' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // 1. Vérifier que la sélection existe
    const { data: selection, error: selectError } = await supabaseAdmin
      .from('linkme_selections')
      .select('id, name, affiliate_id')
      .eq('id', selectionId)
      .single<Pick<LinkmeSelectionRow, 'id' | 'name' | 'affiliate_id'>>();

    if (selectError || !selection) {
      return NextResponse.json(
        { message: 'Sélection introuvable' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    // 2. Vérifier que le produit existe
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single<Pick<ProductRow, 'id' | 'name'>>();

    if (productError || !product) {
      return NextResponse.json(
        { message: 'Produit introuvable' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    // 3. Vérifier si le produit existe déjà dans la sélection
    const { data: existingItem } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('id')
      .eq('selection_id', selectionId)
      .eq('product_id', productId)
      .single<Pick<LinkmeSelectionItemRow, 'id'>>();

    if (existingItem) {
      return NextResponse.json(
        { message: 'Ce produit est déjà dans la sélection' },
        { status: 409, headers: getCorsHeaders(request) }
      );
    }

    // 4. Récupérer le prochain display_order
    const { data: lastItem } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('display_order')
      .eq('selection_id', selectionId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single<Pick<LinkmeSelectionItemRow, 'display_order'>>();

    const nextOrder = lastItem?.display_order ? lastItem.display_order + 1 : 1;

    // 5. Insérer le produit dans la sélection
    // Note: selling_price_ht est une colonne GENERATED - ne pas l'inclure
    const insertData: LinkmeSelectionItemInsert = {
      selection_id: selectionId,
      product_id: productId,
      base_price_ht: basePriceHt,
      margin_rate: marginRate,
      is_featured: false,
      display_order: nextOrder,
    };

    const { data: newItem, error: insertError } = await supabaseAdmin
      .from('linkme_selection_items')
      .insert(insertData)
      .select(
        'id, product_id, base_price_ht, margin_rate, selling_price_ht, display_order'
      )
      .single<
        Pick<
          LinkmeSelectionItemRow,
          | 'id'
          | 'product_id'
          | 'base_price_ht'
          | 'margin_rate'
          | 'selling_price_ht'
          | 'display_order'
        >
      >();

    if (insertError) {
      console.error('Erreur ajout produit à sélection:', insertError);
      return NextResponse.json(
        { message: insertError.message },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // 6. Mettre à jour le compteur de produits de la sélection
    const { count } = await supabaseAdmin
      .from('linkme_selection_items')
      .select('*', { count: 'exact', head: true })
      .eq('selection_id', selectionId);

    await supabaseAdmin
      .from('linkme_selections')
      .update({ products_count: count ?? 0 })
      .eq('id', selectionId);

    return NextResponse.json(
      {
        success: true,
        message: `Produit "${product.name}" ajouté à la sélection "${selection.name}"`,
        item: newItem,
      },
      { headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error('Erreur API add-item:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
