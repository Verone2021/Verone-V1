import type { Metadata } from 'next';

import { getCmsPage, CmsPageContent } from '@/components/cms/CmsPageContent';

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
