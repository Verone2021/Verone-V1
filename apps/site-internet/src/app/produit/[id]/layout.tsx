import type { Metadata } from 'next';

import { createClient } from '@supabase/supabase-js';

import type { CatalogueProduct } from '@/hooks/use-catalogue-products';

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
  const result = await supabase.rpc('get_site_internet_products');
  const products = (result.data as CatalogueProduct[]) ?? [];
  const product = products.find(p => p.slug === slug);

  if (!product) {
    return { title: 'Produit introuvable | Vérone' };
  }

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
      ...(product.primary_image_url
        ? { images: [{ url: product.primary_image_url, alt: product.name }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description:
        product.seo_meta_description ?? product.description ?? product.name,
      ...(product.primary_image_url
        ? { images: [product.primary_image_url] }
        : {}),
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
