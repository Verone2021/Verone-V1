import Link from 'next/link';

import { Star, ArrowRight } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

export default function AideSelectionsPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Selections"
      icon={Star}
      iconColor="bg-amber-100 text-amber-600"
    >
      <AideSection title="Qu'est-ce qu'une selection ?">
        <p>
          Une selection est votre vitrine personnalisee. C&apos;est une page web
          que vous partagez avec vos clients, contenant les produits que vous
          avez choisis dans le catalogue Verone.
        </p>
        <p>
          Chaque selection a son propre lien de partage, ses propres marges, et
          peut etre en mode brouillon (visible par vous seul) ou publiee
          (accessible via le lien).
        </p>
      </AideSection>

      <AideSection title="Creer une selection">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Nouvelle selection"
            description="Depuis Mes Selections, cliquez sur 'Nouvelle selection'. Choisissez un nom parlant pour vous y retrouver (ex: 'Collection Printemps 2026')."
          />
          <AideStep
            number={2}
            title="Ajouter des produits"
            description="Rendez-vous dans le Catalogue et ajoutez des produits a votre selection. Vous pouvez filtrer par categorie, prix ou nouveaute."
          />
          <AideStep
            number={3}
            title="Configurer les marges"
            description="Pour chaque produit, definissez votre marge en pourcentage. Le prix client sera : prix HT du produit + votre marge. Vous gagnez la marge sur chaque vente."
          />
          <AideStep
            number={4}
            title="Publier et partager"
            description="Passez la selection en mode 'Publiee' puis copiez le lien de partage. Envoyez-le par email, SMS ou reseaux sociaux a vos clients."
          />
        </div>
      </AideSection>

      <AideSection title="Visibilite : Brouillon vs Publiee">
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">Brouillon</p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Visible uniquement par vous</li>
                <li>Le lien de partage ne fonctionne pas</li>
                <li>Ideal pour preparer votre selection</li>
              </ul>
            </div>
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">Publiee</p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Accessible via le lien de partage</li>
                <li>Vos clients peuvent consulter les produits</li>
                <li>Vous pouvez la repasser en brouillon a tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </AideSection>

      <AideSection title="Conseils">
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Commencez avec 10-20 produits cibles plutot qu&apos;un catalogue
              entier. Une selection ciblee convertit mieux.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Utilisez des marges coherentes par gamme de prix. Ex: 15% sur le
              mobilier, 20% sur les accessoires.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Creez plusieurs selections thematiques (par style, par piece, par
              budget) pour cibler differents profils clients.
            </span>
          </li>
        </ul>
      </AideSection>

      <div className="text-center">
        <Link
          href="/ma-selection"
          className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-colors text-sm font-medium"
        >
          Gerer mes selections
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AidePageLayout>
  );
}
