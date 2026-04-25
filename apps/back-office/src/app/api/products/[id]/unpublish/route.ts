/**
 * API Route: POST /api/products/[id]/unpublish
 *
 * Dépublie un produit du Site Internet Vérone avec cascade obligatoire :
 * - Set products.is_published_online = false
 * - Update channel_pricing.is_active = false pour site_internet
 * - Cascade : toggle_meta_commerce_visibility(false) + toggle_google_merchant_visibility(false)
 *
 * Cascade obligatoire car Google et Meta dépendent du Site Internet.
 *
 * Voir : docs/current/canaux-vente-publication-rules.md
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CHANNEL_IDS, CHANNELS_DEPENDENT_ON_SITE } from '@verone/channels';
import { createServerClient } from '@verone/utils/supabase/server';

interface UnpublishResponse {
  success: boolean;
  data?: {
    productId: string;
    isPublishedOnline: boolean;
    cascadedTo: string[];
  };
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UnpublishResponse>> {
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
        is_published_online: false,
        unpublication_date: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateProductError) {
      console.error(
        '[API] products.update unpublish failed:',
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

    const dependentChannelIds = [
      CHANNEL_IDS.site_internet,
      CHANNEL_IDS.google_merchant,
      CHANNEL_IDS.meta_commerce,
    ];

    const { error: deactivateChannelsError } = await supabase
      .from('channel_pricing')
      .update({ is_active: false })
      .eq('product_id', productId)
      .in('channel_id', dependentChannelIds);

    if (deactivateChannelsError) {
      console.error(
        '[API] channel_pricing cascade deactivation failed:',
        deactivateChannelsError
      );
      return NextResponse.json(
        {
          success: false,
          error: `Channel deactivation error: ${deactivateChannelsError.message}`,
        },
        { status: 500 }
      );
    }

    const { error: googleError } = await supabase.rpc(
      'toggle_google_merchant_visibility',
      { p_product_id: productId, p_visible: false }
    );
    if (googleError) {
      console.warn(
        `[API] toggle_google_merchant_visibility cascade soft-fail: ${googleError.message}`
      );
    }

    const { error: metaError } = await supabase.rpc(
      'toggle_meta_commerce_visibility' as never,
      { p_product_id: productId, p_visible: false } as never
    );
    if (metaError) {
      console.warn(
        `[API] toggle_meta_commerce_visibility cascade soft-fail: ${(metaError as { message: string }).message}`
      );
    }

    console.warn(
      `[API] Product ${productId} unpublished from Site Internet (cascade: Google + Meta)`
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        isPublishedOnline: false,
        cascadedTo: [...CHANNELS_DEPENDENT_ON_SITE],
      },
    });
  } catch (error) {
    console.error('[API] Unpublish product failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
