/**
 * API Route: POST /api/products/[id]/publish
 *
 * Publie un produit sur le Site Internet Vérone (canal racine).
 * - Set products.is_published_online = true
 * - Upsert channel_pricing (product_id, site_internet) avec is_active = true
 *
 * Pas de cascade vers Google/Meta automatique : l'utilisateur doit explicitement
 * activer chaque canal dépendant via leur route visibility respective.
 *
 * Voir : docs/current/canaux-vente-publication-rules.md
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
