/**
 * GET /api/feeds/products.xml
 *
 * Generates a Google Shopping XML feed using the SAME data source as the site internet.
 * Uses RPC get_site_internet_products() to guarantee price/title/description match.
 *
 * CRITICAL: Prices MUST match the landing page or Google will disapprove products.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://veronecollections.fr';

interface SiteProduct {
  product_id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  price_ttc: string;
  brand: string | null;
  primary_image_url: string | null;
  image_urls: string[] | null;
  status: string;
  selling_points: string[] | null;
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

  // Use the SAME RPC as the site internet — guarantees identical data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, error } = await supabase.rpc('get_site_internet_products');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products = (data ?? []) as unknown as SiteProduct[];

  const items = products
    .map(product => {
      if (!product.primary_image_url) return null;

      const priceTtc = Number(product.price_ttc).toFixed(2);
      const title = escapeXml(String(product.name).substring(0, 150));
      const description = escapeXml(
        String(product.description ?? product.name).substring(0, 5000)
      );
      const link = `${SITE_URL}/produit/${String(product.slug)}`;
      // All site internet products are active — availability = in stock
      const availability =
        product.status === 'active' ? 'in stock' : 'out of stock';

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
