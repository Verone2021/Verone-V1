'use client';

/**
 * PageTourTrigger - Composant générique pour déclencher un tour sur une page
 *
 * - Auto-start à la première visite (si pas encore vu)
 * - Pas de bouton replay (seul le tour Bienvenue a un bouton flottant)
 *
 * @module PageTourTrigger
 * @since 2026-02-26
 */

import { useProductTour } from '../../lib/hooks/use-product-tour';
import { type TourId } from '../../lib/tour-steps';

interface PageTourTriggerProps {
  tourId: TourId;
  /** Délai avant auto-start en ms (défaut: 800) */
  delay?: number;
}

export function PageTourTrigger({
  tourId,
  delay = 800,
}: PageTourTriggerProps): null {
  useProductTour({
    tourId,
    autoStart: true,
    autoStartDelay: delay,
  });

  return null;
}
