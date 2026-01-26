'use client';

/**
 * Landing Page "How It Works" Section - LinkMe
 *
 * Section expliquant le fonctionnement en 4 etapes:
 * - Creez vos selections
 * - Definissez vos marges
 * - Partagez vos liens
 * - Suivez vos gains
 *
 * @module LandingHowItWorks
 * @since 2026-01-23
 */

import { LayoutGrid, SlidersHorizontal, Share2, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: LayoutGrid,
    title: 'Creez vos selections',
    description:
      'Parcourez notre catalogue de produits et creez des selections personnalisees pour votre audience. Chaque selection a son propre lien partageable.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    number: '02',
    icon: SlidersHorizontal,
    title: 'Definissez vos marges',
    description:
      'Ajustez vos marges produit par produit. Notre systeme de feux tricolore vous guide pour trouver le prix optimal entre competitivite et rentabilite.',
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Partagez vos liens',
    description:
      'Diffusez vos selections sur vos reseaux sociaux, votre site web, ou par email. Chaque lien est unique et tracable.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Suivez vos gains',
    description:
      'Visualisez vos ventes et commissions en temps reel dans votre dashboard. Recevez vos paiements de maniere simple et securisee.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
];

export function LandingHowItWorks(): JSX.Element {
  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#5DBEBB]/10 rounded-full text-sm font-medium text-[#5DBEBB] mb-4">
            Comment ca marche
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Lancez-vous en{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              4 etapes
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            De la creation de votre premiere selection a votre premier paiement,
            tout est simplifie.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector line (desktop only) */}
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-100 z-0" />
              )}

              <div className="relative z-10 bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
                {/* Step number + icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.bgGradient} flex items-center justify-center`}
                  >
                    <step.icon
                      className="h-6 w-6"
                      style={{ color: step.color }}
                    />
                  </div>
                  <span
                    className="text-3xl font-bold"
                    style={{ color: `${step.color}30` }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[#183559] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom visual - Dashboard mockup */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#7E84C0]/5 via-[#5DBEBB]/5 to-[#3976BB]/5 rounded-2xl p-6 border border-gray-100">
              {/* Mockup header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-gray-400">
                  dashboard.linkme.verone.io
                </span>
              </div>

              {/* Mockup content */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Stats cards */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">
                    Ventes ce mois
                  </div>
                  <div className="text-2xl font-bold text-[#183559]">--</div>
                  <div className="text-xs text-[#5DBEBB]">
                    Commencez a vendre
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Commissions</div>
                  <div className="text-2xl font-bold text-[#183559]">0 EUR</div>
                  <div className="text-xs text-gray-400">En attente</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Selections</div>
                  <div className="text-2xl font-bold text-[#183559]">0</div>
                  <div className="text-xs text-gray-400">Creez-en une !</div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm font-medium text-gray-700 mb-4">
                  Evolution des ventes
                </div>
                <div className="h-32 flex items-end justify-between gap-2 px-4">
                  {[20, 35, 25, 45, 30, 55, 40, 60, 45, 70, 50, 65].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#5DBEBB]/80 to-[#5DBEBB]/40 rounded-t opacity-50"
                        style={{ height: `${h}%` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
