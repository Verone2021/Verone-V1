import { Suspense } from 'react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    "Parcourez notre catalogue de mobilier et décoration d'intérieur haut de gamme. Canapés, tables, luminaires et plus.",
  alternates: { canonical: '/catalogue' },
};

export default function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
