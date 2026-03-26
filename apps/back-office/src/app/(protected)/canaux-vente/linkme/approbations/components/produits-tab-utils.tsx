'use client';

import type { AffiliateProductApprovalStatus } from '../../hooks/use-product-approvals';
import { STATUS_BADGE_CONFIG } from './produits-tab-types';

export function getCommissionAmount(payout: number, commission: number) {
  return payout * (commission / 100);
}

export function getAffiliateEarning(payout: number, commission: number) {
  return payout - getCommissionAmount(payout, commission);
}

export function StatusBadge({
  status,
}: {
  status: AffiliateProductApprovalStatus;
}) {
  const config = STATUS_BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
