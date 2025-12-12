'use client';

/**
 * Route: /finance
 * Description: Page d'entrée module Finance - Redirige vers module-inactive si désactivé
 * Status: Module Finance DÉSACTIVÉ (Phase 3+)
 */

import { redirect } from 'next/navigation';

import { featureFlags } from '@verone/utils/feature-flags';

export default function FinancePage() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    redirect('/module-inactive?module=finance');
  }

  // Si activé, rediriger vers la sous-page principale
  redirect('/finance/rapprochement');
}
