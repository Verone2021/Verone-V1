/**
 * Page A propos - LinkMe
 *
 * Presentation de LinkMe et de sa mission
 *
 * @module AboutPage
 * @since 2026-01-23
 */

import { Metadata } from 'next';
import Link from 'next/link';

import {
  Users,
  Target,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'A propos | LinkMe by Verone',
  description:
    "Decouvrez LinkMe, la plateforme d'affiliation B2B nouvelle generation pour les professionnels de la decoration et du mobilier d'interieur.",
};

const VALUES = [
  {
    icon: Target,
    title: 'Transparence',
    description:
      'Pricing clair et visible. Pas de frais caches, vous savez exactement ce que vous gagnez sur chaque vente.',
  },
  {
    icon: Lightbulb,
    title: 'Simplicite',
    description:
      'Contenu pret a l emploi: images optimisees, descriptions, prix recommandes. Concentrez-vous sur la vente.',
  },
  {
    icon: TrendingUp,
    title: 'Performance',
    description:
      'Analytics en temps reel pour suivre vos ventes et optimiser vos selections. Decisions basees sur les donnees.',
  },
  {
    icon: Users,
    title: 'Partenariat',
    description:
      'Une relation gagnant-gagnant. Votre succes est notre succes. Support dedie pour vous accompagner.',
  },
];

const FEATURES = [
  'Commissions definies par produit ET par selection',
  'Creez plusieurs selections adaptees a vos audiences',
  'Integration multicanale: social, web, email',
  'Suivi en temps reel de vos performances',
  'Paiements simplifies et securises',
];

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-20">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 lg:mb-24">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#183559] mb-6">
          Democratiser l&apos;affiliation{' '}
          <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
            B2B professionnelle
          </span>
        </h1>
        <p className="text-lg text-[#183559]/70 max-w-2xl mx-auto">
          LinkMe est ne pour repondre aux defis de l&apos;affiliation
          traditionnelle: rigidite, opacite, complexite. Notre mission est de
          creer un ecosysteme ou chaque professionnel peut monetiser son reseau
          simplement.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-br from-[#183559] to-[#183559]/90 text-white py-16 lg:py-24 mb-16 lg:mb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Notre vision</h2>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                Nous croyons que l&apos;affiliation B2B doit etre accessible a
                tous les professionnels, pas seulement aux grandes enseignes.
                LinkMe offre une flexibilite inegalee avec des commissions
                personnalisables par produit et par selection.
              </p>
              <ul className="space-y-3">
                {FEATURES.map(feature => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">
                LinkMe, c&apos;est quoi ?
              </h3>
              <p className="text-white/70 mb-4">
                Une plateforme d&apos;affiliation nouvelle generation qui
                combine:
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5DBEBB]/20 flex items-center justify-center">
                    <span className="text-[#5DBEBB] font-bold">1</span>
                  </div>
                  <span>Affiliation classique</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7E84C0]/20 flex items-center justify-center">
                    <span className="text-[#7E84C0] font-bold">2</span>
                  </div>
                  <span>Marketplace produits</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#3976BB]/20 flex items-center justify-center">
                    <span className="text-[#3976BB] font-bold">3</span>
                  </div>
                  <span>Outils SaaS integres</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 lg:mb-24">
        <h2 className="text-3xl font-bold text-[#183559] text-center mb-12">
          Nos valeurs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(value => (
            <div
              key={value.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-[#5DBEBB]/10 flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-[#5DBEBB]" />
              </div>
              <h3 className="text-lg font-semibold text-[#183559] mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-[#183559]/60">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#5DBEBB]/10 to-[#7E84C0]/10 rounded-2xl p-8 lg:p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#183559] mb-4">
            Pret a rejoindre LinkMe ?
          </h2>
          <p className="text-[#183559]/70 mb-8 max-w-xl mx-auto">
            Contactez-nous pour decouvrir comment LinkMe peut transformer votre
            activite.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5DBEBB] text-white font-semibold rounded-xl hover:bg-[#4CA9A6] transition-colors"
          >
            Nous contacter
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
