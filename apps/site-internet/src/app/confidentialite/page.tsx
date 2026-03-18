import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité Vérone : données collectées, finalités, droits RGPD et contact DPO.',
  alternates: { canonical: '/confidentialite' },
};

export default function ConfidentialitePage() {
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
            La société Vérone SAS s&apos;engage à protéger la vie privée des
            utilisateurs de son site verone.fr. La présente politique de
            confidentialité décrit la manière dont nous collectons, utilisons et
            protégeons vos données personnelles, conformément au Règlement
            Général sur la Protection des Données (RGPD) et à la loi
            Informatique et Libertés.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Données collectées
          </h2>
          <p className="mb-3">
            Nous collectons les données suivantes dans le cadre de nos services
            :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Données d&apos;identification :</strong> nom, prénom,
              adresse email, numéro de téléphone
            </li>
            <li>
              <strong>Données de livraison :</strong> adresse postale
            </li>
            <li>
              <strong>Données de transaction :</strong> historique de commandes,
              montants (les données bancaires sont traitées exclusivement par
              Stripe)
            </li>
            <li>
              <strong>Données de navigation :</strong> cookies, adresse IP,
              pages visitées
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Finalités du traitement
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Traitement et suivi de vos commandes</li>
            <li>Gestion de votre compte client</li>
            <li>
              Communication relative à vos commandes (confirmations, suivi)
            </li>
            <li>
              Amélioration de nos services et de l&apos;expérience utilisateur
            </li>
            <li>
              Envoi de communications commerciales (avec votre consentement)
            </li>
            <li>Respect de nos obligations légales et réglementaires</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Base légale
          </h2>
          <p>Le traitement de vos données repose sur :</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>L&apos;exécution du contrat (traitement des commandes)</li>
            <li>Votre consentement (newsletters, cookies non essentiels)</li>
            <li>
              Notre intérêt légitime (amélioration des services, sécurité)
            </li>
            <li>Nos obligations légales (facturation, comptabilité)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Durée de conservation
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Données clients : 3 ans après le dernier achat</li>
            <li>Données de facturation : 10 ans (obligation légale)</li>
            <li>Cookies : 13 mois maximum</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Partage des données
          </h2>
          <p>
            Vos données peuvent être partagées avec nos prestataires de services
            dans le cadre strict de l&apos;exécution de nos prestations :
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Stripe :</strong> traitement des paiements
            </li>
            <li>
              <strong>Transporteurs :</strong> livraison des commandes
            </li>
            <li>
              <strong>Supabase / Vercel :</strong> hébergement des données
            </li>
          </ul>
          <p className="mt-2">
            Vos données ne sont jamais vendues à des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Vos droits
          </h2>
          <p className="mb-3">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Droit d&apos;accès à vos données personnelles</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d&apos;opposition</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, contactez-nous à : contact@verone.fr. Nous
            répondrons dans un délai de 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">CNIL</h2>
          <p>
            Si vous estimez que le traitement de vos données ne respecte pas la
            réglementation, vous pouvez introduire une réclamation auprès de la
            CNIL (Commission Nationale de l&apos;Informatique et des Libertés) :
            www.cnil.fr.
          </p>
        </section>

        <p className="text-xs text-verone-gray-400 pt-4">
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
