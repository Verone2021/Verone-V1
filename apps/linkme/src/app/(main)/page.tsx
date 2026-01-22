'use client';

/**
 * Page d'accueil LinkMe
 *
 * Affiche la landing page complete accessible aux visiteurs et utilisateurs connectés.
 * Header conditionnel : "Se connecter" pour visiteurs, "Mon Espace" pour connectés.
 *
 * @module HomePage
 * @since 2026-01-07
 */

import { Loader2 } from 'lucide-react';

import {
  LandingHeader,
  LandingHero,
  LandingFeatures,
  LandingHowItWorks,
  LandingPricingModels,
  LandingMarketplace,
  LandingCTA,
  LandingFooter,
} from '@/components/landing';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage(): JSX.Element {
  const { initializing } = useAuth();

  // Loader pendant l'initialisation
  if (initializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  // Afficher la landing page (accessible aux connectés et non-connectés)
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricingModels />
        <LandingMarketplace />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
