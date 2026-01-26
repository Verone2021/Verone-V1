'use client';

/**
 * Landing Page Features Section - LinkMe
 *
 * Section presentant les 3 avantages cles:
 * - Commissions attractives
 * - Suivi en temps reel
 * - Paiement simplifie
 *
 * @module LandingFeatures
 * @since 2026-01-07
 */

import { Percent, Activity, CreditCard } from 'lucide-react';

// Features data
const FEATURES = [
  {
    icon: Percent,
    title: 'Marges configurables',
    description:
      'Configurez vos marges produit par produit selon votre strategie. Transparence totale sur vos gains avec notre systeme de calcul en temps reel.',
    color: '#5DBEBB',
    bgGradient: 'from-[#5DBEBB]/10 to-[#5DBEBB]/5',
  },
  {
    icon: Activity,
    title: 'Suivi en temps reel',
    description:
      'Dashboard intuitif pour suivre vos ventes, commissions et performances. Donnees actualisees en continu.',
    color: '#7E84C0',
    bgGradient: 'from-[#7E84C0]/10 to-[#7E84C0]/5',
  },
  {
    icon: CreditCard,
    title: 'Paiement simplifie',
    description:
      'Recevez vos commissions directement sur votre compte. Processus de paiement rapide et securise.',
    color: '#3976BB',
    bgGradient: 'from-[#3976BB]/10 to-[#3976BB]/5',
  },
];

export function LandingFeatures() {
  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Pourquoi choisir{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              LinkMe
            </span>{' '}
            ?
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Notre plateforme vous offre tous les outils necessaires pour
            developper votre activite d&apos;affiliation.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.bgGradient} mb-6`}
              >
                <feature.icon
                  className="h-7 w-7"
                  style={{ color: feature.color }}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[#183559] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#183559]/60 leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative corner */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at top right, ${feature.color}10, transparent 70%)`,
                }}
              />

              {/* Number indicator */}
              <div className="absolute bottom-4 right-4 text-6xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#183559]/50">
            Rejoignez plus de 500 affilies qui nous font deja confiance
          </p>
        </div>
      </div>
    </section>
  );
}
