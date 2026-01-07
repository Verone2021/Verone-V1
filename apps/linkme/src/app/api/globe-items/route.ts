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
  image_url: string | null;
};

type OrganisationRow = {
  id: string;
  name: string;
  logo_url: string | null;
};

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();

    // Essayer d'abord la vue (si migration appliquée)
    const { data: viewData, error: viewError } = await supabase
      .from('linkme_globe_items')
      .select('item_type, id, name, image_url')
      .limit(50);

    if (!viewError && viewData && viewData.length > 0) {
      return NextResponse.json({
        items: viewData as GlobeItem[],
        count: viewData.length,
      });
    }

    // Fallback: requêtes séparées si la vue n'existe pas
    const [productsResult, orgsResult] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, image_url')
        .eq('show_on_linkme_globe', true)
        .not('image_url', 'is', null)
        .limit(25),
      supabase
        .from('organisations')
        .select('id, name, logo_url')
        .eq('show_on_linkme_globe', true)
        .not('logo_url', 'is', null)
        .limit(25),
    ]);

    const items: GlobeItem[] = [];

    // Ajouter les produits
    if (productsResult.data) {
      const products = productsResult.data as ProductRow[];
      products.forEach(p => {
        if (p.image_url) {
          items.push({
            item_type: 'product',
            id: p.id,
            name: p.name,
            image_url: p.image_url,
          });
        }
      });
    }

    // Ajouter les organisations
    if (orgsResult.data) {
      const orgs = orgsResult.data as OrganisationRow[];
      orgs.forEach(o => {
        if (o.logo_url) {
          items.push({
            item_type: 'organisation',
            id: o.id,
            name: o.name,
            image_url: o.logo_url,
          });
        }
      });
    }

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching globe items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch globe items', items: [] },
      { status: 500 }
    );
  }
}
