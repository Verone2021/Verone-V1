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

  const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey);

  const { data: product } = await supabase
    .from('products')
    .select(
      'id, name, commercial_name, meta_title, meta_description, description_short'
    )
    .eq('slug', slug)
    .eq('is_published_online', true)
    .single();

  if (!product) {
    return { title: 'Produit introuvable | Vérone' };
  }

  const displayName = product.commercial_name ?? product.name;

  // Récupère l'image principale séparément pour garder un select explicite
  const { data: images } = await supabase
    .from('product_images')
    .select('cloudflare_image_id, public_url, is_primary')
    .eq('product_id', product.id)
    .limit(10);

  const imageList = images ?? [];
  const primaryImg =
    imageList.find(img => img.is_primary) ?? imageList[0] ?? null;
  const socialImage = resolveSocialImage(
    primaryImg?.cloudflare_image_id ?? null,
    primaryImg?.public_url ?? null
  );

  return {
    title: product.meta_title ?? displayName,
    description:
      product.meta_description ??
      product.description_short ??
      `${displayName} — Vérone, concept store déco & mobilier`,
    alternates: {
      canonical: `${siteUrl}/produit/${slug}`,
    },
    openGraph: {
      title: displayName,
      description:
        product.meta_description ??
        product.description_short ??
        `${displayName} — Vérone`,
      url: `${siteUrl}/produit/${slug}`,
      type: 'website',
      ...(socialImage
        ? { images: [{ url: socialImage, alt: displayName }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description:
        product.meta_description ?? product.description_short ?? displayName,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
