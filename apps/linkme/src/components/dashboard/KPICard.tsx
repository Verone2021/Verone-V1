'use client';

/**
 * KPICard - Composant de carte KPI pour le dashboard LinkMe
 * Inspiré du Modern Analytics Dashboard (21st.dev)
 *
 * @module KPICard
 * @since 2026-01-07
 */

import Link from 'next/link';

import {
  type LucideIcon,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Types de variantes de couleur - Charte graphique LinkMe uniquement
export type KPICardVariant = 'turquoise' | 'marine';

// Mapping des couleurs - CHARTE GRAPHIQUE LINKME
// Turquoise: #5DBEBB
// Bleu marine: #183559
const variantStyles: Record<
  KPICardVariant,
  { gradient: string; border: string; bgLight: string; text: string }
> = {
  turquoise: {
    gradient: 'from-[#5DBEBB] to-[#4AA8A5]',
    border: 'border-[#5DBEBB]/20',
    bgLight: 'bg-[#5DBEBB]/10',
    text: 'text-[#5DBEBB]',
  },
  marine: {
    gradient: 'from-[#183559] to-[#0F2440]',
    border: 'border-[#183559]/20',
    bgLight: 'bg-[#183559]/10',
    text: 'text-[#183559]',
  },
};

// Sous-valeur à afficher
export interface KPISubValue {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  highlight?: boolean;
}

export interface KPICardProps {
  /** Titre de la carte */
  title: string;
  /** Icône principale */
  icon: LucideIcon;
  /** Variante de couleur */
  variant: KPICardVariant;
  /** Valeur principale (grande) */
  mainValue?: string | number;
  /** Unité de la valeur (€, %, etc.) */
  mainUnit?: string;
  /** Variation en % (optionnel, affiche badge) */
  trend?: number;
  /** Sous-valeurs à afficher en liste */
  subValues?: KPISubValue[];
  /** Label du bouton d'action */
  actionLabel?: string;
  /** Lien du bouton d'action */
  actionHref?: string;
  /** État de chargement */
  isLoading?: boolean;
  /** Afficher en mode compact (sans gradient) */
  compact?: boolean;
}

/**
 * Composant KPICard - Carte de statistique pour dashboard
 */
export function KPICard({
  title,
  icon: Icon,
  variant,
  mainValue,
  mainUnit = '',
  trend,
  subValues = [],
  actionLabel,
  actionHref,
  isLoading = false,
  compact = false,
}: KPICardProps): JSX.Element {
  const styles = variantStyles[variant];

  // Mode gradient (style Modern Analytics)
  if (!compact && mainValue !== undefined) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl shadow-sm',
          `bg-gradient-to-br ${styles.gradient}`
        )}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

        {/* Cercles décoratifs */}
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10"
          viewBox="0 0 300 200"
          fill="none"
        >
          <circle cx="220" cy="100" r="90" fill="white" fillOpacity="0.15" />
          <circle cx="260" cy="60" r="60" fill="white" fillOpacity="0.2" />
          <circle cx="200" cy="160" r="50" fill="white" fillOpacity="0.1" />
        </svg>

        {/* Header */}
        <div className="relative z-10 px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-white/90 text-sm font-medium">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 pb-6 space-y-3">
          {/* Valeur principale + Badge trend */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white tracking-tight">
              {isLoading ? '--' : mainValue}
              {mainUnit && <span className="text-xl ml-1">{mainUnit}</span>}
            </span>
            {trend !== undefined && !isLoading && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
                  'bg-white/20 text-white border-0'
                )}
              >
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Sous-valeurs */}
          {subValues.length > 0 && (
            <div className="space-y-1.5 border-t border-white/20 pt-3">
              {subValues.map((sv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-white/70">
                    {sv.icon && <sv.icon className="h-3.5 w-3.5" />}
                    <span>{sv.label}</span>
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      sv.highlight ? 'text-white font-bold' : 'text-white/90'
                    )}
                  >
                    {sv.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-4 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Mode compact (style liste, fond blanc)
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm overflow-hidden',
        styles.border,
        'border'
      )}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              styles.bgLight
            )}
          >
            <Icon className={cn('h-5 w-5', styles.text)} />
          </div>
          <h3 className="font-semibold text-[#183559]">{title}</h3>
        </div>

        {/* Sous-valeurs en liste */}
        <div className="space-y-2">
          {subValues.map((sv, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {sv.icon && (
                  <sv.icon className={cn('h-3.5 w-3.5', styles.text)} />
                )}
                <span className="text-sm text-gray-600">{sv.label}</span>
              </div>
              <span
                className={cn(
                  'text-base font-medium',
                  sv.highlight ? cn('font-bold', styles.text) : 'text-[#183559]'
                )}
              >
                {isLoading ? '--' : sv.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer avec action */}
      {actionLabel && actionHref && (
        <div
          className={cn('px-6 py-4 border-t', styles.bgLight, styles.border)}
        >
          <Link
            href={actionHref}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2.5',
              'text-white text-sm font-medium rounded-lg transition-colors',
              `bg-gradient-to-r ${styles.gradient}`,
              'hover:opacity-90'
            )}
          >
            <Icon className="h-4 w-4" />
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default KPICard;
