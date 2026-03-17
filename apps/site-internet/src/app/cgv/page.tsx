import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description:
    'CGV Vérone : conditions de commande, paiement, livraison, droit de rétractation et garanties.',
  alternates: { canonical: '/cgv' },
};

export default function CgvPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-12">
        Conditions Générales de Vente
      </h1>

      <div className="space-y-10 text-sm text-verone-gray-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 1 - Objet
          </h2>
          <p>
            Les présentes conditions générales de vente (CGV) régissent les
            relations contractuelles entre la société Vérone SAS et tout client
            effectuant un achat sur le site verone.fr. Toute commande implique
            l&apos;acceptation sans réserve des présentes CGV.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 2 - Prix
          </h2>
          <p>
            Les prix sont indiqués en euros toutes taxes comprises (TTC),
            incluant la TVA française applicable au jour de la commande. Les
            frais de livraison sont indiqués séparément avant la validation de
            la commande. Vérone se réserve le droit de modifier ses prix à tout
            moment, les produits étant facturés au prix en vigueur lors de la
            validation de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 3 - Commande
          </h2>
          <p>
            Le client passe commande via le site verone.fr. La commande est
            considérée comme définitive après confirmation du paiement. Un email
            de confirmation est envoyé au client récapitulant les détails de la
            commande.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 4 - Paiement
          </h2>
          <p>
            Le paiement s&apos;effectue par carte bancaire (Visa, Mastercard,
            American Express) via la plateforme sécurisée Stripe. Le paiement
            est débité au moment de la validation de la commande. Aucune donnée
            bancaire n&apos;est stockée par Vérone.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 5 - Livraison
          </h2>
          <p>
            Les délais de livraison sont donnés à titre indicatif. Un retard de
            livraison ne saurait entraîner l&apos;annulation de la commande ni
            le versement de dommages et intérêts. La livraison est effectuée à
            l&apos;adresse indiquée lors de la commande. Le client est tenu de
            vérifier l&apos;état de la marchandise à la réception et
            d&apos;émettre des réserves auprès du transporteur en cas de
            dommage.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 6 - Droit de rétractation
          </h2>
          <p>
            Conformément aux articles L.221-18 et suivants du Code de la
            consommation, le client dispose d&apos;un délai de 14 jours à
            compter de la réception du produit pour exercer son droit de
            rétractation, sans avoir à motiver sa décision. Vérone étend ce
            délai à 30 jours. Pour exercer ce droit, le client doit notifier sa
            décision par email à contact@verone.fr. Les articles retournés
            doivent être dans leur état d&apos;origine, non utilisés et dans
            leur emballage d&apos;origine. Les articles sur mesure ou
            personnalisés sont exclus du droit de rétractation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 7 - Garanties
          </h2>
          <p>
            Tous nos produits bénéficient de la garantie légale de conformité
            (articles L.217-4 à L.217-14 du Code de la consommation) et de la
            garantie des vices cachés (articles 1641 à 1649 du Code civil). En
            cas de défaut de conformité, le client peut demander la réparation
            ou le remplacement du bien, ou à défaut un remboursement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 8 - Données personnelles
          </h2>
          <p>
            Les données personnelles collectées lors de la commande sont
            nécessaires au traitement de celle-ci. Elles sont traitées
            conformément à notre politique de confidentialité et au RGPD. Le
            client dispose d&apos;un droit d&apos;accès, de rectification et de
            suppression de ses données.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 9 - Médiation
          </h2>
          <p>
            En cas de litige, le client peut recourir gratuitement au médiateur
            de la consommation. Conformément à l&apos;article L.612-1 du Code de
            la consommation, tout consommateur a le droit de recourir
            gratuitement à un médiateur de la consommation en vue de la
            résolution amiable du litige.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-verone-black mb-3">
            Article 10 - Droit applicable
          </h2>
          <p>
            Les présentes CGV sont soumises au droit français. Tout litige sera
            de la compétence exclusive des tribunaux de Paris.
          </p>
        </section>

        <p className="text-xs text-verone-gray-400 pt-4">
          Dernière mise à jour : mars 2026
        </p>
      </div>
    </div>
  );
}
