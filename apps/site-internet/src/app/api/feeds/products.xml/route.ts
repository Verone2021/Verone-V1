/**
 * GET /api/feeds/products.xml
 *
 * Google Shopping XML feed — SAME data source as site internet.
 * Uses RPC get_site_internet_products() for prices + stock_status.
 *
 * CRITICAL: Prices MUST match landing page. Stock must be accurate.
 * Products disabled for google_merchant channel are excluded.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://veronecollections.fr';
const GOOGLE_MERCHANT_CHANNEL_ID = 'd3d2b018-dfee-41c1-a955-f0690320afec';

interface SiteProduct {
  product_id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price_ttc: string;
  stock_status: string | null;
  brand: string | null;
  primary_image_url: string | null;
  image_urls: string[] | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get products from SAME RPC as site internet
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_site_internet_products'
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const products = (rpcData ?? []) as unknown as SiteProduct[];

  // 2. Get channel exclusions (products disabled for google_merchant)
  const { data: exclusions } = await supabase
    .from('channel_pricing')
    .select('product_id')
    .eq('channel_id', GOOGLE_MERCHANT_CHANNEL_ID)
    .eq('is_active', false);

  const excludedIds = new Set(
    (exclusions ?? []).map(e => e.product_id as string)
  );

  // 3b. Get stock quantities for Meta (requires g:quantity)
  const productIds = products.map(p => p.product_id);
  const { data: qtyData } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .in('id', productIds);

  const qtyMap = new Map(
    (qtyData ?? []).map(q => [
      q.id as string,
      (q.stock_quantity as number) ?? 0,
    ])
  );

  // 4. Generate XML feed
  const items = products
    .map(product => {
      if (!product.primary_image_url) return null;
      if (excludedIds.has(product.product_id)) return null;

      const stockStatus = product.stock_status ?? 'out_of_stock';
      const availability =
        stockStatus === 'in_stock'
          ? 'in stock'
          : stockStatus === 'coming_soon'
            ? 'preorder'
            : 'out of stock';

      const priceTtc = Number(product.price_ttc).toFixed(2);
      const title = escapeXml(String(product.name).substring(0, 150));
      const description = escapeXml(
        String(product.description ?? product.name).substring(0, 5000)
      );
      const link = `${SITE_URL}/produit/${String(product.slug)}`;

      const additionalImages = (product.image_urls ?? [])
        .filter(url => url !== product.primary_image_url)
        .slice(0, 10);

      let itemXml = `    <item>
      <g:id>${escapeXml(String(product.sku))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${String(product.primary_image_url)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:quantity>${Math.max(qtyMap.get(product.product_id) ?? 0, availability === 'in stock' ? 1 : 0)}</g:quantity>
      <quantity_to_sell_on_facebook>${Math.max(qtyMap.get(product.product_id) ?? 0, availability === 'in stock' ? 1 : 0)}</quantity_to_sell_on_facebook>
      <g:condition>new</g:condition>
      <g:price>${priceTtc} EUR</g:price>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>`;

      if (product.brand) {
        itemXml += `\n      <g:brand>${escapeXml(String(product.brand))}</g:brand>`;
      }

      if (!product.brand) {
        itemXml += `\n      <g:identifier_exists>false</g:identifier_exists>`;
      }

      for (const img of additionalImages) {
        itemXml += `\n      <g:additional_image_link>${String(img)}</g:additional_image_link>`;
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
