'use client';

/**
 * CommissionKPICard - Composant KPI épuré pour le dashboard LinkMe
 *
 * Design minimaliste :
 * - Card blanche avec bordure colorée à gauche
 * - Icône + label
 * - Montant TTC en gros
 * - Sous-texte "{count} commission(s)"
 *
 * @module CommissionKPICard
 * @since 2026-01-07
 */

import { type LucideIcon, Loader2 } from 'lucide-react';

import { formatCurrency } from '../../types/analytics';

export type CommissionKPIVariant = 'turquoise' | 'green' | 'blue' | 'orange';

export interface CommissionKPICardProps {
  label: string;
  amount: number;
  count: number;
  variant: CommissionKPIVariant;
  icon: LucideIcon;
  isLoading?: boolean;
}

const VARIANT_STYLES: Record<
  CommissionKPIVariant,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    amountColor: string;
  }
> = {
  turquoise: {
    border: 'border-l-[#5DBEBB]',
    iconBg: 'bg-[#5DBEBB]/10',
    iconColor: 'text-[#5DBEBB]',
    amountColor: 'text-[#5DBEBB]',
  },
  green: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    amountColor: 'text-emerald-600',
  },
  blue: {
    border: 'border-l-[#3976BB]',
    iconBg: 'bg-[#3976BB]/10',
    iconColor: 'text-[#3976BB]',
    amountColor: 'text-[#3976BB]',
  },
  orange: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    amountColor: 'text-amber-600',
  },
};

export function CommissionKPICard({
  label,
  amount,
  count,
  variant,
  icon: Icon,
  isLoading = false,
}: CommissionKPICardProps): JSX.Element {
  const styles = VARIANT_STYLES[variant];

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-100 border-l-4 ${styles.border} p-4 shadow-sm`}
      >
        <div className="flex items-center justify-center h-[72px]">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-100 border-l-4 ${styles.border} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>

      {/* Amount */}
      <p className={`text-2xl font-bold ${styles.amountColor}`}>
        {formatCurrency(amount)}
      </p>

      {/* Count */}
      <p className="text-xs text-gray-500 mt-1">
        {count} commission{count > 1 ? 's' : ''}
      </p>
    </div>
  );
}
