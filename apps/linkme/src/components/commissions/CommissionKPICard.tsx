/**
 * CommissionKPICard
 * Card KPI avec effet glassmorphism pour la page commissions
 *
 * @module CommissionKPICard
 * @since 2025-12-10
 */

'use client';

import type { LucideIcon } from 'lucide-react';

import { formatCurrency } from '../../types/analytics';

interface CommissionKPICardProps {
  title: string;
  amount: number;
  count?: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  bgGradient: string;
  isLoading?: boolean;
}

export function CommissionKPICard({
  title,
  amount,
  count,
  subtitle,
  icon: Icon,
  iconColor,
  bgGradient,
  isLoading,
}: CommissionKPICardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br ${bgGradient}
        backdrop-blur-sm border border-white/20
        p-4 shadow-sm
        transition-all duration-300
        hover:shadow-md hover:scale-[1.02]
        group
      `}
    >
      {/* Background decorative circle */}
      <div
        className={`
          absolute -right-4 -top-4
          w-20 h-20 rounded-full
          bg-white/10
          transition-transform duration-500
          group-hover:scale-125
        `}
      />

      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">{title}</span>
          <div className={`p-1.5 rounded-lg bg-white/50 ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Amount */}
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {formatCurrency(amount)}
        </p>

        {/* Subtitle & count */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {count !== undefined && (
            <span className="font-medium">{count} commissions</span>
          )}
          {subtitle && (
            <>
              {count !== undefined && <span>-</span>}
              <span>{subtitle}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommissionKPICard;
