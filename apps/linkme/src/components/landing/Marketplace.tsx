'use client';

/**
 * Landing Page - Section "Vision Marketplace"
 *
 * Presente la vision future de LinkMe:
 * - Les affilies peuvent devenir vendeurs
 * - Marketplace collaborative
 * - Revenus passifs
 *
 * @module LandingMarketplace
 * @since 2026-01-21
 */

import { Store, Users, Sparkles, ArrowRight } from 'lucide-react';

const BENEFITS = [
  {
    icon: Store,
    title: 'Devenez vendeur',
    description:
      'Proposez vos propres produits sur la marketplace LinkMe et touchez une audience qualifiee.',
  },
  {
    icon: Users,
    title: 'Reseau d\'affilies',
    description:
      'D\'autres affilies peuvent revendre vos produits. Vous gagnez sur chaque vente.',
  },
  {
    icon: Sparkles,
    title: 'Revenus passifs',
    description:
      'Une fois vos produits en ligne, generez des revenus sans effort supplementaire.',
  },
];

export function LandingMarketplace() {
  return (
    <section id="marketplace" className="py-16 lg:py-24 bg-gradient-to-br from-[#183559] to-[#1e4a7a] text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5DBEBB] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7E84C0] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <Sparkles className="h-4 w-4 text-[#5DBEBB]" />
              <span>Bientot disponible</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Demain, devenez{' '}
              <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
                vendeur
              </span>{' '}
              sur LinkMe
            </h2>

            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Notre vision : transformer chaque affilie en potentiel fournisseur.
              Proposez vos produits au catalogue general et laissez d&apos;autres affilies
              les vendre pour vous.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-8">
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-[#5DBEBB]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-white/60">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="mailto:contact@linkme.verone.io?subject=Interesse par la marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#183559] font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              Etre informe du lancement
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              {/* Mock marketplace UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Vos produits sur LinkMe</h3>
                  <span className="text-xs bg-[#5DBEBB]/20 text-[#5DBEBB] px-3 py-1 rounded-full">
                    3 produits actifs
                  </span>
                </div>

                {/* Mock product cards */}
                {[
                  { name: 'Chaise design moderne', sales: 24, revenue: '1 240€' },
                  { name: 'Table basse en chene', sales: 18, revenue: '2 160€' },
                  { name: 'Lampe artisanale', sales: 42, revenue: '840€' },
                ].map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-white/50">{product.sales} ventes</p>
                      </div>
                    </div>
                    <span className="text-[#5DBEBB] font-semibold">
                      {product.revenue}
                    </span>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white/60">Revenus totaux</span>
                  <span className="text-2xl font-bold text-[#5DBEBB]">4 240€</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
              +84 affilies revendeurs
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
