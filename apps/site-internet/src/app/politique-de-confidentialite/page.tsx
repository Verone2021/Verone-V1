import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité de Vérone Collections : collecte, utilisation et protection de vos données personnelles.',
  alternates: { canonical: '/politique-de-confidentialite' },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-12">
        Politique de confidentialité
      </h1>

      <div className="space-y-10 text-sm text-verone-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Introduction
          </h2>
          <p>
            La société Vérone SAS (&laquo;&nbsp;Vérone&nbsp;&raquo;,
            &laquo;&nbsp;nous&nbsp;&raquo;) accorde une grande importance à la
            protection de vos données personnelles. La présente politique de
            confidentialité décrit la manière dont nous collectons, utilisons et
            protégeons vos informations lorsque vous utilisez notre site
            veronecollections.fr et nos services.
          </p>
          <p className="mt-2">
            Cette politique est conforme au Règlement Général sur la Protection
            des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique
            et Libertés du 6 janvier 1978 modifiée.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Responsable du traitement
          </h2>
          <ul className="space-y-1">
            <li>
              <strong>Société :</strong> Vérone SAS
            </li>
            <li>
              <strong>Adresse :</strong> Paris, France
            </li>
            <li>
              <strong>Email :</strong> contact@veronecollections.fr
            </li>
            <li>
              <strong>Directeur de la publication :</strong> Roméo Dos Santos
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Données collectées
          </h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Données d&apos;identification :</strong> nom, prénom,
              adresse email, numéro de téléphone, adresse postale
            </li>
            <li>
              <strong>Données de commande :</strong> historique des commandes,
              produits achetés, montants, adresses de livraison et facturation
            </li>
            <li>
              <strong>Données de paiement :</strong> les paiements sont traités
              par notre prestataire Stripe. Nous ne stockons jamais vos données
              bancaires.
            </li>
            <li>
              <strong>Données de navigation :</strong> adresse IP, type de
              navigateur, pages consultées, durée de visite (via cookies
              analytiques)
            </li>
            <li>
              <strong>Données de compte :</strong> identifiants de connexion,
              préférences, liste de favoris
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Finalités du traitement
          </h2>
          <p>Vos données sont collectées pour les finalités suivantes :</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>Traitement et suivi de vos commandes</li>
            <li>Gestion de votre compte client</li>
            <li>
              Communication relative à vos commandes (confirmation, expédition,
              livraison)
            </li>
            <li>Service après-vente et gestion des retours</li>
            <li>
              Amélioration de nos services et de votre expérience utilisateur
            </li>
            <li>
              Envoi de newsletters et offres commerciales (uniquement avec votre
              consentement)
            </li>
            <li>Respect de nos obligations légales et comptables</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Base légale du traitement
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Exécution du contrat :</strong> traitement des commandes,
              livraison, facturation
            </li>
            <li>
              <strong>Consentement :</strong> newsletters, cookies analytiques
            </li>
            <li>
              <strong>Intérêt légitime :</strong> amélioration des services,
              prévention de la fraude
            </li>
            <li>
              <strong>Obligation légale :</strong> conservation des factures,
              obligations fiscales
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Destinataires des données
          </h2>
          <p>
            Vos données peuvent être transmises aux destinataires suivants, dans
            la stricte mesure nécessaire à l&apos;exécution des finalités
            décrites ci-dessus :
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Prestataire de paiement :</strong> Stripe (traitement
              sécurisé des paiements)
            </li>
            <li>
              <strong>Prestataire d&apos;hébergement :</strong> Vercel Inc.,
              Supabase Inc.
            </li>
            <li>
              <strong>Transporteurs :</strong> pour la livraison de vos
              commandes
            </li>
            <li>
              <strong>Prestataire d&apos;emailing :</strong> Resend (envoi des
              emails transactionnels)
            </li>
          </ul>
          <p className="mt-2">
            Nous ne vendons ni ne louons vos données personnelles à des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Durée de conservation
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Données clients :</strong> 3 ans après la dernière
              interaction
            </li>
            <li>
              <strong>Données de commande :</strong> 10 ans (obligations
              comptables)
            </li>
            <li>
              <strong>Cookies :</strong> 13 mois maximum
            </li>
            <li>
              <strong>Données de navigation :</strong> 26 mois
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Vos droits
          </h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants concernant
            vos données personnelles :
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Droit d&apos;accès :</strong> obtenir la confirmation que
              vos données sont traitées et en recevoir une copie
            </li>
            <li>
              <strong>Droit de rectification :</strong> corriger des données
              inexactes ou incomplètes
            </li>
            <li>
              <strong>Droit à l&apos;effacement :</strong> demander la
              suppression de vos données
            </li>
            <li>
              <strong>Droit à la limitation :</strong> restreindre le traitement
              de vos données
            </li>
            <li>
              <strong>Droit à la portabilité :</strong> recevoir vos données
              dans un format structuré
            </li>
            <li>
              <strong>Droit d&apos;opposition :</strong> vous opposer au
              traitement de vos données pour motifs légitimes
            </li>
            <li>
              <strong>Droit de retrait du consentement :</strong> retirer votre
              consentement à tout moment (newsletters, cookies)
            </li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez-nous à&nbsp;:&nbsp;
            <a
              href="mailto:contact@veronecollections.fr"
              className="text-verone-black underline"
            >
              contact@veronecollections.fr
            </a>
          </p>
          <p className="mt-2">
            Vous pouvez également introduire une réclamation auprès de la CNIL
            (Commission Nationale de l&apos;Informatique et des Libertés) :
            www.cnil.fr
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Cookies
          </h2>
          <p>
            Notre site utilise des cookies pour améliorer votre expérience de
            navigation. Les cookies essentiels sont nécessaires au
            fonctionnement du site (panier, session). Les cookies analytiques
            sont utilisés uniquement avec votre consentement pour comprendre
            comment vous utilisez notre site.
          </p>
          <p className="mt-2">
            Vous pouvez à tout moment modifier vos préférences de cookies via
            les paramètres de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Sécurité
          </h2>
          <p>
            Nous mettons en place des mesures techniques et organisationnelles
            appropriées pour protéger vos données personnelles contre tout accès
            non autorisé, perte, destruction ou altération. Les communications
            sont chiffrées via HTTPS/TLS. Les paiements sont sécurisés par
            Stripe (certifié PCI DSS).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Transferts internationaux
          </h2>
          <p>
            Certains de nos prestataires (Vercel, Stripe, Supabase) peuvent
            traiter des données en dehors de l&apos;Union européenne. Ces
            transferts sont encadrés par des clauses contractuelles types
            approuvées par la Commission européenne ou par des décisions
            d&apos;adéquation, garantissant un niveau de protection conforme au
            RGPD.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Modifications
          </h2>
          <p>
            Nous nous réservons le droit de modifier la présente politique de
            confidentialité à tout moment. Toute modification sera publiée sur
            cette page avec la date de mise à jour. Nous vous encourageons à
            consulter régulièrement cette page.
          </p>
        </section>

        <p className="text-xs text-verone-gray-400 pt-4">
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
