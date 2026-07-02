import type { Metadata } from 'next';

import { getCmsPage, CmsPageContent } from '@/components/cms/CmsPageContent';

// Revalidation régulière : le contenu vient de cms_pages (back-office).
// Sans ça, la page reste figée au build et ignore les modifications de contenu.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('mentions-legales');
  return {
    title: page?.meta_title ?? 'Mentions Legales',
    description: page?.meta_description ?? 'Mentions legales du site Verone.',
    alternates: { canonical: '/mentions-legales' },
  };
}

export default function MentionsLegalesPage() {
  return <CmsPageContent slug="mentions-legales" />;
}
