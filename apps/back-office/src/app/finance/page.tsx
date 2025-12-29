'use client';

/**
 * Route: /finance
 * Description: Dashboard Finance - Vue d'ensemble trésorerie et dépenses
 * Design: Haute qualité inspiré Qonto/Pennylane/Stripe
 */

import { redirect } from 'next/navigation';

import { FinanceDashboard } from '@verone/finance/components';
import { featureFlags } from '@verone/utils/feature-flags';

export default function FinancePage() {
  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    redirect('/module-inactive?module=finance');
  }

  return <FinanceDashboard />;
}
