import type { Metadata } from 'next';

import { getCmsPage } from '@/components/cms/CmsPageContent';
import { CmsPageContent } from '@/components/cms/CmsPageContent';

// Revalidation régulière : le contenu vient de cms_pages (back-office).
// Sans ça, la page reste figée au build et ignore les modifications de contenu.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('cgv');
  return {
    title: page?.meta_title ?? 'Conditions Generales de Vente',
    description:
      page?.meta_description ??
      'CGV Verone : conditions de commande, paiement, livraison.',
    alternates: { canonical: '/cgv' },
  };
}

export default function CgvPage() {
  return <CmsPageContent slug="cgv" />;
}
