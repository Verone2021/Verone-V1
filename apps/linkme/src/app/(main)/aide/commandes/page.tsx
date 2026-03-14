import Link from 'next/link';

import { ShoppingCart, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideCommandesPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Commandes"
      icon={ShoppingCart}
      iconColor="bg-blue-100 text-blue-600"
    >
      <AideSection title="Comment fonctionne une commande ?">
        <p>
          Quand un de vos clients souhaite acheter un produit, vous creez une
          commande sur LinkMe. La commande passe ensuite par plusieurs etapes de
          validation avant livraison.
        </p>
        <p>
          Vous suivez l&apos;avancement en temps reel depuis votre espace
          Commandes.
        </p>
      </AideSection>

      <AideSection title="Creer une commande">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Nouvelle commande"
            description="Depuis la page Commandes, cliquez sur 'Nouvelle commande'. Vous pouvez aussi commander directement depuis votre selection."
          />
          <AideStep
            number={2}
            title="Renseigner le client"
            description="Indiquez les informations du client : nom, email, telephone. Si c'est un client existant, selectionnez-le dans la liste."
          />
          <AideStep
            number={3}
            title="Ajouter les produits"
            description="Selectionnez les produits a commander et les quantites. Les prix sont calcules selon le taux de marque defini dans votre selection."
          />
          <AideStep
            number={4}
            title="Adresse de livraison"
            description="Renseignez l'adresse de livraison du client. L'adresse est verifiee automatiquement."
          />
          <AideStep
            number={5}
            title="Valider la commande"
            description="Verifiez le recapitulatif et validez. La commande passe en statut 'En approbation' chez Verone."
          />
        </div>
      </AideSection>

      <AideSection title="Statuts d'une commande">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">En approbation</p>
              <p className="text-sm text-gray-500">
                La commande est en attente de validation par l&apos;equipe
                Verone. Delai habituel : 24-48h.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
            <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Validee</p>
              <p className="text-sm text-gray-500">
                Confirmee par Verone, la commande est en preparation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50">
            <div className="w-3 h-3 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Expediee</p>
              <p className="text-sm text-gray-500">
                Les produits sont en cours de livraison vers le client.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Livree</p>
              <p className="text-sm text-gray-500">
                Le client a recu sa commande. Votre commission devient payable.
              </p>
            </div>
          </div>
        </div>
      </AideSection>

      <div className="text-center">
        <Link
          href="/commandes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Voir mes commandes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AidePageLayout>
  );
}
