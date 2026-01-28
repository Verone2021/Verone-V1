/**
 * Page Politique Cookies - LinkMe
 *
 * @module CookiesPage
 * @since 2026-01-23
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique Cookies',
  description: 'Politique d utilisation des cookies sur la plateforme LinkMe.',
  robots: {
    index: true,
    follow: false,
  },
  alternates: {
    canonical: '/cookies',
  },
};

export default function CookiesPage() {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Politique Cookies</h1>
      <p className="lead text-gray-600">Derniere mise a jour : Janvier 2026</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-8">
        <p className="text-amber-800 m-0">
          <strong>Note :</strong> Cette page est en cours de redaction. La
          politique complete sera disponible prochainement.
        </p>
      </div>

      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte depose sur votre appareil lors de
        la visite d&apos;un site web. Il permet de stocker des informations
        relatives a votre navigation.
      </p>

      <h2>2. Types de cookies utilises</h2>
      <h3>Cookies essentiels</h3>
      <p>
        Ces cookies sont necessaires au fonctionnement de la plateforme. Ils
        permettent notamment de :
      </p>
      <ul>
        <li>Maintenir votre session connectee</li>
        <li>Memoriser vos preferences d&apos;affichage</li>
        <li>Assurer la securite de votre compte</li>
      </ul>

      <h3>Cookies analytiques</h3>
      <p>
        Ces cookies nous permettent de comprendre comment vous utilisez la
        plateforme afin d&apos;ameliorer nos services :
      </p>
      <ul>
        <li>Pages visitees</li>
        <li>Temps passe sur chaque page</li>
        <li>Actions effectuees</li>
      </ul>

      <h3>Cookies de performance</h3>
      <p>
        Ces cookies aident a optimiser les performances techniques de la
        plateforme.
      </p>

      <h2>3. Duree de conservation</h2>
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Type de cookie</th>
            <th className="border border-gray-300 px-4 py-2">Duree</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-4 py-2">
              Session (essentiels)
            </td>
            <td className="border border-gray-300 px-4 py-2">
              Jusqu&apos;a fermeture du navigateur
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">
              Authentification
            </td>
            <td className="border border-gray-300 px-4 py-2">30 jours</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Analytiques</td>
            <td className="border border-gray-300 px-4 py-2">13 mois</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Gestion des cookies</h2>
      <p>
        Vous pouvez a tout moment modifier vos preferences concernant les
        cookies :
      </p>
      <ul>
        <li>
          Via les parametres de votre navigateur (Chrome, Firefox, Safari, etc.)
        </li>
        <li>En utilisant notre bandeau de consentement</li>
      </ul>
      <p>
        <strong>Attention :</strong> La desactivation de certains cookies peut
        affecter le fonctionnement de la plateforme.
      </p>

      <h2>5. Cookies tiers</h2>
      <p>
        Nous utilisons des services tiers qui peuvent deposer leurs propres
        cookies :
      </p>
      <ul>
        <li>
          <strong>Supabase :</strong> Authentification et base de donnees
        </li>
        <li>
          <strong>Vercel :</strong> Hebergement et analytics
        </li>
      </ul>

      <h2>6. Mises a jour</h2>
      <p>
        Cette politique peut etre modifiee pour refleter les evolutions de nos
        pratiques. Nous vous encourageons a la consulter regulierement.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question concernant notre utilisation des cookies :{' '}
        <a href="mailto:contact@verone.io">contact@verone.io</a>
      </p>
    </article>
  );
}
