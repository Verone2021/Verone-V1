import type { Metadata } from 'next';

import { getCmsPage } from '@/components/cms/CmsPageContent';
import { CmsPageContent } from '@/components/cms/CmsPageContent';

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
