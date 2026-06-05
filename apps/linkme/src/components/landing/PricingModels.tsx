'use client';

/**
 * Landing Page Pricing Section - LinkMe
 *
 * Simulateur de marge interactif :
 * - Slider marge en temps réel (0% → marge max du produit)
 * - Affiche le prix de vente HT et le gain estimé ambassadeur
 * - Système de feux tricolores (vert/orange/rouge) pour guider
 * - N'expose PAS le taux de commission interne ni la décomposition TTC
 *
 * @module LandingPricing
 * @since 2026-01-23
 * @updated 2026-06-05 - LINKME-SIMU-001 : simulateur dynamique, sans
 *                       exposition de la commission interne ni du TTC.
 */

import { useState, useMemo } from 'react';

import { Calculator, Info, CheckCircle2 } from 'lucide-react';

// Usage INTERNE uniquement (calcul du plafond de marge) — jamais affiché.
const PLATFORM_FEE_RATE = 0.05;
const TVA_RATE = 0.2;

// Produit d'exemple pour la démo
const EXAMPLE_PRODUCT = {
  name: 'Table basse design',
  basePrice: 180, // Prix base fournisseur HT
  publicPrice: 299, // Prix public TTC (référence marché)
};

interface IPricingResult {
  sellingPriceHT: number;
  affiliateGain: number;
}

interface ITrafficLightZones {
  green: { min: number; max: number };
  orange: { min: number; max: number };
  red: { min: number; max: number };
  maxMargin: number;
}

/**
 * Calcule le prix de vente HT et le gain ambassadeur pour une marge donnée.
 * Aucune décomposition interne (commission, TTC) n'est exposée.
 */
function calculatePricing(
  basePrice: number,
  marginRate: number
): IPricingResult {
  const sellingPriceHT = basePrice * (1 + marginRate / 100);
  const affiliateGain = sellingPriceHT - basePrice;

  return {
    sellingPriceHT: Math.round(sellingPriceHT * 100) / 100,
    affiliateGain: Math.round(affiliateGain * 100) / 100,
  };
}

/**
 * Calcule les zones du feu tricolore (plafond = 95% du prix public).
 */
function calculateTrafficLightZones(
  basePrice: number,
  publicPrice: number
): ITrafficLightZones {
  const internalBasePrice = basePrice * (1 + PLATFORM_FEE_RATE);
  const ceilingPrice = publicPrice * 0.95;
  const maxMargin =
    ((ceilingPrice / (1 + TVA_RATE) - internalBasePrice) / internalBasePrice) *
    100;

  return {
    green: { min: 0, max: Math.max(0, maxMargin / 3) },
    orange: { min: maxMargin / 3, max: (maxMargin * 2) / 3 },
    red: { min: (maxMargin * 2) / 3, max: Math.max(0, maxMargin) },
    maxMargin: Math.max(0, Math.round(maxMargin)),
  };
}

/**
 * Détermine la zone de couleur pour une marge donnée.
 */
function getMarginZone(
  margin: number,
  zones: ITrafficLightZones
): 'green' | 'orange' | 'red' {
  if (margin <= zones.green.max) return 'green';
  if (margin <= zones.orange.max) return 'orange';
  return 'red';
}

const ZONE_LABELS = {
  green: {
    label: 'Compétitif',
    description: 'Prix attractif, ventes optimales',
  },
  orange: { label: 'Équilibré', description: 'Bon compromis marge / volume' },
  red: { label: 'Élevé', description: 'Marge maximale, volume réduit' },
};

