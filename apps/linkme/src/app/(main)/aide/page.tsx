import Link from 'next/link';

import {
  BookOpen,
  Star,
  ShoppingCart,
  Package,
  Coins,
  HelpCircle,
  Rocket,
  ArrowRight,
} from 'lucide-react';

const helpSections = [
  {
    title: 'Guide de demarrage',
    description:
      'Premiers pas sur LinkMe : profil, selection, premiere commande.',
    href: '/aide/demarrer',
    icon: Rocket,
    color: 'bg-linkme-turquoise/10 text-linkme-turquoise',
  },
  {
    title: 'Selections',
    description: 'Creer, configurer et partager vos selections de produits.',
    href: '/aide/selections',
    icon: Star,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Commandes',
    description: 'Passer, suivre et gerer les commandes de vos clients.',
    href: '/aide/commandes',
    icon: ShoppingCart,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Mes Produits & Stockage',
    description:
      'Ajouter vos propres produits, gerer le stockage et les tarifs.',
    href: '/aide/produits',
    icon: Package,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Commissions',
    description: 'Comprendre vos gains, marges et demander un versement.',
    href: '/aide/commissions',
    icon: Coins,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Questions frequentes',
    description: 'Reponses aux questions les plus courantes.',
    href: '/aide/faq',
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-600',
  },
];

export default function AideIndexPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linkme-turquoise/10 mb-4">
            <BookOpen className="h-7 w-7 text-linkme-turquoise" />
          </div>
          <h1 className="text-2xl font-bold text-linkme-marine">
            Centre d&apos;aide LinkMe
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Tout ce que vous devez savoir pour tirer le meilleur parti de
            LinkMe. Guides pas-a-pas, conseils et FAQ.
          </p>
        </div>

        {/* Grille des sections */}
        <div className="grid gap-4 sm:grid-cols-2">
          {helpSections.map(section => (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-linkme-turquoise/30 hover:shadow-sm transition-all"
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${section.color}`}
              >
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-linkme-marine group-hover:text-linkme-turquoise transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {section.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-linkme-turquoise mt-1 flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        {/* CTA retour dashboard */}
        <div className="text-center mt-10">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-linkme-turquoise transition-colors"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
