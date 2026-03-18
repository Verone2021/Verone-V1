import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez Vérone : formulaire, email contact@verone.fr, téléphone. Notre équipe répond sous 24h.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
