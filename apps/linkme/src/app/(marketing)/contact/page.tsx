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

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez l equipe LinkMe pour devenir affilie, etablir un partenariat ou poser vos questions. Reponse sous 24h.',
  openGraph: {
    title: 'Contactez LinkMe',
    description:
      'Une question sur notre plateforme d affiliation B2B ? Notre equipe vous repond sous 24h.',
    url: '/contact',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage(): JSX.Element {
  return <ContactForm />;
}
