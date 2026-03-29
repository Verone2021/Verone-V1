import Link from 'next/link';

import { Package, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideProduitsPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Mes Produits & Stockage"
      icon={Package}
      iconColor="bg-green-100 text-green-600"
    >
      <AideSection title="Produits catalogue vs Mes produits">
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">
                Produits Catalogue
              </p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Produits du catalogue Verone</li>
                <li>Vous gagnez une marge sur chaque vente</li>
                <li>Stock et logistique gérés par Vérone</li>
                <li>Ajoutez-les à vos sélections</li>
              </ul>
            </div>
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">
                Mes Produits
              </p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Vos propres produits (revendeur)</li>
                <li>Vous fixez le prix de vente</li>
                <li>LinkMe prélève une commission variable (à partir de 5%)</li>
                <li>Doivent être approuvés par Vérone</li>
                <li>Possibilité de stockage chez Vérone</li>
              </ul>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Ajouter un produit revendeur">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Créer le produit"
            description="Depuis Mes Produits, cliquez sur 'Nouveau produit'. Renseignez le nom, la description, les photos et le prix."
          />
          <AideStep
            number={2}
            title="Soumettre pour approbation"
            description="Le produit est soumis à l'équipe Vérone pour validation. Délai habituel : 24-72h."
          />
          <AideStep
            number={3}
            title="Produit approuvé"
            description="Une fois approuvé, votre produit peut être ajouté à vos sélections et commandé par vos clients."
          />
        </div>
      </AideSection>

      <AideSection title="Statuts d'approbation">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">En attente</p>
              <p className="text-sm text-gray-500">
                Votre produit est en cours de revue par l&apos;equipe Verone.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Approuvé</p>
              <p className="text-sm text-gray-500">
                Le produit est validé et peut être proposé dans vos sélections.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
            <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Rejeté</p>
              <p className="text-sm text-gray-500">
                Le produit ne répond pas aux critères. Vérifiez les commentaires
                de l&apos;equipe et soumettez à nouveau.
              </p>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Vendez vos produits, on gere la logistique">
        <p>
          Avec LinkMe, vous pouvez intégrer vos propres produits à votre
          catalogue et les proposer dans vos sélections, exactement comme les
          produits Vérone. Vos clients les commandent de la même manière, sans
          différence visible.
        </p>
        <p>
          L&apos;avantage : vous vous concentrez sur la vente. Vérone coordonne
          la logistique avec vos fournisseurs pour chaque commande. Vous
          n&apos;avez pas à gérer l&apos;expédition vous-même.
        </p>

        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
          <p className="font-semibold text-linkme-marine mb-2">
            Comment ça fonctionne
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">1.</span>
              <span>
                Ajoutez vos produits avec leurs informations (nom, description,
                photos, prix).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">2.</span>
              <span>
                Intégrez-les dans vos sélections et vendez-les à vos clients.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">3.</span>
              <span>
                À chaque commande, Vérone coordonne la logistique avec votre
                fournisseur pour l&apos;expedition.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">4.</span>
              <span>
                Vous gérez vos conditions commerciales directement avec vos
                fournisseurs (paiements, délais, etc.).
              </span>
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
          <p className="font-medium text-linkme-marine mb-1">A noter</p>
          <p className="text-sm text-gray-600">
            LinkMe transmet les demandes de commande à votre fournisseur mais ne
            gère pas les paiements entre vous et vos fournisseurs. Veillez à
            définir vos conditions commerciales avec eux au préalable.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Vérone propose également un service de stockage pour vos produits
          (tarifs au m³). Consultez la page Stockage pour les détails.
        </p>
      </AideSection>

      <div className="flex justify-center gap-3">
        <Link
          href="/mes-produits"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Mes produits
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/stockage"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
        >
          Stockage
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AidePageLayout>
  );
}
