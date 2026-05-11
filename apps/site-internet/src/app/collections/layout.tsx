import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections déco par univers',
  description:
    "Salon, Chambre, Extérieur. Trois univers éditoriaux, chacun trié avec le même niveau d'exigence. Trouve la pièce qu'il te faut.",
  alternates: { canonical: '/collections' },
  openGraph: {
    type: 'website',
    title: 'Collections déco par univers',
    description:
      "Salon, Chambre, Extérieur. Trois univers éditoriaux, chacun trié avec le même niveau d'exigence. Trouve la pièce qu'il te faut.",
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
