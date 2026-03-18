import { Suspense } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Parcourez notre sélection de déco et mobilier original. Des trouvailles sourcées avec soin, au juste prix.',
  alternates: { canonical: '/catalogue' },
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
