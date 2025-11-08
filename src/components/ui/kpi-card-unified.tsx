'use client';

import React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

import { cn } from '@verone/utils';

/**
 * KPICardUnified - Composant KPI Card générique unifié Design System V2
 *
 * Architecture 2025 : CVA + Tailwind CSS
 * Remplace : CompactKpiCard, ElegantKpiCard, MediumKpiCard
 *
 * Fonctionnalités unifiées :
 * - 3 variants : compact, elegant, detailed
 * - Support trend indicator (positive/negative)
 * - Icône avec background coloré
 * - Description optionnelle
 * - Actions optionnelles (boutons secondaires)
 * - Sparkline optionnel (graphique miniature)
 * - onClick pour interactivité
 *
 * Inspirations : shadcn/ui, Linear dashboard, Stripe dashboard
 *
 * @example
 * ```tsx
 * // KPI Card compact (40px)
 * <KPICardUnified
 *   variant="compact"
 *   title="Produits actifs"
 *   value="1,234"
 *   icon={Package}
 *   trend={{ value: 12, isPositive: true }}
 * />
 *
 * // KPI Card elegant (96px, avec description)
 * <KPICardUnified
 *   variant="elegant"
 *   title="Chiffre d'affaires"
 *   value="€45,231"
 *   icon={DollarSign}
 *   description="vs mois dernier"
 *   trend={{ value: 8.5, isPositive: true }}
 * />
 *
 * // KPI Card detailed (avec sparkline et actions)
 * <KPICardUnified
 *   variant="detailed"
 *   title="Commandes en cours"
 *   value={42}
 *   icon={ShoppingCart}
 *   sparklineData={[12, 15, 18, 14, 20, 22, 25]}
 *   actions={<Button size="sm">Voir tout</Button>}
 * />
 *
 * // KPI Card cliquable
 * <KPICardUnified
 *   title="Clients"
 *   value="328"
 *   icon={Users}
 *   onClick={() => router.push('/customers')}
 * />
 * ```
 *
 * @see /docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md
 */

