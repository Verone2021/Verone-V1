/**
 * API Route: POST /api/products/[id]/publish
 *
 * Publie un produit sur le Site Internet Vérone (canal racine).
 * - Valide les 7 critères obligatoires (BO-PUBLICATION-001)
 * - Set products.is_published_online = true
 * - Upsert channel_pricing (product_id, site_internet) avec is_active = true
 *
 * Pas de cascade vers Google/Meta automatique : l'utilisateur doit explicitement
 * activer chaque canal dépendant via leur route visibility respective.
 *
 * Garde-fou (Sprint BO-PUBLICATION-001) — refuse 422 si manque :
 * nom, description, ≥1 photo, poids > 0, dimensions remplies,
 * sous-catégorie, meta description, prix HT > 0 sur canal site-internet.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CHANNEL_IDS } from '@verone/channels';
import { createServerClient } from '@verone/utils/supabase/server';

interface PublishResponse {
  success: boolean;
  data?: {
    productId: string;
    isPublishedOnline: boolean;
  };
  error?: string;
  missingFields?: string[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PublishResponse>> {
  try {
    const { id: productId } = await params;

    if (!productId || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ====== GARDE-FOU 7 CRITÈRES (BO-PUBLICATION-001) ======
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select(
        'id, name, description, weight, dimensions, subcategory_id, meta_description'
      )
      .eq('id', productId)
      .maybeSingle();

    if (fetchError) {
      console.error('[API] products.select failed:', fetchError);
      return NextResponse.json(
        { success: false, error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produit introuvable' },
        { status: 404 }
      );
    }

    const { count: imageCount, error: imageCountError } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (imageCountError) {
      console.error('[API] product_images count failed:', imageCountError);
      return NextResponse.json(
        { success: false, error: 'Erreur vérification photos' },
        { status: 500 }
      );
    }

    const { data: pricing, error: pricingError } = await supabase
      .from('channel_pricing')
      .select('custom_price_ht')
      .eq('product_id', productId)
      .eq('channel_id', CHANNEL_IDS.site_internet)
      .maybeSingle();

    if (pricingError) {
      console.error('[API] channel_pricing.select failed:', pricingError);
      return NextResponse.json(
        { success: false, error: 'Erreur vérification prix canal' },
        { status: 500 }
      );
    }

    const missingFields: string[] = [];
    if (!product.name || product.name.trim() === '') {
      missingFields.push('nom');
    }
    if (!product.description || product.description.trim() === '') {
      missingFields.push('description');
    }
    if (!imageCount || imageCount === 0) {
      missingFields.push('photo');
    }
    if (
      product.weight === null ||
      product.weight === undefined ||
      Number(product.weight) <= 0
    ) {
      missingFields.push('poids');
    }
    const dims = product.dimensions as Record<string, unknown> | null;
    if (!dims || typeof dims !== 'object' || Object.keys(dims).length === 0) {
      missingFields.push('dimensions');
    }
    if (!product.subcategory_id) {
      missingFields.push('sous-catégorie');
    }
    if (!product.meta_description || product.meta_description.trim() === '') {
      missingFields.push('meta description SEO');
    }
    if (!pricing?.custom_price_ht || Number(pricing.custom_price_ht) <= 0) {
      missingFields.push('prix HT canal site-internet');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Publication bloquée : champs obligatoires manquants',
          missingFields,
        },
        { status: 422 }
      );
    }
    // ====== FIN GARDE-FOU ======

    const { error: updateProductError } = await supabase
      .from('products')
      .update({
        is_published_online: true,
        publication_date: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateProductError) {
      console.error(
        '[API] products.update is_published_online failed:',
        updateProductError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${updateProductError.message}`,
        },
        { status: 500 }
      );
    }

    const { error: upsertChannelError } = await supabase
      .from('channel_pricing')
      .upsert(
        {
          product_id: productId,
          channel_id: CHANNEL_IDS.site_internet,
          is_active: true,
        },
        { onConflict: 'product_id,channel_id' }
      );

    if (upsertChannelError) {
      console.error(
        '[API] channel_pricing.upsert site_internet failed:',
        upsertChannelError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Channel activation error: ${upsertChannelError.message}`,
        },
        { status: 500 }
      );
    }

    console.warn(`[API] Product ${productId} published on Site Internet`);

    return NextResponse.json({
      success: true,
      data: { productId, isPublishedOnline: true },
    });
  } catch (error) {
    console.error('[API] Publish product failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
