/**
 * Page CGU (Conditions Générales d'Utilisation) - LinkMe
 *
 * @module CGUPage
 * @since 2026-01-23
 * @updated 2026-07-22 - LM-LEGAL-001 : contenu finalisé, accents, contact marque
 */

import Link from 'next/link';

import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation de la plateforme d'affiliation multi-marques LinkMe.",
  robots: {
    index: true,
    follow: false,
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation — LinkMe",
    description: "Conditions Générales d'Utilisation de la plateforme LinkMe.",
    url: '/cgu',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CGU LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/cgu',
  },
};

export default function CGUPage(): JSX.Element {
  return (
    <article className="prose prose-lg max-w-none">
      <h1>Conditions Générales d&apos;Utilisation</h1>
      <p className="lead text-gray-600">Dernière mise à jour : juillet 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU »)
        définissent les modalités et conditions d&apos;accès et
        d&apos;utilisation de la plateforme LinkMe (ci-après « la Plateforme »),
        éditée par la société Vérone dont les coordonnées figurent dans les{' '}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>2. Acceptation des CGU</h2>
      <p>
        La création d&apos;un compte et l&apos;utilisation de la Plateforme
        impliquent l&apos;acceptation pleine et entière des présentes CGU. Si
        vous n&apos;acceptez pas ces conditions, vous devez renoncer à utiliser
        la Plateforme.
      </p>

      <h2>3. Description du service</h2>
      <p>
        LinkMe est une plateforme d&apos;affiliation multi-marques permettant
        aux enseignes, aux professionnels prescripteurs et aux créateurs de
        contenu de recommander des produits sélectionnés et de percevoir une
        rémunération sur les ventes générées. La Plateforme permet notamment de
        composer des sélections de produits, de les partager, de suivre les
        commandes qui en découlent et de demander le versement des commissions
        acquises.
      </p>
      <p>
        Le catalogue est constitué de produits proposés par plusieurs marques et
        fournisseurs référencés par l&apos;équipe LinkMe. Sa composition évolue
        librement : aucune permanence de référence, de disponibilité ou de tarif
        n&apos;est garantie.
      </p>

      <h2>4. Accès et éligibilité</h2>
      <p>
        La Plateforme est destinée à un usage professionnel. L&apos;accès est
        soumis à la création d&apos;un compte, après examen de la demande par
        l&apos;équipe LinkMe, qui peut refuser ou révoquer un accès sans avoir à
        justifier sa décision, notamment en cas d&apos;informations inexactes ou
        d&apos;activité incompatible avec l&apos;image des marques référencées.
      </p>

      <h2>5. Compte utilisateur</h2>
      <p>
        L&apos;utilisateur s&apos;engage à fournir des informations exactes,
        complètes et tenues à jour. Il est seul responsable de la
        confidentialité de ses identifiants et de toute activité réalisée depuis
        son compte. Toute utilisation frauduleuse ou perte de contrôle du compte
        doit être signalée sans délai à{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>.
      </p>
      <p>
        Un compte est personnel et rattaché à une enseigne ou à une
        organisation. Il ne peut être cédé ni partagé avec un tiers.
      </p>

      <h2>6. Obligations de l&apos;utilisateur</h2>
      <ul>
        <li>
          Présenter les produits de manière loyale, sans allégation trompeuse
          sur leurs caractéristiques, leur origine ou leur disponibilité.
        </li>
        <li>
          Indiquer clairement le caractère commercial de ses recommandations
          lorsque la réglementation applicable à la publicité et à
          l&apos;influence commerciale l&apos;exige.
        </li>
        <li>
          Respecter les droits de propriété intellectuelle attachés aux visuels,
          descriptifs et marques mis à disposition, et n&apos;en faire usage que
          dans le cadre de la promotion des produits référencés.
        </li>
        <li>
          Ne pas détourner la Plateforme de sa finalité, ne pas tenter
          d&apos;accéder à des données d&apos;autres utilisateurs, ne pas
          perturber son fonctionnement, ne pas générer de trafic ou de commandes
          artificiels.
        </li>
        <li>
          Respecter la réglementation applicable à son activité, y compris ses
          obligations fiscales et sociales.
        </li>
      </ul>

      <h2>7. Prix, commandes et livraison</h2>
      <p>
        Les prix affichés dans l&apos;espace connecté sont réservés aux
        utilisateurs disposant d&apos;un compte et ne peuvent être diffusés
        publiquement sans accord. Les commandes issues de la Plateforme sont
        soumises aux conditions commerciales communiquées lors de leur
        validation, incluant les modalités de livraison, de retour et de
        garantie applicables.
      </p>

      <h2>8. Commissions et paiements</h2>
      <p>
        La commission est calculée selon le taux applicable à chaque produit au
        moment de la validation de la commande. Elle est acquise lorsque la
        commande correspondante est effectivement encaissée et n&apos;est plus
        susceptible d&apos;annulation, de retour ou d&apos;impayé. Une commande
        annulée, remboursée ou impayée n&apos;ouvre droit à aucune commission ;
        une commission déjà versée dans ces circonstances est régularisée sur
        les versements suivants.
      </p>
      <p>
        Les demandes de versement s&apos;effectuent depuis l&apos;espace
        connecté. Le versement intervient selon la périodicité et le montant
        minimum indiqués sur la Plateforme, après émission des pièces comptables
        requises. L&apos;utilisateur est responsable de la déclaration des
        revenus perçus.
      </p>

      <h2>9. Disponibilité et évolutions</h2>
      <p>
        LinkMe s&apos;efforce d&apos;assurer la disponibilité de la Plateforme
        mais ne garantit pas une absence totale d&apos;interruption, notamment
        en cas de maintenance, d&apos;incident technique ou de défaillance
        d&apos;un prestataire. La Plateforme peut évoluer, être modifiée ou voir
        certaines fonctionnalités supprimées à tout moment.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        La responsabilité de la société Vérone ne peut être engagée qu&apos;en
        cas de faute prouvée et pour les seuls dommages directs. Elle ne saurait
        être tenue responsable des pertes de revenus, d&apos;audience ou
        d&apos;opportunité commerciale résultant de l&apos;utilisation ou de
        l&apos;indisponibilité de la Plateforme. L&apos;utilisateur reste seul
        responsable du contenu qu&apos;il publie sur ses propres supports.
      </p>

      <h2>11. Propriété intellectuelle</h2>
      <p>
        Les éléments de la Plateforme (marque LinkMe, textes, visuels, logos,
        structure, code) sont protégés et demeurent la propriété de la société
        Vérone ou de ses partenaires. L&apos;accès à la Plateforme ne confère
        aucun droit de propriété, mais un droit d&apos;usage personnel, non
        exclusif et révocable, limité à la durée du compte.
      </p>

      <h2>12. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans notre{' '}
        <Link href="/privacy">politique de confidentialité</Link> et
        l&apos;usage des cookies dans notre{' '}
        <Link href="/cookies">politique cookies</Link>.
      </p>

      <h2>13. Suspension et résiliation</h2>
      <p>
        L&apos;utilisateur peut demander la fermeture de son compte à tout
        moment. LinkMe peut suspendre ou fermer un compte en cas de manquement
        aux présentes CGU, de fraude ou d&apos;atteinte à l&apos;image des
        marques référencées. Les commissions régulièrement acquises avant la
        fermeture restent dues, sous réserve des régularisations prévues à
        l&apos;article 8.
      </p>

      <h2>14. Modification des CGU</h2>
      <p>
        LinkMe peut modifier les présentes CGU à tout moment. Les utilisateurs
        sont informés de toute modification significative, qui s&apos;applique
        aux utilisations postérieures à sa publication.
      </p>

      <h2>15. Droit applicable et litiges</h2>
      <p>
        Les présentes CGU sont soumises au droit français. En cas de litige, les
        parties recherchent d&apos;abord une solution amiable. À défaut, le
        litige relève de la compétence des tribunaux de Paris, sous réserve des
        règles impératives applicables aux consommateurs.
      </p>

      <h2>16. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU :{' '}
        <a href="mailto:contact@linkme.network">contact@linkme.network</a>.
      </p>
    </article>
  );
}
