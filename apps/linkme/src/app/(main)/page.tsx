'use client';

/**
 * Page d'accueil LinkMe
 *
 * - Non connecte: Affiche la landing page complete (Header, Hero, Features, CTA, Footer)
 * - Connecte: Redirige vers /dashboard
 *
 * @module HomePage
 * @since 2026-01-07
 */

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const { user, initializing } = useAuth();

  // Rediriger vers dashboard si connecte
  useEffect(() => {
    if (!initializing && user) {
      router.push('/dashboard');
    }
  }, [user, initializing, router]);

  // Loader pendant l'initialisation
  if (initializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  // Si connecte, afficher un loader pendant la redirection
  if (user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#5DBEBB]" />
      </div>
    );
  }

  // Non connecte: Afficher la landing page
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
