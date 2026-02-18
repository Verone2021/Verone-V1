'use client';

/**
 * Route: /finance/tresorerie
 * Description: Dashboard Trésorerie - Soldes comptes Qonto, KPIs, prévisions
 */

import { redirect } from 'next/navigation';

import { TreasuryDashboard } from '@verone/finance/components';
import { featureFlags } from '@verone/utils/feature-flags';

export default function TresoreriePage() {
  if (!featureFlags.financeEnabled) {
    redirect('/module-inactive?module=finance');
  }

  return <TreasuryDashboard />;
}
