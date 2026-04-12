import type { Metadata } from 'next';

import { getCmsPage, CmsPageContent } from '@/components/cms/CmsPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage('retours');
  return {
    title: page?.meta_title ?? 'Retours et Echanges',
    description: page?.meta_description ?? 'Politique de retour Verone.',
    alternates: { canonical: '/retours' },
  };
}

export default function RetoursPage() {
  return <CmsPageContent slug="retours" />;
}
