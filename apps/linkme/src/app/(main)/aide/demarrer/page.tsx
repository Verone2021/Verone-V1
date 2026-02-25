import Link from 'next/link';

import { Rocket, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideDemarrerPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Guide de demarrage"
      icon={Rocket}
      iconColor="bg-linkme-turquoise/10 text-linkme-turquoise"
    >
      <AideSection title="Bienvenue sur LinkMe !">
        <p>
          LinkMe est votre plateforme de vente partenaire. En quelques etapes
          simples, vous allez pouvoir proposer une selection de produits a vos
          clients et generer des commissions sur chaque vente.
        </p>
        <p>Suivez ce guide pour etre operationnel en moins de 20 minutes.</p>
      </AideSection>

      <AideSection title="Les 7 etapes pour demarrer">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Completez votre profil"
            description="Rendez-vous dans Mon Profil pour renseigner vos informations de contact et votre adresse. Ces informations apparaitront sur vos documents."
          />
          <AideStep
            number={2}
            title="Personnalisez votre mini-site"
            description="Dans Parametres, choisissez vos couleurs et ajoutez votre logo pour que votre selection reflete votre identite visuelle."
          />
          <AideStep
            number={3}
            title="Creez votre premiere selection"
            description="Allez dans Mes Selections et cliquez sur 'Nouvelle selection'. Donnez-lui un nom et choisissez sa visibilite (brouillon ou publiee)."
          />
          <AideStep
            number={4}
            title="Ajoutez des produits du catalogue"
            description="Parcourez le Catalogue pour decouvrir les produits disponibles. Ajoutez ceux qui correspondent a votre clientele dans votre selection."
          />
          <AideStep
            number={5}
            title="Configurez vos marges"
            description="Pour chaque produit de votre selection, definissez votre marge. Le prix client sera calcule automatiquement : prix HT + votre marge."
          />
          <AideStep
            number={6}
            title="Partagez votre selection"
            description="Une fois votre selection publiee, copiez le lien de partage et envoyez-le a vos clients. Ils pourront consulter et commander directement."
          />
          <AideStep
            number={7}
            title="Passez votre premiere commande"
            description="Quand un client souhaite commander, creez une commande depuis la page Commandes. Renseignez le client, les produits et l'adresse de livraison."
          />
        </div>
      </AideSection>

      <AideSection title="Liens rapides">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/profil"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-linkme-turquoise/30 hover:bg-linkme-turquoise/5 transition-all text-sm"
          >
            <span className="font-medium text-linkme-marine">Mon profil</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link
            href="/ma-selection"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-linkme-turquoise/30 hover:bg-linkme-turquoise/5 transition-all text-sm"
          >
            <span className="font-medium text-linkme-marine">
              Mes selections
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link
            href="/catalogue"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-linkme-turquoise/30 hover:bg-linkme-turquoise/5 transition-all text-sm"
          >
            <span className="font-medium text-linkme-marine">Catalogue</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link
            href="/commandes"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-linkme-turquoise/30 hover:bg-linkme-turquoise/5 transition-all text-sm"
          >
            <span className="font-medium text-linkme-marine">Commandes</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </AideSection>
    </AidePageLayout>
  );
}
