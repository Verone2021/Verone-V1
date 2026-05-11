import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos collections',
  description:
    'Pas un catalogue fourre-tout. Trois univers, trois regards différents — chacun trié avec le même niveau d’exigence.',
  alternates: { canonical: '/collections' },
  openGraph: {
    type: 'website',
    title: 'Nos collections — Vérone',
    description:
      'Trois univers, trois regards. Chaque espace, une sélection rigoureuse.',
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
