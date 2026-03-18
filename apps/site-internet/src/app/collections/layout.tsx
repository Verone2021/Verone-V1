import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Découvrez nos collections de déco et mobilier original. Des pièces sourcées avec soin, pour un intérieur qui vous ressemble.',
  alternates: { canonical: '/collections' },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
