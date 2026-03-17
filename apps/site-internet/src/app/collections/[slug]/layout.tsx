import type { Metadata } from 'next';

import { createClient } from '@supabase/supabase-js';

interface CollectionMeta {
  name: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
}

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: 'Collection | Vérone' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('collections')
    .select('name, description, meta_title, meta_description, image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('is_published_online', true)
    .single();

  const collection = data as CollectionMeta | null;

  if (!collection) {
    return { title: 'Collection introuvable | Vérone' };
  }

  return {
    title: collection.meta_title ?? collection.name,
    description:
      collection.meta_description ??
      collection.description ??
      `Collection ${collection.name} — Vérone`,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: collection.name,
      description: collection.meta_description ?? collection.description ?? '',
      url: `${siteUrl}/collections/${slug}`,
      type: 'website',
      ...(collection.image_url
        ? { images: [{ url: collection.image_url, alt: collection.name }] }
        : {}),
    },
  };
}

export default function CollectionLayout({ children }: Props) {
  return <>{children}</>;
}
