'use client';

/**
 * Landing Page - Section "Comment ca marche"
 *
 * Presente les 4 etapes pour devenir affilie LinkMe:
 * 1. Creer sa selection
 * 2. Configurer ses marges
 * 3. Partager et vendre
 * 4. Suivre ses gains
 *
 * @module LandingHowItWorks
 * @since 2026-01-21
 */

import { Package, Sliders, Share2, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    step: 1,
    icon: Package,
    title: 'Creez votre selection',
    description:
      'Choisissez des produits depuis notre catalogue de mobilier et decoration haut de gamme, ou ajoutez vos propres produits.',
    color: '#5DBEBB',
  },
  {
    step: 2,
    icon: Sliders,
    title: 'Configurez vos marges',
    description:
      'Definissez librement vos marges produit par produit selon votre strategie commerciale. Notre jauge tricolore vous guide.',
    color: '#7E84C0',
  },
  {
    step: 3,
    icon: Share2,
    title: 'Partagez et vendez',
    description:
      'Diffusez vos liens personnalises aupres de vos clients et commencez a generer des ventes sans gestion de stock.',
    color: '#3976BB',
  },
  {
    step: 4,
    icon: TrendingUp,
    title: 'Suivez vos gains',
    description:
      'Dashboard en temps reel pour suivre vos commissions, analyser vos performances et optimiser votre strategie.',
    color: '#5DBEBB',
  },
];

export function LandingHowItWorks() {
  return (
    <section id="etapes" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Comment ca{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              marche
            </span>{' '}
            ?
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Devenez affilie LinkMe en 4 etapes simples et commencez a generer
            des revenus complementaires.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="relative group"
            >
              {/* Connector line (hidden on mobile, shown on lg) */}
              {item.step < 4 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-gray-100" />
              )}

              {/* Card */}
              <div className="relative bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
                {/* Step number */}
                <div
                  className="absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: item.color }}
                >
                  {item.step}
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mt-4 mb-4"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon
                    className="h-7 w-7"
                    style={{ color: item.color }}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[#183559] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#183559]/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-lg"
          >
            Commencer maintenant
            <TrendingUp className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
