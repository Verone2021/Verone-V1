'use client';

import type { ShoppingCart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const VARIANT_STYLES = {
  turquoise: {
    border: 'border-l-[#5DBEBB]',
    iconBg: 'bg-[#5DBEBB]/10',
    iconColor: 'text-[#5DBEBB]',
    valueColor: 'text-[#5DBEBB]',
  },
  green: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-600',
  },
  blue: {
    border: 'border-l-[#3976BB]',
    iconBg: 'bg-[#3976BB]/10',
    iconColor: 'text-[#3976BB]',
    valueColor: 'text-[#3976BB]',
  },
  orange: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-600',
  },
} as const;

/**
 * KPI Card générique pour le collaborateur (valeur texte, pas uniquement monétaire)
 */
export function DashboardCollaborateurKPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant,
  isLoading = false,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: typeof ShoppingCart;
  variant: 'turquoise' | 'green' | 'blue' | 'orange';
  isLoading?: boolean;
}): JSX.Element {
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
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg}`}
        >
          <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${styles.valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
