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
          Votre commission est la marge que vous definissez sur chaque produit
          de votre selection. Quand un client passe commande, la commission est
          calculee automatiquement.
        </p>
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
          <p className="font-medium text-linkme-marine text-center">
            Commission = Prix client TTC - Prix HT fournisseur - TVA
          </p>
        </div>
        <p>
          Pour les produits revendeur (Mes Produits), vous encaissez
          l&apos;integralite du prix de vente.
        </p>
      </AideSection>

      <AideSection title="Statuts des commissions">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">En attente</p>
              <p className="text-sm text-gray-500">
                La commande est en cours (pas encore livree). La commission
                n&apos;est pas encore payable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Payable</p>
              <p className="text-sm text-gray-500">
                La commande a ete livree. Vous pouvez demander le versement de
                cette commission.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
            <div className="w-3 h-3 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">
                En cours de reglement
              </p>
              <p className="text-sm text-gray-500">
                Vous avez demande le versement. Le paiement est en cours de
                traitement.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-3 h-3 rounded-full bg-gray-400 mt-1 flex-shrink-0" />
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
            description="Depuis la page Commissions, consultez le montant total de vos commissions payables (commandes livrees)."
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
