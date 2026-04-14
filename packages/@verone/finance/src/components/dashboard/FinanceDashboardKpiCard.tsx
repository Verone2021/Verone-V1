'use client';

import { cn } from '@verone/utils';

import { formatCurrency } from './finance-dashboard-utils';

interface IKpiSideCardProps {
  label: string;
  value: number;
  color: 'green' | 'rose' | 'red';
  subtitle?: string;
}

export function KpiSideCard({
  label,
  value,
  color,
  subtitle,
}: IKpiSideCardProps): React.ReactNode {
  const colorMap = {
    green: 'border-l-green-500 bg-green-50',
    rose: 'border-l-rose-400 bg-rose-50',
    red: 'border-l-red-500 bg-red-50',
  };
  const textColor = {
    green: 'text-green-700',
    rose: 'text-rose-700',
    red: 'text-red-700',
  };

  return (
    <div className={cn('rounded-lg border border-l-4 p-3', colorMap[color])}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn('text-lg font-bold', textColor[color])}>
        {formatCurrency(value)}
      </p>
      {subtitle && (
        <p className="text-[10px] text-amber-600 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
