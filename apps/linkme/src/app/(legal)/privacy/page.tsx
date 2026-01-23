/**
 * Page Politique de Confidentialite - LinkMe
 *
 * @module PrivacyPage
 * @since 2026-01-23
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialite | LinkMe',
  description:
    'Politique de confidentialite et protection des donnees personnelles de LinkMe.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Politique de Confidentialite</h1>
      <p className="lead text-gray-600">
        Derniere mise a jour : Janvier 2026
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-8">
        <p className="text-amber-800 m-0">
          <strong>Note :</strong> Cette page est en cours de redaction. La
          politique complete sera disponible prochainement.
        </p>
      </div>

      <h2>1. Introduction</h2>
      <p>
        LinkMe by Verone (ci-apres &quot;nous&quot;) s&apos;engage a proteger la vie
        privee des utilisateurs de sa plateforme. Cette politique de
        confidentialite explique comment nous collectons, utilisons et
        protegeons vos donnees personnelles.
      </p>

      <h2>2. Donnees collectees</h2>
      <p>Nous collectons les donnees suivantes :</p>
      <ul>
        <li>
          <strong>Donnees d&apos;identification :</strong> nom, prenom, email,
          telephone
        </li>
        <li>
          <strong>Donnees professionnelles :</strong> nom de l&apos;entreprise,
          SIRET, adresse
        </li>
        <li>
          <strong>Donnees de navigation :</strong> pages visitees, temps passe,
          actions effectuees
        </li>
        <li>
          <strong>Donnees transactionnelles :</strong> commandes, commissions,
          paiements
        </li>
      </ul>

      <h2>3. Finalites du traitement</h2>
      <p>Vos donnees sont utilisees pour :</p>
      <ul>
        <li>Gerer votre compte et vos acces a la plateforme</li>
        <li>Calculer et verser vos commissions</li>
        <li>Ameliorer nos services et votre experience utilisateur</li>
        <li>Vous envoyer des communications relatives a votre compte</li>
        <li>Respecter nos obligations legales</li>
      </ul>

      <h2>4. Base legale du traitement</h2>
      <p>Le traitement de vos donnees est fonde sur :</p>
      <ul>
        <li>L&apos;execution du contrat d&apos;affiliation</li>
        <li>Votre consentement (pour les communications marketing)</li>
        <li>Notre interet legitime (amelioration des services)</li>
        <li>Le respect d&apos;obligations legales</li>
      </ul>

      <h2>5. Partage des donnees</h2>
      <p>
        Vos donnees peuvent etre partagees avec nos sous-traitants techniques
        (hebergement, paiement) dans le strict respect de la reglementation.
        Nous ne vendons jamais vos donnees a des tiers.
      </p>

      <h2>6. Conservation des donnees</h2>
      <p>
        Vos donnees sont conservees pendant la duree de votre compte, puis
        archivees conformement aux obligations legales (10 ans pour les donnees
        comptables).
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Conformement au RGPD, vous disposez des droits suivants sur vos
        donnees :
      </p>
      <ul>
        <li>Droit d&apos;acces</li>
        <li>Droit de rectification</li>
        <li>Droit a l&apos;effacement</li>
        <li>Droit a la portabilite</li>
        <li>Droit d&apos;opposition</li>
        <li>Droit a la limitation du traitement</li>
      </ul>

      <h2>8. Securite</h2>
      <p>
        Nous mettons en oeuvre des mesures techniques et organisationnelles
        appropriees pour proteger vos donnees contre les acces non autorises,
        la perte ou la destruction.
      </p>

      <h2>9. Contact DPO</h2>
      <p>
        Pour exercer vos droits ou pour toute question relative a la protection
        de vos donnees, contactez-nous a :{' '}
        <a href="mailto:contact@verone.io">contact@verone.io</a>
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut etre modifiee a tout moment. Les modifications
        seront publiees sur cette page avec une nouvelle date de mise a jour.
      </p>
    </article>
  );
}
