/**
 * Page Mentions légales - LinkMe
 *
 * Obligation légale (art. 6-III LCEN) : identification de l'éditeur et de
 * l'hébergeur. LinkMe est une marque éditée par la société Vérone (SASU).
 *
 * @module MentionsLegalesPage
 * @since 2026-07-22 - LM-LEGAL-001
 */

import Link from 'next/link';

import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Mentions légales de LinkMe — éditeur, hébergeur et informations légales de la société Vérone.',
  robots: {
    index: true,
    follow: false,
  },
  openGraph: {
    title: 'Mentions légales — LinkMe',
    description: 'Mentions légales de la plateforme LinkMe.',
    url: '/mentions-legales',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mentions légales LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/mentions-legales',
  },
};

export default function MentionsLegalesPage(): JSX.Element {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Mentions légales</h1>
      <p className="lead text-gray-600">Dernière mise à jour : juillet 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        LinkMe est une marque éditée par la société <strong>Vérone</strong>.
      </p>
      <ul>
        <li>
          <strong>Dénomination sociale :</strong> VERONE
        </li>
        <li>
          <strong>Forme juridique :</strong> Société par actions simplifiée
          unipersonnelle (SASU)
        </li>
        <li>
          <strong>Capital social :</strong> 1 000 €
        </li>
        <li>
          <strong>Siège social :</strong> 229 rue Saint-Honoré, 75001 Paris,
          France
        </li>
        <li>
          <strong>RCS :</strong> Paris 914 588 785
        </li>
        <li>
          <strong>SIRET (siège) :</strong> 914 588 785 00016
        </li>
        <li>
          <strong>N° de TVA intracommunautaire :</strong> FR20914588785
        </li>
        <li>
          <strong>Code APE / NAF :</strong> 4690Z — Commerce de gros non
          spécialisé
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>Roméo Dos Santos, président de la société Vérone.</p>

      <h2>3. Contact</h2>
      <p>
        Pour toute question relative au site ou à la plateforme :{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>. Vous
        pouvez également utiliser le{' '}
        <Link href="/contact">formulaire de contact</Link>.
      </p>

      <h2>4. Hébergement</h2>
      <p>Le site est hébergé par :</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong>
        </li>
        <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
        <li>
          Site web :{' '}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com
          </a>
        </li>
      </ul>
      <p>
        Les données de la plateforme sont hébergées au sein de l&apos;Union
        européenne par Supabase (infrastructure de base de données).
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site (marque LinkMe, textes,
        visuels, logos, illustrations, structure et code) est protégé par le
        droit de la propriété intellectuelle et demeure la propriété de la
        société Vérone ou de ses partenaires. Toute reproduction,
        représentation, adaptation ou exploitation, totale ou partielle, sans
        autorisation écrite préalable est interdite.
      </p>
      <p>
        Les visuels et descriptifs des produits présentés sur la plateforme
        restent la propriété de leurs titulaires respectifs et sont diffusés
        avec leur accord dans le cadre de la relation commerciale.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        La société Vérone met tout en œuvre pour assurer l&apos;exactitude des
        informations diffusées sur le site et la disponibilité du service. Elle
        ne saurait toutefois être tenue responsable des erreurs, omissions ou
        indisponibilités temporaires, ni de l&apos;usage fait des informations
        publiées. Les liens vers des sites tiers sont fournis à titre
        d&apos;information : leur contenu n&apos;engage que leurs éditeurs.
      </p>

      <h2>7. Données personnelles et cookies</h2>
      <p>
        Le traitement des données personnelles est décrit dans notre{' '}
        <Link href="/privacy">politique de confidentialité</Link>.
        L&apos;utilisation des cookies est détaillée dans notre{' '}
        <Link href="/cookies">politique cookies</Link>. Les conditions
        d&apos;utilisation de la plateforme figurent dans les{' '}
        <Link href="/cgu">conditions générales d&apos;utilisation</Link>.
      </p>

      <h2>8. Médiation de la consommation</h2>
      <p>
        La plateforme LinkMe s&apos;adresse à des professionnels. Dans
        l&apos;hypothèse où un utilisateur aurait la qualité de consommateur au
        sens du code de la consommation, il peut recourir gratuitement à un
        médiateur de la consommation en vue de la résolution amiable d&apos;un
        litige, après avoir adressé une réclamation écrite à{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>. La
        plateforme européenne de règlement en ligne des litiges est accessible à
        l&apos;adresse{' '}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Le présent site et les présentes mentions légales sont soumis au droit
        français. À défaut de résolution amiable, tout litige relève de la
        compétence des tribunaux de Paris, sous réserve des règles impératives
        applicables aux consommateurs.
      </p>
    </article>
  );
}
