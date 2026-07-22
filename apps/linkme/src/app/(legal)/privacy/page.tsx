/**
 * Page Politique de Confidentialité - LinkMe
 *
 * @module PrivacyPage
 * @since 2026-01-23
 * @updated 2026-07-22 - LM-LEGAL-001 : contenu finalisé, accents, contact marque
 */

import Link from 'next/link';

import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description:
    'Politique de confidentialité et protection des données personnelles de LinkMe.',
  robots: {
    index: true,
    follow: false,
  },
  openGraph: {
    title: 'Politique de Confidentialité — LinkMe',
    description:
      'Comment LinkMe collecte, utilise et protège vos données personnelles.',
    url: '/privacy',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Politique de confidentialité LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage(): JSX.Element {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Politique de confidentialité</h1>
      <p className="lead text-gray-600">Dernière mise à jour : juillet 2026</p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est la société <strong>Vérone</strong>,
        éditrice de la marque LinkMe, dont les coordonnées complètes figurent
        dans les <Link href="/mentions-legales">mentions légales</Link>. Pour
        toute question relative à vos données :{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>.
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons uniquement les données nécessaires au service :</p>
      <ul>
        <li>
          <strong>Identification :</strong> nom, prénom, adresse e-mail,
          téléphone.
        </li>
        <li>
          <strong>Données professionnelles :</strong> enseigne ou organisation,
          fonction, adresse, numéro SIRET, coordonnées de facturation.
        </li>
        <li>
          <strong>Données de compte :</strong> identifiants de connexion,
          sélections créées, préférences d&apos;affichage.
        </li>
        <li>
          <strong>Données transactionnelles :</strong> commandes rattachées,
          commissions calculées, demandes de versement, pièces comptables.
        </li>
        <li>
          <strong>Données de contact :</strong> informations transmises via le
          formulaire de contact ou lors d&apos;un rendez-vous.
        </li>
      </ul>
      <p>
        Nous ne collectons aucune donnée sensible au sens du RGPD et
        n&apos;utilisons aucun outil de profilage publicitaire.
      </p>

      <h2>3. Finalités</h2>
      <ul>
        <li>Créer et gérer votre compte et vos accès.</li>
        <li>
          Rattacher les commandes générées, calculer et verser vos commissions.
        </li>
        <li>Répondre à vos demandes et assurer le support.</li>
        <li>Assurer la sécurité de la plateforme et prévenir la fraude.</li>
        <li>Respecter nos obligations légales, comptables et fiscales.</li>
      </ul>

      <h2>4. Bases légales</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> : gestion du compte, des
          commandes et des commissions.
        </li>
        <li>
          <strong>Intérêt légitime</strong> : sécurité de la plateforme,
          prévention de la fraude, réponse aux demandes entrantes.
        </li>
        <li>
          <strong>Obligation légale</strong> : conservation des pièces
          comptables et fiscales.
        </li>
        <li>
          <strong>Consentement</strong> : lorsqu&apos;il est requis, pour des
          communications non indispensables au service.
        </li>
      </ul>

      <h2>5. Destinataires et sous-traitants</h2>
      <p>
        Vos données sont accessibles à l&apos;équipe Vérone habilitée et à nos
        sous-traitants techniques, dans la stricte limite de leur mission :
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — base de données et authentification
          (hébergement au sein de l&apos;Union européenne).
        </li>
        <li>
          <strong>Vercel Inc.</strong> — hébergement et diffusion du site
          (États-Unis).
        </li>
        <li>
          <strong>Resend</strong> — envoi des e-mails transactionnels et des
          notifications.
        </li>
        <li>
          <strong>Calendly</strong> — prise de rendez-vous, lorsque vous
          choisissez de réserver un créneau.
        </li>
      </ul>
      <p>
        Certains de ces prestataires sont établis hors de l&apos;Union
        européenne. Les transferts correspondants sont encadrés par les clauses
        contractuelles types de la Commission européenne ou un mécanisme
        équivalent. <strong>Nous ne vendons jamais vos données</strong> et ne
        les transmettons à aucun tiers à des fins publicitaires.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Compte actif :</strong> pendant toute la durée de la relation,
          puis 3 ans après le dernier contact.
        </li>
        <li>
          <strong>Demandes de contact sans suite :</strong> 3 ans à compter de
          la dernière prise de contact.
        </li>
        <li>
          <strong>Pièces comptables et factures :</strong> 10 ans, conformément
          au code de commerce.
        </li>
        <li>
          <strong>Journaux techniques de sécurité :</strong> 12 mois maximum.
        </li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au règlement général sur la protection des données, vous
        disposez des droits d&apos;accès, de rectification, d&apos;effacement,
        de limitation, d&apos;opposition et de portabilité, ainsi que du droit
        de définir des directives relatives au sort de vos données après votre
        décès.
      </p>
      <p>
        Pour les exercer, écrivez à{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>. Nous
        répondons dans un délai d&apos;un mois. Si la réponse ne vous satisfait
        pas, vous pouvez introduire une réclamation auprès de la CNIL —{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
        .
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles
        adaptées : chiffrement des échanges, cloisonnement des accès par compte
        et par organisation, contrôle des habilitations et journalisation des
        opérations sensibles.
      </p>

      <h2>9. Cookies</h2>
      <p>
        L&apos;usage des cookies est détaillé dans notre{' '}
        <Link href="/cookies">politique cookies</Link>.
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut évoluer. Toute modification est publiée sur cette
        page avec une nouvelle date de mise à jour.
      </p>
    </article>
  );
}
