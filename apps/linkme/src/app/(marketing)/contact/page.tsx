/**
 * Page Contact - LinkMe
 *
 * Server Component avec metadata SEO + composant client pour le formulaire
 *
 * @module ContactPage
 * @since 2026-01-23
 */

import type { Metadata } from 'next';

import { ContactForm } from './ContactForm';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Contactez l'équipe LinkMe — demande d'accès, démo réseau, fournisseur ou autre. Réponse sous 24h.",
  openGraph: {
    title: 'Contactez LinkMe',
    description: 'Une question sur LinkMe ? Notre équipe vous répond sous 24h.',
    url: '/contact',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Contactez LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage(): JSX.Element {
  return <ContactForm />;
}
