import Link from 'next/link';

import { Rocket, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideDemarrerPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Guide de démarrage"
      icon={Rocket}
      iconColor="bg-linkme-turquoise/10 text-linkme-turquoise"
    >
      <AideSection title="Bienvenue sur LinkMe !">
        <p>
          LinkMe est votre plateforme de vente partenaire. En quelques étapes
          simples, vous allez pouvoir proposer une sélection de produits à vos
          clients et générer des commissions sur chaque vente.
        </p>
        <p>Suivez ce guide pour être opérationnel en moins de 20 minutes.</p>
      </AideSection>

      <AideSection title="Les 7 étapes pour démarrer">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Complétez votre profil"
            description="Rendez-vous dans Mon Profil pour renseigner vos informations de contact et votre adresse. Ces informations apparaîtront sur vos documents."
          />
          <AideStep
            number={2}
            title="Personnalisez votre mini-site"
            description="Dans Paramètres, choisissez vos couleurs et ajoutez votre logo pour que votre sélection reflète votre identité visuelle."
          />
          <AideStep
            number={3}
            title="Créez votre première sélection"
            description="Allez dans Mes Sélections et cliquez sur 'Nouvelle sélection'. Donnez-lui un nom et choisissez sa visibilité (brouillon ou publiée)."
          />
          <AideStep
            number={4}
            title="Ajoutez des produits du catalogue"
            description="Parcourez le Catalogue pour découvrir les produits disponibles. Ajoutez ceux qui correspondent à votre clientèle dans votre sélection."
          />
          <AideStep
            number={5}
            title="Configurez vos marges"
            description="Définissez votre taux de marque pour chaque produit. Le prix de vente client sera calculé automatiquement en fonction du taux choisi."
          />
          <AideStep
            number={6}
            title="Partagez votre selection"
            description="Une fois votre sélection publiée, copiez le lien de partage et envoyez-le à vos clients. Ils pourront consulter et commander directement."
          />
          <AideStep
            number={7}
            title="Passez votre première commande"
            description="Quand un client souhaite commander, créez une commande depuis la page Commandes. Renseignez le client, les produits et l'adresse de livraison."
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
              Mes sélections
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
