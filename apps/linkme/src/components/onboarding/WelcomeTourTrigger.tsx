'use client';

/**
 * WelcomeTourTrigger - Déclenche le tour de bienvenue sur le dashboard
 *
 * - Auto-start au premier login (si pas encore vu)
 * - Bouton replay dans le coin inférieur droit
 * - Se cache une fois le tour vu (sauf hover)
 *
 * @module WelcomeTourTrigger
 * @since 2026-02-26
 */

import { Play } from 'lucide-react';

import { useProductTour } from '../../lib/hooks/use-product-tour';
import { TOUR_IDS } from '../../lib/tour-steps';

export function WelcomeTourTrigger(): JSX.Element | null {
  const { startTour, isSeen, isLoading } = useProductTour({
    tourId: TOUR_IDS.WELCOME,
    autoStart: true,
    autoStartDelay: 1500,
  });

  // Ne pas afficher pendant le chargement
  if (isLoading) return null;

  // Bouton replay (visible uniquement si tour déjà vu)
  if (!isSeen) return null;

  return (
    <button
      type="button"
      onClick={startTour}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-lg text-sm font-medium text-gray-600 hover:bg-linkme-turquoise hover:text-white hover:border-linkme-turquoise transition-all group"
      title="Relancer la visite guidée"
    >
      <Play className="h-4 w-4" />
      <span className="hidden group-hover:inline">Visite guidée</span>
    </button>
  );
}
