import Link from 'next/link';

import { Coins, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideCommissionsPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Commissions"
      icon={Coins}
      iconColor="bg-purple-100 text-purple-600"
    >
      <AideSection title="Comment sont calculees vos commissions ?">
        <p>
          Votre commission depend du type de produit que vous vendez : produits
          du catalogue Verone ou vos propres produits (revendeur).
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
            <p className="font-semibold text-linkme-marine mb-2">
              Produits catalogue
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Vous definissez un taux de marque (%) sur chaque produit de votre
              selection. Votre commission est calculee automatiquement a partir
              de ce taux.
            </p>
            <p className="font-medium text-linkme-marine text-center bg-white rounded p-2">
              Commission = Prix de vente HT x Taux de marque
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Exemple : produit vendu 100&#8364; HT avec 15% de marque =
              15&#8364; HT de commission par vente
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <p className="font-semibold text-linkme-marine mb-2">
              Produits revendeur (Mes Produits)
            </p>
            <p className="text-sm text-gray-600">
              Vous fixez librement le prix de vente. LinkMe preleve une
              commission de plateforme variable selon les produits (a partir de
              5%). Vous recevez le reste.
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Le taux de commission est indique sur chaque produit dans votre
              espace.
            </p>
          </div>
        </div>
      </AideSection>

      <AideSection title="Statuts des commissions">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">En attente</p>
              <p className="text-sm text-gray-500">
                La commande a ete expediee. En attente du paiement par le
                client. La commission n&apos;est pas encore payable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50">
            <div className="w-3 h-3 rounded-full bg-teal-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Payable</p>
              <p className="text-sm text-gray-500">
                Le client a paye. Vous pouvez demander le versement de cette
                commission.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
            <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Demande en cours</p>
              <p className="text-sm text-gray-500">
                Vous avez demande le versement. Le paiement est en cours de
                traitement par Verone.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50">
            <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Payee</p>
              <p className="text-sm text-gray-500">
                Le versement a ete effectue sur votre compte bancaire.
              </p>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Demander un versement">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Verifier les commissions payables"
            description="Depuis la page Commissions, consultez le montant total de vos commissions payables (commandes dont le client a paye)."
          />
          <AideStep
            number={2}
            title="Creer une demande de versement"
            description="Cliquez sur 'Demander un versement'. Selectionnez les commissions a inclure dans la demande."
          />
          <AideStep
            number={3}
            title="Suivi du paiement"
            description="Verone traite votre demande sous 5-10 jours ouvrables. Vous recevrez une notification quand le virement sera effectue."
          />
        </div>
      </AideSection>

      <div className="text-center">
        <Link
          href="/commissions"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Voir mes commissions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AidePageLayout>
  );
}
