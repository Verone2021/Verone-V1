import type { Metadata } from 'next';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import { buildCloudflareImageUrl } from '@verone/utils';

function resolveSocialImage(
  cloudflareId: string | null,
  fallback: string | null
): string | null {
  if (cloudflareId) {
    try {
      return buildCloudflareImageUrl(cloudflareId, 'public');
    } catch {
      // Cloudflare non configuré côté serveur → fallback
    }
  }
  return fallback;
}

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

interface RpcProductSummary {
  product_id: string;
  name: string;
  slug: string;
  seo_title: string | null;
  seo_meta_description: string | null;
  description: string | null;
  primary_cloudflare_image_id: string | null;
  primary_image_url: string | null;
  is_published: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: 'Produit' };
  }

  const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey);

  // La table `products` n'est pas accessible aux anon (RLS) → passer par la
  // RPC SECURITY DEFINER déjà utilisée côté client.
  const { data: rpcDataRaw, error: rpcError } = await supabase.rpc(
    'get_site_internet_products',
    { p_brand_slug: 'verone' }
  );

  if (rpcError) {
    console.error('[metadata produit] rpc error', rpcError);
    return { title: 'Produit' };
  }

  const rpcRows = (rpcDataRaw ?? []) as unknown as RpcProductSummary[];
  const product = rpcRows.find(r => r.slug === slug && r.is_published);

  if (!product) {
    return { title: 'Produit introuvable' };
  }

  const displayName = product.name;
  const socialImage = resolveSocialImage(
    product.primary_cloudflare_image_id,
    product.primary_image_url
  );

  const seoTitle = product.seo_title ?? displayName;
  const seoDescription =
    product.seo_meta_description ??
    product.description ??
    `${displayName} — Vérone, concept store déco & mobilier`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: `${siteUrl}/produit/${slug}`,
    },
    openGraph: {
      title: displayName,
      description: seoDescription,
      url: `${siteUrl}/produit/${slug}`,
      type: 'website',
      ...(socialImage
        ? { images: [{ url: socialImage, alt: displayName }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description: seoDescription,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
