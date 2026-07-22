/**
 * Page Politique Cookies - LinkMe
 *
 * Inventaire réel : seuls des cookies strictement nécessaires sont déposés
 * (session Supabase). Aucun cookie de mesure d'audience ni publicitaire →
 * aucun bandeau de consentement requis (art. 82 loi Informatique et Libertés).
 *
 * @module CookiesPage
 * @since 2026-01-23
 * @updated 2026-07-22 - LM-LEGAL-001 : inventaire réel, accents, contact marque
 */

import Link from 'next/link';

import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Politique Cookies',
  description: "Politique d'utilisation des cookies sur la plateforme LinkMe.",
  robots: {
    index: true,
    follow: false,
  },
  openGraph: {
    title: 'Politique Cookies — LinkMe',
    description: 'Les cookies utilisés par la plateforme LinkMe.',
    url: '/cookies',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Politique cookies LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/cookies',
  },
};

export default function CookiesPage(): JSX.Element {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Politique cookies</h1>
      <p className="lead text-gray-600">Dernière mise à jour : juillet 2026</p>

      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier déposé sur votre appareil lors de la
        visite d&apos;un site. Il permet de conserver des informations liées à
        votre navigation, par exemple pour vous maintenir connecté d&apos;une
        page à l&apos;autre.
      </p>

      <h2>2. Les cookies que nous utilisons</h2>
      <p>
        LinkMe n&apos;utilise{' '}
        <strong>que des cookies strictement nécessaires</strong> au
        fonctionnement du service. Nous ne déposons aucun cookie publicitaire,
        aucun cookie de réseau social et aucun outil de mesure d&apos;audience.
        Aucun de vos parcours n&apos;est revendu ni exploité à des fins de
        ciblage.
      </p>
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Cookie</th>
            <th className="border border-gray-300 px-4 py-2">Rôle</th>
            <th className="border border-gray-300 px-4 py-2">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-4 py-2">
              Session d&apos;authentification (Supabase)
            </td>
            <td className="border border-gray-300 px-4 py-2">
              Maintenir votre connexion et sécuriser votre compte
            </td>
            <td className="border border-gray-300 px-4 py-2">
              Jusqu&apos;à 30 jours, renouvelée à chaque connexion
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">
              Préférences d&apos;affichage
            </td>
            <td className="border border-gray-300 px-4 py-2">
              Mémoriser vos choix d&apos;interface
            </td>
            <td className="border border-gray-300 px-4 py-2">
              Jusqu&apos;à la fermeture du navigateur
            </td>
          </tr>
        </tbody>
      </table>

      <h2>3. Pourquoi aucun bandeau de consentement</h2>
      <p>
        Les cookies strictement nécessaires à la fourniture d&apos;un service
        expressément demandé par l&apos;utilisateur sont dispensés de
        consentement préalable. Comme nous n&apos;en déposons pas d&apos;autres,
        aucun bandeau ne vous est présenté. Si nous introduisions un jour un
        outil de mesure d&apos;audience ou de publicité, un bandeau de
        consentement serait mis en place et cette page mise à jour au préalable.
      </p>

      <h2>4. Services tiers</h2>
      <p>
        Certains prestataires techniques peuvent déposer des cookies
        indispensables à leur propre fonctionnement :
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentification et session.
        </li>
        <li>
          <strong>Vercel</strong> — hébergement et sécurité de la diffusion.
        </li>
        <li>
          <strong>Calendly</strong> — uniquement si vous ouvrez une page de
          réservation de rendez-vous.
        </li>
      </ul>

      <h2>5. Gérer les cookies</h2>
      <p>
        Vous pouvez à tout moment supprimer les cookies déjà déposés ou les
        bloquer depuis les réglages de votre navigateur (Chrome, Firefox,
        Safari, Edge). <strong>Attention :</strong> bloquer les cookies
        d&apos;authentification empêche la connexion à votre espace.
      </p>

      <h2>6. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans notre{' '}
        <Link href="/privacy">politique de confidentialité</Link>. Les
        informations sur l&apos;éditeur figurent dans les{' '}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question sur les cookies :{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>.
      </p>
    </article>
  );
}
