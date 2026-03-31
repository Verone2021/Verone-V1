/**
 * GET /api/feeds/products.xml
 *
 * Generates a Google Shopping XML feed from published products in Supabase.
 * This feed is consumed by both Google Merchant Center and Meta Commerce Manager.
 *
 * Query params:
 * - brand: filter by brand name (e.g., ?brand=Solar)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://veronecollections.fr';
const DEFAULT_MARGIN = 30;

interface FeedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  cost_price: string;
  margin_percentage: string | null;
  stock_status: string | null;
  condition: string | null;
  brand: string | null;
  gtin: string | null;
  supplier_reference: string | null;
  item_group_id: string | null;
  product_images: Array<{
    public_url: string | null;
    is_primary: boolean | null;
    display_order: number | null;
  }>;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function calculatePrice(
  costPrice: number,
  marginPercentage: number | null
): string {
  const margin = marginPercentage ?? DEFAULT_MARGIN;
  const sellingPriceHt = costPrice * (1 + margin / 100);
  const sellingPriceTtc = sellingPriceHt * 1.2;
  return sellingPriceTtc.toFixed(2);
}

function mapAvailability(stockStatus: string | null): string {
  switch (stockStatus) {
    case 'in_stock':
      return 'in stock';
    case 'out_of_stock':
      return 'out of stock';
    case 'coming_soon':
      return 'preorder';
    default:
      return 'out of stock';
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const brandFilter = request.nextUrl.searchParams.get('brand');

  let query = supabase
    .from('products')
    .select(
      `
      id, sku, name, slug, description, cost_price, margin_percentage,
      stock_status, condition, brand, gtin, supplier_reference, item_group_id,
      product_images!inner(public_url, is_primary, display_order)
    `
    )
    .eq('product_status', 'active')
    .eq('is_published_online', true)
    .not('slug', 'is', null)
    .not('cost_price', 'is', null)
    .order('name');

  if (brandFilter) {
    query = query.ilike('brand', brandFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products = (data ?? []) as unknown as FeedProduct[];

  const items = products
    .map(product => {
      const images = product.product_images
        .filter(img => img.public_url)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

      if (images.length === 0) return null;

      const primaryImage = images.find(img => img.is_primary) ?? images[0];
      const additionalImages = images
        .filter(img => img !== primaryImage)
        .slice(0, 10);

      const price = calculatePrice(
        Number(product.cost_price),
        product.margin_percentage ? Number(product.margin_percentage) : null
      );

      const title = escapeXml(String(product.name ?? '').substring(0, 150));
      const description = escapeXml(
        String(product.description ?? product.name ?? '').substring(0, 5000)
      );
      const link = `${SITE_URL}/produit/${String(product.slug)}`;
      const availability = mapAvailability(product.stock_status);
      const condition = String(product.condition ?? 'new');

      let itemXml = `    <item>
      <g:id>${escapeXml(String(product.sku))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${String(primaryImage.public_url)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:condition>${condition}</g:condition>
      <g:price>${price} EUR</g:price>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>`;

      if (product.brand) {
        itemXml += `\n      <g:brand>${escapeXml(String(product.brand))}</g:brand>`;
      }

      if (product.gtin) {
        itemXml += `\n      <g:gtin>${escapeXml(String(product.gtin))}</g:gtin>`;
      }

      if (product.supplier_reference) {
        itemXml += `\n      <g:mpn>${escapeXml(String(product.supplier_reference))}</g:mpn>`;
      }

      if (!product.gtin && !product.supplier_reference) {
        itemXml += `\n      <g:identifier_exists>false</g:identifier_exists>`;
      }

      if (product.item_group_id) {
        itemXml += `\n      <g:item_group_id>${escapeXml(String(product.item_group_id))}</g:item_group_id>`;
      }

      for (const img of additionalImages) {
        itemXml += `\n      <g:additional_image_link>${String(img.public_url)}</g:additional_image_link>`;
      }

      itemXml += `\n    </item>`;
      return itemXml;
    })
    .filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Verone Collections - Catalogue Produits</title>
    <link>${SITE_URL}</link>
    <description>Mobilier et decoration haut de gamme - Verone Collections</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
