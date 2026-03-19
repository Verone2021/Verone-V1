'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { Star, ArrowRight, Calculator } from 'lucide-react';

import { AidePageLayout } from '../components/aide-page-layout';
import { AideSection } from '../components/aide-section';
import { AideStep } from '../components/aide-step';

// Constantes de pricing (identiques a PricingModels.tsx)
const LINKME_COMMISSION_RATE = 0.05;
const TVA_RATE = 0.2;

// Valeurs par defaut du simulateur
const DEFAULT_BASE_PRICE = 180;
const DEFAULT_PUBLIC_PRICE = 299;

interface TrafficLightZones {
  green: { min: number; max: number };
  orange: { min: number; max: number };
  red: { min: number; max: number };
  maxMargin: number;
}

function calculateTrafficLightZones(
  basePrice: number,
  publicPrice: number
): TrafficLightZones {
  const linkmeBasePrice = basePrice * (1 + LINKME_COMMISSION_RATE);
  const ceilingPrice = publicPrice * 0.95;
  const maxMargin =
    ((ceilingPrice / (1 + TVA_RATE) - linkmeBasePrice) / linkmeBasePrice) * 100;

  return {
    green: { min: 0, max: Math.max(0, maxMargin / 3) },
    orange: { min: maxMargin / 3, max: (maxMargin * 2) / 3 },
    red: { min: (maxMargin * 2) / 3, max: Math.max(0, maxMargin) },
    maxMargin: Math.max(0, Math.round(maxMargin)),
  };
}

function calculatePricing(basePrice: number, marginRate: number) {
  const sellingPriceHT = basePrice * (1 + marginRate / 100);
  const linkmeCommission = sellingPriceHT * LINKME_COMMISSION_RATE;
  const finalPriceTTC = (sellingPriceHT + linkmeCommission) * (1 + TVA_RATE);
  const affiliateGain = sellingPriceHT - basePrice;

  return {
    sellingPriceHT: Math.round(sellingPriceHT * 100) / 100,
    linkmeCommission: Math.round(linkmeCommission * 100) / 100,
    finalPriceTTC: Math.round(finalPriceTTC * 100) / 100,
    affiliateGain: Math.round(affiliateGain * 100) / 100,
  };
}

function getMarginZone(
  margin: number,
  zones: TrafficLightZones
): 'green' | 'orange' | 'red' {
  if (margin <= zones.green.max) return 'green';
  if (margin <= zones.orange.max) return 'orange';
  return 'red';
}

const ZONE_INFO = {
  green: {
    label: 'Competitif',
    description: 'Prix attractif, ventes optimales',
    dotClass: 'bg-green-400',
  },
  orange: {
    label: 'Equilibre',
    description: 'Bon compromis marge/volume',
    dotClass: 'bg-orange-400',
  },
  red: {
    label: 'Eleve',
    description: 'Marge elevee, volume reduit',
    dotClass: 'bg-red-400',
  },
} as const;

