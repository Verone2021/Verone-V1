/**
 * API Route: Globe Items
 * Retourne les produits et organisations à afficher sur le globe 3D
 *
 * @module /api/globe-items
 * @since 2026-01-06
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';

type GlobeItem = {
  item_type: 'product' | 'organisation';
  id: string;
  name: string;
  image_url: string;
};

type ProductRow = {
  id: string;
  name: string;
  product_images: Array<{ public_url: string }>;
};

type OrganisationRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();

    // Utiliser la vue linkme_globe_items (créée par migration 20260106)
    const { data: viewData, error: viewError } = await supabase
      .from('linkme_globe_items')
      .select('item_type, id, name, image_url')
      .limit(50);

    console.log('[API GLOBE] Vue linkme_globe_items:', {
      error: viewError?.message || null,
      count: viewData?.length ?? 0,
      sample: viewData?.[0] || null,
    });

    if (viewError) {
      console.error('[API GLOBE] View error:', viewError);
      return NextResponse.json(
        {
          error: 'Vue linkme_globe_items not found. Run migration 20260106.',
          items: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: viewData as GlobeItem[],
      count: viewData?.length ?? 0,
    });
  } catch (error) {
    console.error('Error fetching globe items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch globe items', items: [] },
      { status: 500 }
    );
  }
}
