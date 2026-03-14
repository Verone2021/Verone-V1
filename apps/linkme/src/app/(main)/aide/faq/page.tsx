import Link from 'next/link';

import { HelpCircle } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';

interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps): JSX.Element {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-linkme-marine mb-2">{question}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
    </div>
  );
}

const faqItems: FaqItemProps[] = [
  {
    question: "Comment modifier le prix d'un produit dans ma selection ?",
    answer:
      'Rendez-vous dans votre selection, puis cliquez sur l\'onglet "Produits". Pour chaque produit, vous pouvez ajuster votre marge en pourcentage. Le prix client est recalcule automatiquement.',
  },
  {
    question: 'Puis-je avoir plusieurs selections ?',
    answer:
      "Oui ! Vous pouvez creer autant de selections que vous le souhaitez. C'est meme recommande : creez des selections thematiques (par style, par piece, par budget) pour cibler differents profils de clients.",
  },
  {
    question: "Combien de temps pour qu'une commande soit validee ?",
    answer:
      "L'equipe Verone valide les commandes sous 24 a 48h en jours ouvrables. Vous recevez une notification des que le statut change.",
  },
  {
    question: 'Quand puis-je demander le versement de mes commissions ?',
    answer:
      'Une fois que le client a paye sa commande, votre commission passe en statut "Payable". Vous pouvez alors faire une demande de versement depuis la page Commissions.',
  },
  {
    question: 'Comment fonctionne le stockage ?',
    answer:
      'Si vous vendez vos propres produits (produits revendeur), Verone propose un service de stockage. Les tarifs sont au m³ occupe avec un tarif degressif. Consultez la page Stockage pour les details.',
  },
  {
    question: 'Mes clients voient-ils le detail de ma marge ?',
    answer:
      'Non, jamais. Vos clients voient uniquement le prix TTC final que vous avez configure. Votre marge reste confidentielle.',
  },
  {
    question: 'Que faire si un produit est en rupture de stock ?',
    answer:
      'Les produits en rupture sont automatiquement marques dans le catalogue. Vous ne pouvez pas les ajouter a une commande. Ils restent dans votre selection pour quand ils seront de nouveau disponibles.',
  },
  {
    question: "Comment contacter l'equipe Verone ?",
    answer:
      "Pour toute question, envoyez un email a contact@verone.fr. L'equipe repond sous 24h en jours ouvrables.",
  },
];

export default function AideFaqPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Questions frequentes"
      icon={HelpCircle}
      iconColor="bg-gray-100 text-gray-600"
    >
      <div className="space-y-4">
        {faqItems.map(item => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </div>

      <div className="bg-linkme-turquoise/5 border border-linkme-turquoise/20 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-600 mb-3">
          Vous ne trouvez pas la reponse a votre question ?
        </p>
        <Link
          href="mailto:contact@verone.fr"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-colors text-sm font-medium"
        >
          Contacter l&apos;equipe Verone
        </Link>
      </div>
    </AidePageLayout>
  );
}
