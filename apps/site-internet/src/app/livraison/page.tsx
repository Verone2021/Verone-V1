import type { Metadata } from 'next';

import { getCmsPage, CmsPageContent } from '@/components/cms/CmsPageContent';

// Revalidation régulière : le contenu vient de cms_pages (back-office).
// Sans ça, la page reste figée au build et ignore les modifications de contenu.
export const revalidate = 60;

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
