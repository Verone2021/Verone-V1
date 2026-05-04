import type { Metadata } from 'next';

import { createClient } from '@supabase/supabase-js';
import { buildCloudflareImageUrl } from '@verone/utils';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';

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
    return { title: 'Produit | Vérone' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const result = await supabase.rpc('get_site_internet_products', {
    p_brand_slug: 'verone',
  });
  const products = (result.data as CatalogueProduct[]) ?? [];
  const product = products.find(p => p.slug === slug);

  if (!product) {
    return { title: 'Produit introuvable | Vérone' };
  }

  const socialImage = resolveSocialImage(
    product.primary_cloudflare_image_id,
    product.primary_image_url
  );

  return {
    title: product.seo_title ?? product.name,
    description:
      product.seo_meta_description ??
      product.description ??
      `${product.name} — Vérone, concept store déco & mobilier`,
    alternates: {
      canonical: `/produit/${slug}`,
    },
    openGraph: {
      title: product.name,
      description:
        product.seo_meta_description ??
        product.description ??
        `${product.name} — Vérone`,
      url: `${siteUrl}/produit/${slug}`,
      type: 'website',
      ...(socialImage
        ? { images: [{ url: socialImage, alt: product.name }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description:
        product.seo_meta_description ?? product.description ?? product.name,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
