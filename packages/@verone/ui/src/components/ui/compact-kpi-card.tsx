'use client';

import type { LucideIcon } from 'lucide-react';

import { colors } from '../../tokens/colors';

export interface CompactKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'accent' | 'danger';
  sparklineData?: number[];
  onClick?: () => void;
}

export function CompactKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  sparklineData,
  onClick,
}: CompactKpiCardProps) {
  const colorMap = {
    primary: colors.primary.DEFAULT,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    accent: colors.accent.DEFAULT,
    danger: colors.danger.DEFAULT,
  };

  const bgColorMap = {
    primary: colors.primary[50],
    success: colors.success[50],
    warning: colors.warning[50],
    accent: colors.accent[50],
    danger: colors.danger[50],
  };

  const iconColor = colorMap[color];
  const bgColor = bgColorMap[color];

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2
        bg-white rounded-lg border border-gray-100
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-sm hover:border-gray-200' : ''}
      `}
    >
      {/* Icône */}
      <div
        className="flex items-center justify-center rounded-md"
        style={{
          width: '28px',
          height: '28px',
          backgroundColor: bgColor,
        }}
      >
        <Icon size={14} style={{ color: iconColor }} />
      </div>

      {/* Contenu */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-900 leading-tight">
          {value}
        </div>
        <div className="text-[10px] text-slate-600 leading-tight truncate">
          {label}
        </div>
      </div>

      {/* Trend badge */}
      {trend && (
        <div
          className={`
            text-[10px] font-medium px-1.5 py-0.5 rounded
            ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
          `}
        >
          {trend.isPositive ? '+' : ''}
          {trend.value}%
        </div>
      )}

      {/* Mini sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <svg width="40" height="20" className="flex-shrink-0">
          <MiniSparkline data={sparklineData} color={iconColor} />
        </svg>
      )}
    </div>
  );
}

// Mini sparkline component interne
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 40;
  const height = 20;
  const padding = 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
