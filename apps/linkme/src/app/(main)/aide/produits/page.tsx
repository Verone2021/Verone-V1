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
                <li>Stock et logistique geres par Verone</li>
                <li>Ajoutez-les a vos selections</li>
              </ul>
            </div>
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">
                Mes Produits
              </p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Vos propres produits (revendeur)</li>
                <li>Vous fixez le prix de vente</li>
                <li>LinkMe preleve une commission variable (a partir de 5%)</li>
                <li>Doivent etre approuves par Verone</li>
                <li>Possibilite de stockage chez Verone</li>
              </ul>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Ajouter un produit revendeur">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Creer le produit"
            description="Depuis Mes Produits, cliquez sur 'Nouveau produit'. Renseignez le nom, la description, les photos et le prix."
          />
          <AideStep
            number={2}
            title="Soumettre pour approbation"
            description="Le produit est soumis a l'equipe Verone pour validation. Delai habituel : 24-72h."
          />
          <AideStep
            number={3}
            title="Produit approuve"
            description="Une fois approuve, votre produit peut etre ajoute a vos selections et commande par vos clients."
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
              <p className="font-medium text-linkme-marine">Approuve</p>
              <p className="text-sm text-gray-500">
                Le produit est valide et peut etre propose dans vos selections.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
            <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Rejete</p>
              <p className="text-sm text-gray-500">
                Le produit ne repond pas aux criteres. Verifiez les commentaires
                de l&apos;equipe et soumettez a nouveau.
              </p>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Vendez vos produits, on gere la logistique">
        <p>
          Avec LinkMe, vous pouvez integrer vos propres produits a votre
          catalogue et les proposer dans vos selections, exactement comme les
          produits Verone. Vos clients les commandent de la meme maniere, sans
          difference visible.
        </p>
        <p>
          L&apos;avantage : vous vous concentrez sur la vente. Verone coordonne
          la logistique avec vos fournisseurs pour chaque commande. Vous
          n&apos;avez pas a gerer l&apos;expedition vous-meme.
        </p>

        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
          <p className="font-semibold text-linkme-marine mb-2">
            Comment ca fonctionne
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
                Integrez-les dans vos selections et vendez-les a vos clients.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">3.</span>
              <span>
                A chaque commande, Verone coordonne la logistique avec votre
                fournisseur pour l&apos;expedition.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-bold">4.</span>
              <span>
                Vous gerez vos conditions commerciales directement avec vos
                fournisseurs (paiements, delais, etc.).
              </span>
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
          <p className="font-medium text-linkme-marine mb-1">A noter</p>
          <p className="text-sm text-gray-600">
            LinkMe transmet les demandes de commande a votre fournisseur mais ne
            gere pas les paiements entre vous et vos fournisseurs. Veillez a
            definir vos conditions commerciales avec eux au prealable.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Verone propose egalement un service de stockage pour vos produits
          (tarifs au m³). Consultez la page Stockage pour les details.
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
