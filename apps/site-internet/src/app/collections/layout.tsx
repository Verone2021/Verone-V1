import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Découvrez nos collections de mobilier et décoration haut de gamme, soigneusement composées pour sublimer votre intérieur.',
  alternates: { canonical: '/collections' },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
