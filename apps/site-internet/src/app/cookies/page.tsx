import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de cookies',
  description:
    'Politique de cookies Vérone : types de cookies utilisés, gestion des préférences et durée de conservation.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-12">
        Politique de cookies
      </h1>

      <div className="space-y-10 text-sm text-verone-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Qu&apos;est-ce qu&apos;un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal
            (ordinateur, tablette, smartphone) lors de votre visite sur notre
            site. Il permet de stocker des informations relatives à votre
            navigation et de vous reconnaître lors de vos visites ultérieures.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Cookies utilisés
          </h2>
          <div className="space-y-6">
            <div className="border border-verone-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-verone-black mb-2">
                Cookies essentiels (obligatoires)
              </h3>
              <p>
                Ces cookies sont indispensables au fonctionnement du site. Ils
                permettent notamment de maintenir votre session
                d&apos;authentification et de mémoriser le contenu de votre
                panier.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>
                  <strong>Session Supabase :</strong> authentification
                  utilisateur (durée : session)
                </li>
                <li>
                  <strong>Panier :</strong> sauvegarde du contenu du panier
                  (durée : 30 jours, localStorage)
                </li>
              </ul>
            </div>

            <div className="border border-verone-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-verone-black mb-2">
                Cookies analytiques (optionnels)
              </h3>
              <p>
                Ces cookies nous permettent de mesurer l&apos;audience de notre
                site et de comprendre comment les visiteurs l&apos;utilisent,
                afin d&apos;améliorer nos services.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>
                  <strong>Google Analytics :</strong> mesure d&apos;audience
                  anonymisée (durée : session)
                </li>
              </ul>
            </div>

            <div className="border border-verone-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-verone-black mb-2">
                Cookies tiers (optionnels)
              </h3>
              <p>
                Ces cookies sont déposés par des services tiers intégrés à notre
                site.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>
                  <strong>Stripe :</strong> sécurisation des paiements (déposé
                  uniquement sur la page de paiement)
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Gestion de vos préférences
          </h2>
          <p>
            Vous pouvez à tout moment modifier vos préférences en matière de
            cookies. Vous pouvez également configurer votre navigateur pour
            refuser les cookies :
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>
              <strong>Chrome :</strong> Paramètres &gt; Confidentialité et
              sécurité &gt; Cookies
            </li>
            <li>
              <strong>Firefox :</strong> Paramètres &gt; Vie privée et sécurité
              &gt; Cookies
            </li>
            <li>
              <strong>Safari :</strong> Préférences &gt; Confidentialité
            </li>
            <li>
              <strong>Edge :</strong> Paramètres &gt; Cookies et autorisations
              de site
            </li>
          </ul>
          <p className="mt-3">
            Attention : le blocage de certains cookies peut affecter le bon
            fonctionnement du site (panier, connexion).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Durée de conservation
          </h2>
          <p>
            Conformément aux recommandations de la CNIL, les cookies ont une
            durée de vie maximale de 13 mois. Votre consentement est renouvelé à
            chaque visite sur notre site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Contact
          </h2>
          <p>
            Pour toute question concernant notre politique de cookies,
            contactez-nous à : contact@verone.fr.
          </p>
        </section>

        <p className="text-xs text-verone-gray-400 pt-4">
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