export function LandingPricing(): JSX.Element {
  const [margin, setMargin] = useState(15);

  const zones = useMemo(
    () =>
      calculateTrafficLightZones(
        EXAMPLE_PRODUCT.basePrice,
        EXAMPLE_PRODUCT.publicPrice
      ),
    []
  );

  const pricing = useMemo(
    () => calculatePricing(EXAMPLE_PRODUCT.basePrice, margin),
    [margin]
  );

  const currentZone = getMarginZone(margin, zones);

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#7E84C0]/10 rounded-full text-sm font-medium text-[#7E84C0] mb-4">
            Simulateur de marge
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Tu décides de{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              ta marge
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Bouge le curseur : ton prix de vente et ton gain se mettent à jour
            en direct. Le feu tricolore te guide, mais c&apos;est toi qui
            décides.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Interactive pricing calculator */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#5DBEBB]/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-[#5DBEBB]" />
              </div>
              <div>
                <h3 className="font-bold text-[#183559]">Simulateur de prix</h3>
                <p className="text-sm text-[#183559]/60">
                  Exemple : {EXAMPLE_PRODUCT.name}
                </p>
              </div>
            </div>

            {/* Base price info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#183559]/70">
                  Prix base fournisseur (HT)
                </span>
                <span className="font-bold text-[#183559]">
                  {EXAMPLE_PRODUCT.basePrice} EUR
                </span>
              </div>
            </div>

            {/* Margin slider with traffic light */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#183559]">
                  Ta marge
                </span>
                <span className="text-lg font-bold text-[#183559]">
                  {margin.toFixed(2)}%
                </span>
              </div>

              {/* Traffic light bar */}
              <div className="relative h-3 rounded-full overflow-hidden mb-2">
                <div className="absolute inset-0 flex">
                  <div
                    className="bg-green-400"
                    style={{
                      width: `${(zones.green.max / zones.maxMargin) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-orange-400"
                    style={{
                      width: `${((zones.orange.max - zones.green.max) / zones.maxMargin) * 100}%`,
                    }}
                  />
                  <div className="bg-red-400 flex-1" />
                </div>
                {/* Slider thumb indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#183559] rounded-full shadow-md transition-all"
                  style={{
                    left: `calc(${(margin / zones.maxMargin) * 100}% - 8px)`,
                  }}
                />
              </div>

              {/* Slider input */}
              <input
                type="range"
                min={0}
                max={zones.maxMargin}
                step={0.01}
                value={margin}
                aria-label="Choisis ta marge"
                onChange={e =>
                  setMargin(Math.round(Number(e.target.value) * 100) / 100)
                }
                className="w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-transparent"
              />

              {/* Zone indicator */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    currentZone === 'green'
                      ? 'bg-green-400'
                      : currentZone === 'orange'
                        ? 'bg-orange-400'
                        : 'bg-red-400'
                  }`}
                />
                <span className="text-sm font-medium text-[#183559]">
                  {ZONE_LABELS[currentZone].label}
                </span>
                <span className="text-sm text-[#183559]/60">
                  - {ZONE_LABELS[currentZone].description}
                </span>
              </div>
            </div>

            {/* Results — uniquement prix de vente HT + gain ambassadeur */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-[#183559]/70">
                  Ton prix de vente HT
                </span>
                <span className="font-medium text-[#183559]">
                  {pricing.sellingPriceHT.toFixed(2)} EUR
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-[#5DBEBB]/10 rounded-lg px-3">
                <span className="text-sm font-medium text-[#5DBEBB]">
                  Ton gain estimé
                </span>
                <span className="text-lg font-bold text-[#5DBEBB]">
                  +{pricing.affiliateGain.toFixed(2)} EUR
                </span>
              </div>
            </div>
          </div>

          {/* Right: Traffic light explanation */}
          <div className="space-y-6">
            {/* What is the traffic light */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <Info className="h-5 w-5 text-[#7E84C0] mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#183559]">
                    Le système feux tricolores
                  </h3>
                  <p className="text-sm text-[#183559]/60 mt-1">
                    Un repère visuel pour t&apos;aider à choisir ta marge. Ce
                    n&apos;est pas bloquant : tu décides.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Green zone */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="w-4 h-4 rounded-full bg-green-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800">Compétitif</div>
                    <div className="text-sm text-green-700/70">
                      0% - {Math.round(zones.green.max)}% de marge
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Prix attractif qui favorise les ventes rapides
                    </div>
                  </div>
                </div>

                {/* Orange zone */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="w-4 h-4 rounded-full bg-orange-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800">Équilibré</div>
                    <div className="text-sm text-orange-700/70">
                      {Math.round(zones.green.max)}% -{' '}
                      {Math.round(zones.orange.max)}% de marge
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Bon compromis entre marge et volume de ventes
                    </div>
                  </div>
                </div>

                {/* Red zone */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="w-4 h-4 rounded-full bg-red-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-800">Élevé</div>
                    <div className="text-sm text-red-700/70">
                      {Math.round(zones.orange.max)}% - {zones.maxMargin}% de
                      marge
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Marge maximale, peut réduire le volume de ventes
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits list */}
            <div className="bg-gradient-to-br from-[#183559] to-[#3976BB] rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4">
                Pourquoi notre modèle est différent
              </h3>
              <ul className="space-y-3">
                {[
                  'Ton gain affiché en temps réel sur chaque produit',
                  'Liberté totale sur ta marge',
                  "Pas de frais cachés ni d'abonnement",
                  'Suivi transparent en temps réel',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#5DBEBB] shrink-0" />
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
