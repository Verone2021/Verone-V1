/**
 * Page CGU (Conditions Generales d'Utilisation) - LinkMe
 *
 * @module CGUPage
 * @since 2026-01-23
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation | LinkMe",
  description: "Conditions Generales d'Utilisation de la plateforme LinkMe.",
};

export default function CGUPage() {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Conditions Generales d&apos;Utilisation</h1>
      <p className="lead text-gray-600">
        Derniere mise a jour : Janvier 2026
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-8">
        <p className="text-amber-800 m-0">
          <strong>Note :</strong> Cette page est en cours de redaction. Les
          conditions completes seront disponibles prochainement.
        </p>
      </div>

      <h2>1. Objet</h2>
      <p>
        Les presentes Conditions Generales d&apos;Utilisation (ci-apres &quot;CGU&quot;)
        ont pour objet de definir les modalites et conditions d&apos;utilisation
        de la plateforme LinkMe (ci-apres &quot;la Plateforme&quot;).
      </p>

      <h2>2. Acceptation des CGU</h2>
      <p>
        L&apos;utilisation de la Plateforme implique l&apos;acceptation pleine
        et entiere des presentes CGU. Si vous n&apos;acceptez pas ces
        conditions, veuillez ne pas utiliser la Plateforme.
      </p>

      <h2>3. Description du service</h2>
      <p>
        LinkMe est une plateforme d&apos;affiliation B2B permettant aux
        professionnels de la decoration et du mobilier d&apos;interieur de
        monetiser leur reseau en recommandant des produits.
      </p>

      <h2>4. Inscription et compte utilisateur</h2>
      <p>
        Pour utiliser les services de la Plateforme, l&apos;utilisateur doit
        creer un compte en fournissant des informations exactes et completes.
        L&apos;utilisateur est responsable de la confidentialite de ses
        identifiants.
      </p>

      <h2>5. Commissions et paiements</h2>
      <p>
        Les commissions sont calculees selon les taux definis pour chaque
        produit. Les paiements sont effectues selon les modalites prevues dans
        le contrat d&apos;affiliation.
      </p>

      <h2>6. Responsabilites</h2>
      <p>
        LinkMe s&apos;engage a fournir un service de qualite mais ne peut
        garantir l&apos;absence d&apos;interruptions ou d&apos;erreurs.
        L&apos;utilisateur utilise la Plateforme sous sa propre responsabilite.
      </p>

      <h2>7. Propriete intellectuelle</h2>
      <p>
        L&apos;ensemble des elements de la Plateforme (textes, images, logos,
        etc.) sont proteges par les droits de propriete intellectuelle et
        appartiennent a Verone ou a ses partenaires.
      </p>

      <h2>8. Modification des CGU</h2>
      <p>
        LinkMe se reserve le droit de modifier les presentes CGU a tout moment.
        Les utilisateurs seront informes de toute modification significative.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Les presentes CGU sont soumises au droit francais. Tout litige sera
        porte devant les tribunaux competents de Paris.
      </p>

      <h2>10. Contact</h2>
      <p>
        Pour toute question concernant les presentes CGU, veuillez nous
        contacter a : <a href="mailto:contact@verone.io">contact@verone.io</a>
      </p>
    </article>
  );
}