const kpiCardVariants = cva(
  // Base styles
  'flex bg-white rounded-lg border border-neutral-200 transition-all duration-200',
  {
    variants: {
      variant: {
        compact:
          'items-center gap-2 px-3 py-2 h-[40px] hover:shadow-sm hover:border-gray-200',
        elegant:
          'flex-col gap-3 p-6 min-h-[96px] hover:border-neutral-300 hover:shadow-md',
        detailed:
          'flex-col gap-3 p-5 min-h-[140px] hover:border-neutral-300 hover:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'compact',
    },
  }
);

export interface KPICardUnifiedProps
  extends VariantProps<typeof kpiCardVariants> {
  /**
   * Titre de la métrique
   */
  title: string;
  /**
   * Valeur affichée (nombre ou string formaté)
   */
  value: string | number;
  /**
   * Icône Lucide
   */
  icon: LucideIcon;
  /**
   * Indicateur de tendance
   */
  trend?: {
    value: number;
    isPositive: boolean;
  } | number; // Accepte aussi juste un nombre (auto-détecte positif/négatif)
  /**
   * Description additionnelle (visible sur elegant/detailed)
   */
  description?: string;
  /**
   * Couleur de l'icône et accents
   * @default 'primary'
   */
  color?: 'primary' | 'success' | 'warning' | 'accent' | 'danger';
  /**
   * Données pour mini sparkline (graphique tendance)
   */
  sparklineData?: number[];
  /**
   * Actions additionnelles (boutons, liens)
   */
  actions?: React.ReactNode;
  /**
   * Callback au clic sur la card
   */
  onClick?: () => void;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

export function KPICardUnified({
  variant = 'compact',
  title,
  value,
  icon: Icon,
  trend: trendProp,
  description,
  color = 'primary',
  sparklineData,
  actions,
  onClick,
  className,
}: KPICardUnifiedProps) {
  // Normaliser trend (accepte nombre simple ou objet)
  const trend =
    typeof trendProp === 'number'
      ? { value: Math.abs(trendProp), isPositive: trendProp >= 0 }
      : trendProp;

  // Color mapping (semantic colors)
  const colorMap = {
    primary: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-600',
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-600',
    },
    warning: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: 'text-orange-600',
    },
    accent: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-600',
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-600',
    },
  };

  const colors = colorMap[color];

  // Icon size selon variant
  const iconSizeMap = {
    compact: 14,
    elegant: 18,
    detailed: 20,
  };
  const iconSize = iconSizeMap[variant || 'compact'];

  // Icon container size selon variant
  const iconContainerSizeMap = {
    compact: 'w-7 h-7',
    elegant: 'w-9 h-9',
    detailed: 'w-10 h-10',
  };
  const iconContainerSize = iconContainerSizeMap[variant || 'compact'];

  return (
    <div
      onClick={onClick}
      className={cn(
        kpiCardVariants({ variant }),
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* COMPACT LAYOUT */}
      {variant === 'compact' && (
        <>
          {/* Icône */}
          <div
            className={cn(
              'flex items-center justify-center rounded-md flex-shrink-0',
              iconContainerSize,
              colors.bg
            )}
          >
            <Icon size={iconSize} className={colors.icon} />
          </div>

          {/* Contenu */}
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {value}
            </div>
            <div className="text-[10px] text-slate-600 leading-tight truncate">
              {title}
            </div>
          </div>

          {/* Trend badge */}
          {trend && (
            <div
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0',
                trend.isPositive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </div>
          )}

          {/* Mini sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <svg width="40" height="20" className="flex-shrink-0">
              <MiniSparkline
                data={sparklineData}
                color={
                  color === 'primary'
                    ? '#3b86d1'
                    : color === 'success'
                      ? '#38ce3c'
                      : '#ff9b3e'
                }
              />
            </svg>
          )}
        </>
      )}

      {/* ELEGANT LAYOUT */}
      {variant === 'elegant' && (
        <>
          {/* Header: Title + Icon */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600">{title}</span>
            <Icon size={iconSize} className="text-neutral-400" strokeWidth={2} />
          </div>

          {/* Value + Trend */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {value}
            </span>

            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
                  trend.isPositive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUp size={12} strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={12} strokeWidth={2.5} />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-neutral-500 leading-tight">
              {description}
            </p>
          )}

          {/* Actions */}
          {actions && <div className="mt-auto">{actions}</div>}
        </>
      )}

      {/* DETAILED LAYOUT */}
      {variant === 'detailed' && (
        <>
          {/* Header: Icon + Title */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg flex-shrink-0',
                iconContainerSize,
                colors.bg
              )}
            >
              <Icon size={iconSize} className={colors.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-600 truncate">
                {title}
              </div>
            </div>
          </div>

          {/* Value + Trend */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">{value}</span>

            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md',
                  trend.isPositive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </div>
            )}
          </div>

          {/* Sparkline graph */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-full h-16 bg-neutral-50 rounded-md p-2">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                <DetailedSparkline
                  data={sparklineData}
                  color={
                    color === 'primary'
                      ? '#3b86d1'
                      : color === 'success'
                        ? '#38ce3c'
                        : '#ff9b3e'
                  }
                />
              </svg>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}

          {/* Actions */}
          {actions && <div className="mt-auto flex gap-2">{actions}</div>}
        </>
      )}
    </div>
  );
}

/**
 * MiniSparkline - Graphique miniature pour variant compact
 */
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

/**
 * DetailedSparkline - Graphique détaillé pour variant detailed
 */
function DetailedSparkline({ data, color }: { data: number[]; color: string }) {
  const padding = 4;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Points pour polyline
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (100 - padding * 2) + padding;
      const y = 100 - padding - ((value - min) / range) * (100 - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Path pour area fill (gradient)
  const areaPath = `${points} ${100 - padding},${100 - padding} ${padding},${100 - padding} Z`;

  return (
    <g>
      {/* Area gradient fill */}
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${areaPath}`}
        fill="url(#sparklineGradient)"
        stroke="none"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/**
 * Export default pour compatibilité
 */
export default KPICardUnified;