export default function AideSelectionsPage(): JSX.Element {
  const [basePrice, setBasePrice] = useState(DEFAULT_BASE_PRICE);
  const [publicPrice, setPublicPrice] = useState(DEFAULT_PUBLIC_PRICE);
  const [margin, setMargin] = useState(15);

  const zones = useMemo(
    () => calculateTrafficLightZones(basePrice, publicPrice),
    [basePrice, publicPrice]
  );

  const pricing = useMemo(
    () => calculatePricing(basePrice, Math.min(margin, zones.maxMargin)),
    [basePrice, margin, zones.maxMargin]
  );

  const currentZone = getMarginZone(Math.min(margin, zones.maxMargin), zones);

  // Clamp margin when zones change
  const effectiveMargin = Math.min(margin, zones.maxMargin);

  return (
    <AidePageLayout
      title="Selections"
      icon={Star}
      iconColor="bg-amber-100 text-amber-600"
    >
      <AideSection title="Qu'est-ce qu'une selection ?">
        <p>
          Une selection est votre vitrine personnalisee. C&apos;est une page web
          que vous partagez avec vos clients, contenant les produits que vous
          avez choisis dans le catalogue Verone.
        </p>
        <p>
          Chaque selection a son propre lien de partage, ses propres marges, et
          peut etre en mode brouillon (visible par vous seul) ou publiee
          (accessible via le lien).
        </p>
      </AideSection>

      <AideSection title="Creer une selection">
        <div className="space-y-5">
          <AideStep
            number={1}
            title="Nouvelle selection"
            description="Depuis Mes Selections, cliquez sur 'Nouvelle selection'. Choisissez un nom parlant pour vous y retrouver (ex: 'Collection Printemps 2026')."
          />
          <AideStep
            number={2}
            title="Ajouter des produits"
            description="Rendez-vous dans le Catalogue et ajoutez des produits a votre selection. Vous pouvez filtrer par categorie, prix ou nouveaute."
          />
          <AideStep
            number={3}
            title="Configurer les marges"
            description="Definissez votre taux de marque en pourcentage. Le prix client est calcule automatiquement. Plus votre taux est eleve, plus votre commission par vente est importante."
          />
          <AideStep
            number={4}
            title="Publier et partager"
            description="Passez la selection en mode 'Publiee' puis copiez le lien de partage. Envoyez-le par email, SMS ou reseaux sociaux a vos clients."
          />
        </div>
      </AideSection>

      <AideSection title="Visibilite : Brouillon vs Publiee">
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">Brouillon</p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Visible uniquement par vous</li>
                <li>Le lien de partage ne fonctionne pas</li>
                <li>Ideal pour preparer votre selection</li>
              </ul>
            </div>
            <div className="p-4">
              <p className="font-medium text-linkme-marine mb-2">Publiee</p>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>Accessible via le lien de partage</li>
                <li>Vos clients peuvent consulter les produits</li>
                <li>Vous pouvez la repasser en brouillon a tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </AideSection>

      {/* Simulateur de prix interactif */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-linkme-turquoise/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-linkme-turquoise" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-linkme-marine">
              Simulateur de prix
            </h2>
            <p className="text-sm text-gray-500">
              Testez avec vos propres valeurs
            </p>
          </div>
        </div>

        {/* Champs editables */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="basePrice"
              className="block text-sm text-gray-500 mb-1"
            >
              Prix base Verone (HT)
            </label>
            <div className="relative">
              <input
                id="basePrice"
                type="number"
                min={1}
                value={basePrice}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val > 0) setBasePrice(val);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-12 text-sm font-medium text-linkme-marine focus:outline-none focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                EUR
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor="publicPrice"
              className="block text-sm text-gray-500 mb-1"
            >
              Prix public (TTC)
            </label>
            <div className="relative">
              <input
                id="publicPrice"
                type="number"
                min={1}
                value={publicPrice}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val > 0) setPublicPrice(val);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-12 text-sm font-medium text-linkme-marine focus:outline-none focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                EUR
              </span>
            </div>
          </div>
        </div>

        {/* Slider marge */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-linkme-marine">
              Votre marge
            </span>
            <span className="text-lg font-bold text-linkme-marine">
              {effectiveMargin}%
            </span>
          </div>

          {/* Barre tricolore */}
          {zones.maxMargin > 0 ? (
            <>
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
                {/* Thumb indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-linkme-marine rounded-full shadow-md transition-all"
                  style={{
                    left: `calc(${(effectiveMargin / zones.maxMargin) * 100}% - 8px)`,
                  }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={zones.maxMargin}
                value={effectiveMargin}
                onChange={e => setMargin(Number(e.target.value))}
                className="w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-transparent"
              />

              {/* Zone indicator */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-3 h-3 rounded-full ${ZONE_INFO[currentZone].dotClass}`}
                />
                <span className="text-sm font-medium text-linkme-marine">
                  {ZONE_INFO[currentZone].label}
                </span>
                <span className="text-sm text-gray-500">
                  — {ZONE_INFO[currentZone].description}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500">
              Le prix public est trop proche du prix de base pour calculer des
              zones de marge.
            </p>
          )}
        </div>

        {/* Resultats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Prix de vente HT</span>
            <span className="font-medium text-linkme-marine">
              {pricing.sellingPriceHT.toFixed(2)} EUR
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Prix client TTC</span>
            <span className="font-bold text-linkme-marine">
              {pricing.finalPriceTTC.toFixed(2)} EUR
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-linkme-turquoise/10 rounded-lg px-3">
            <span className="text-sm font-medium text-linkme-turquoise">
              Votre gain
            </span>
            <span className="text-lg font-bold text-linkme-turquoise">
              +{pricing.affiliateGain.toFixed(2)} EUR
            </span>
          </div>
        </div>
      </div>

      {/* Explication feux tricolore */}
      <AideSection title="Le systeme feux tricolore">
        <p>
          Quand vous definissez votre taux de marque sur un produit, un
          indicateur colore vous guide :
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">
                Vert — Competitif
              </p>
              <p className="text-sm text-gray-500">
                Prix attractif qui favorise les ventes rapides.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
            <div className="w-3 h-3 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">
                Orange — Equilibre
              </p>
              <p className="text-sm text-gray-500">
                Bon compromis entre marge et volume de ventes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
            <div className="w-3 h-3 rounded-full bg-red-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-linkme-marine">Rouge — Eleve</p>
              <p className="text-sm text-gray-500">
                Votre prix se rapproche du prix public. Risque de moins vendre.
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Les zones sont calculees automatiquement pour chaque produit en
          fonction de son prix public. Ce n&apos;est pas bloquant : vous restez
          libre de fixer le taux de marque que vous souhaitez.
        </p>
      </AideSection>

      {/* Message cle : clients toujours gagnants */}
      <div className="bg-gradient-to-br from-linkme-marine/5 to-linkme-turquoise/10 rounded-xl border border-linkme-turquoise/20 p-6">
        <h3 className="text-base font-semibold text-linkme-marine mb-2">
          Pourquoi vos clients sont toujours gagnants
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Tous les produits sur LinkMe ont un prix de vente encadre par le prix
          public du produit. Meme avec votre taux de marque, le prix propose a
          vos clients reste toujours plus interessant que le prix public.
          C&apos;est ce qui rend LinkMe concurrentiel : vos clients beneficient
          de tarifs avantageux, et vous gagnez une commission sur chaque vente.
        </p>
      </div>

      <AideSection title="Conseils">
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Commencez avec 10-20 produits cibles plutot qu&apos;un catalogue
              entier. Une selection ciblee convertit mieux.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Utilisez des marges coherentes par gamme de prix. Ex: 15% sur le
              mobilier, 20% sur les accessoires.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-linkme-turquoise font-bold">•</span>
            <span>
              Creez plusieurs selections thematiques (par style, par piece, par
              budget) pour cibler differents profils clients.
            </span>
          </li>
        </ul>
      </AideSection>

      <div className="text-center">
        <Link
          href="/ma-selection"
          className="inline-flex items-center gap-2 px-6 py-3 bg-linkme-turquoise text-white rounded-lg hover:bg-linkme-turquoise/90 transition-colors text-sm font-medium"
        >
          Gerer mes selections
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AidePageLayout>
  );
}
