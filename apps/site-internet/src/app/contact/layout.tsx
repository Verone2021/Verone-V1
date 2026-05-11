import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Vérone Collections',
  description:
    'Une question sur une pièce, une commande, ou autre chose. On répond vite — sous 48h en semaine, en humain.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
