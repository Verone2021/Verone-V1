import type { Metadata } from 'next';

import { getCmsPage, CmsPageContent } from '@/components/cms/CmsPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('livraison');
  return {
    title: page?.meta_title ?? 'Livraison',
    description: page?.meta_description ?? 'Informations livraison Verone.',
    alternates: { canonical: '/livraison' },
  };
}

export default function LivraisonPage() {
  return <CmsPageContent slug="livraison" />;
}
