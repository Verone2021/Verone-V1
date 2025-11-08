'use client';

import { colors } from '../../design-system/tokens/colors';

export interface StatPillProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export function StatPill({
  label,
  value,
  variant = 'neutral',
  size = 'sm',
}: StatPillProps) {
  const variantStyles = {
    primary: {
      bg: colors.primary[50],
      text: colors.primary[700],
      border: colors.primary[100],
    },
    success: {
      bg: colors.success[50],
      text: colors.success[700],
      border: colors.success[100],
    },
    warning: {
      bg: colors.warning[50],
      text: colors.warning[700],
      border: colors.warning[100],
    },
    danger: {
      bg: colors.danger[50],
      text: colors.danger[700],
      border: colors.danger[100],
    },
    neutral: {
      bg: colors.neutral[50],
      text: colors.neutral[700],
      border: colors.neutral[100],
    },
  };

  const style = variantStyles[variant];
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-medium
        ${sizeClasses}
      `}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderWidth: '1px',
        borderColor: style.border,
      }}
    >
      <span className="font-semibold">{value}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}
