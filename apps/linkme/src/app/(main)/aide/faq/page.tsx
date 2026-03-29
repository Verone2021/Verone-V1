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
    question: "Comment modifier le prix d'un produit dans ma sélection ?",
    answer:
      'Rendez-vous dans votre sélection, puis cliquez sur l\'onglet "Produits". Pour chaque produit, vous pouvez ajuster votre marge en pourcentage. Le prix client est recalculé automatiquement.',
  },
  {
    question: 'Puis-je avoir plusieurs sélections ?',
    answer:
      "Oui ! Vous pouvez créer autant de sélections que vous le souhaitez. C'est même recommandé : créez des sélections thématiques (par style, par pièce, par budget) pour cibler différents profils de clients.",
  },
  {
    question: "Combien de temps pour qu'une commande soit validée ?",
    answer:
      "L'équipe Vérone valide les commandes sous 24 à 48h en jours ouvrables. Vous recevez une notification dès que le statut change.",
  },
  {
    question: 'Quand puis-je demander le versement de mes commissions ?',
    answer:
      'Une fois que le client a payé sa commande, votre commission passe en statut "Payable". Vous pouvez alors faire une demande de versement depuis la page Commissions.',
  },
  {
    question: 'Comment fonctionne le stockage ?',
    answer:
      'Si vous vendez vos propres produits (produits revendeur), Vérone propose un service de stockage. Les tarifs sont au m³ occupé avec un tarif dégressif. Consultez la page Stockage pour les détails.',
  },
  {
    question: 'Mes clients voient-ils le détail de ma marge ?',
    answer:
      'Non, jamais. Vos clients voient uniquement le prix TTC final que vous avez configuré. Votre marge reste confidentielle.',
  },
  {
    question: 'Que faire si un produit est en rupture de stock ?',
    answer:
      'Les produits en rupture sont automatiquement marqués dans le catalogue. Vous ne pouvez pas les ajouter à une commande. Ils restent dans votre sélection pour quand ils seront de nouveau disponibles.',
  },
  {
    question: "Comment contacter l'équipe Vérone ?",
    answer:
      "Pour toute question, envoyez un email à contact@verone.fr. L'équipe répond sous 24h en jours ouvrables.",
  },
];

export default function AideFaqPage(): JSX.Element {
  return (
    <AidePageLayout
      title="Questions fréquentes"
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
          Vous ne trouvez pas la réponse à votre question ?
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
