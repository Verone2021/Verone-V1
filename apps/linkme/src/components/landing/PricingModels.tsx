'use client';

/**
 * Landing Page - Section "Modeles de Pricing"
 *
 * Explique la transparence du modele de marge LinkMe:
 * - Taux de marque (pas taux de marge)
 * - Exemples concrets avec 3 scenarios
 * - Calculateur interactif simple
 *
 * @module LandingPricingModels
 * @since 2026-01-21
 */

import { useState, useMemo } from 'react';

import { Calculator, Info, CheckCircle2 } from 'lucide-react';

const EXAMPLES = [
  {
    marginRate: 10,
    basePrice: 100,
    label: 'Marge competitive',
    color: 'green',
  },
  {
    marginRate: 15,
    basePrice: 100,
    label: 'Marge equilibree',
    color: 'blue',
  },
  {
    marginRate: 20,
    basePrice: 100,
    label: 'Marge premium',
    color: 'purple',
  },
];

// Calcul avec taux de marque (SSOT)
function calculateSellingPrice(basePrice: number, marginRate: number): number {
  if (marginRate >= 100) return basePrice * 10; // Protection
  return basePrice / (1 - marginRate / 100);
}

function calculateGain(basePrice: number, marginRate: number): number {
  const sellingPrice = calculateSellingPrice(basePrice, marginRate);
  return sellingPrice - basePrice;
}

export function LandingPricingModels() {
  const [selectedMargin, setSelectedMargin] = useState(15);
  const [basePrice] = useState(100);

  const calculation = useMemo(() => {
    const sellingPrice = calculateSellingPrice(basePrice, selectedMargin);
    const gain = calculateGain(basePrice, selectedMargin);
    const platformFee = sellingPrice * 0.05; // 5% commission plateforme
    const finalPrice = sellingPrice + platformFee;

    return {
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      gain: Math.round(gain * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }, [basePrice, selectedMargin]);

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Transparence{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              totale
            </span>{' '}
            sur vos gains
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Vous controlez vos marges, nous facturons 5% de commission plateforme.
            C&apos;est aussi simple que ca.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Explanation */}
          <div className="space-y-8">
            {/* How it works */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-[#183559] mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#5DBEBB]" />
                Comment ca fonctionne
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[#183559]/70">
                    <strong className="text-[#183559]">Prix de base</strong> : Le prix catalogue Verone
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[#183559]/70">
                    <strong className="text-[#183559]">Votre marge</strong> : Vous choisissez librement (ex: 15%)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[#183559]/70">
                    <strong className="text-[#183559]">Commission LinkMe</strong> : 5% fixes sur le prix de vente
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[#183559]/70">
                    <strong className="text-[#183559]">Votre gain</strong> : La difference entre prix de vente et prix de base
                  </span>
                </li>
              </ul>
            </div>

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#183559]">
                Exemples concrets (base 100€)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {EXAMPLES.map((ex) => {
                  const selling = calculateSellingPrice(ex.basePrice, ex.marginRate);
                  const gain = calculateGain(ex.basePrice, ex.marginRate);
                  return (
                    <button
                      key={ex.marginRate}
                      onClick={() => setSelectedMargin(ex.marginRate)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedMargin === ex.marginRate
                          ? 'border-[#5DBEBB] bg-[#5DBEBB]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="text-2xl font-bold text-[#183559]">
                        {ex.marginRate}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{ex.label}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          Vente: <span className="font-semibold">{selling.toFixed(0)}€</span>
                        </p>
                        <p className="text-sm text-green-600 font-semibold">
                          Gain: +{gain.toFixed(2)}€
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Interactive Calculator */}
          <div className="bg-gradient-to-br from-[#183559] to-[#1e4a7a] rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Calculateur de gains</h3>
                <p className="text-white/60 text-sm">Simulez vos revenus</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">Votre marge</span>
                <span className="text-2xl font-bold">{selectedMargin}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={selectedMargin}
                onChange={(e) => setSelectedMargin(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#5DBEBB]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>5%</span>
                <span>40%</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70">Prix de base</span>
                <span className="font-semibold">{basePrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70">Prix de vente affilie</span>
                <span className="font-semibold">{calculation.sellingPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70">Commission LinkMe (5%)</span>
                <span className="font-semibold">+{calculation.platformFee.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70">Prix client final</span>
                <span className="font-semibold">{calculation.finalPrice.toFixed(2)} € HT</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-white/10 rounded-xl px-4 -mx-4">
                <span className="font-semibold">Votre gain</span>
                <span className="text-2xl font-bold text-[#5DBEBB]">
                  +{calculation.gain.toFixed(2)} €
                </span>
              </div>
            </div>

            <p className="text-xs text-white/40 mt-6 text-center">
              * Calcul base sur le taux de marque. Prix HT.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
