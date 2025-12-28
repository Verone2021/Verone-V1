'use client';

import * as React from 'react';

import { Progress } from '@verone/ui';
import { cn } from '@verone/utils';

/**
 * Props pour le composant ConfidenceMeter
 */
export interface ConfidenceMeterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Score de confiance (0-100) */
  score: number;
  /** Afficher le pourcentage */
  showPercentage?: boolean;
  /** Afficher le label de confiance */
  showLabel?: boolean;
  /** Taille */
  size?: 'sm' | 'md' | 'lg';
  /** Affichage compact (juste la barre) */
  compact?: boolean;
}

/**
 * Retourne le label et la couleur selon le score
 */
function getConfidenceInfo(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  if (score >= 90) {
    return {
      label: 'Très élevée',
      colorClass: 'text-green-600 dark:text-green-400',
      bgClass: 'bg-green-500',
    };
  }
  if (score >= 70) {
    return {
      label: 'Élevée',
      colorClass: 'text-green-500 dark:text-green-400',
      bgClass: 'bg-green-400',
    };
  }
  if (score >= 50) {
    return {
      label: 'Moyenne',
      colorClass: 'text-yellow-600 dark:text-yellow-400',
      bgClass: 'bg-yellow-500',
    };
  }
  if (score >= 30) {
    return {
      label: 'Faible',
      colorClass: 'text-orange-600 dark:text-orange-400',
      bgClass: 'bg-orange-500',
    };
  }
  return {
    label: 'Très faible',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500',
  };
}

const sizeClasses = {
  sm: { height: 'h-1.5', text: 'text-xs', width: 'w-16' },
  md: { height: 'h-2', text: 'text-sm', width: 'w-24' },
  lg: { height: 'h-3', text: 'text-base', width: 'w-32' },
};

/**
 * Composant ConfidenceMeter - Affiche un score de confiance avec jauge colorée
 *
 * @example
 * <ConfidenceMeter score={85} /> // Jauge verte "Élevée 85%"
 * <ConfidenceMeter score={45} showLabel={false} /> // Juste 45%
 * <ConfidenceMeter score={95} compact /> // Juste la barre
 */
export function ConfidenceMeter({
  score,
  showPercentage = true,
  showLabel = true,
  size = 'md',
  compact = false,
  className,
  ...props
}: ConfidenceMeterProps) {
  // Clamper le score entre 0 et 100
  const clampedScore = Math.max(0, Math.min(100, score));
  const { label, colorClass, bgClass } = getConfidenceInfo(clampedScore);
  const { height, text, width } = sizeClasses[size];

  if (compact) {
    return (
      <div
        className={cn(
          'relative',
          width,
          height,
          'rounded-full bg-muted overflow-hidden',
          className
        )}
        title={`${clampedScore}% - ${label}`}
        {...props}
      >
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', bgClass)}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div
        className={cn(
          'relative',
          width,
          height,
          'rounded-full bg-muted overflow-hidden'
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            bgClass
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <div className={cn('flex items-center gap-1', text)}>
        {showPercentage && (
          <span className={cn('font-medium tabular-nums', colorClass)}>
            {clampedScore}%
          </span>
        )}
        {showLabel && <span className="text-muted-foreground">({label})</span>}
      </div>
    </div>
  );
}

/**
 * Version badge du ConfidenceMeter pour les tableaux
 */
export function ConfidenceBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const { colorClass } = getConfidenceInfo(clampedScore);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        clampedScore >= 70
          ? 'bg-green-100 dark:bg-green-900'
          : clampedScore >= 50
            ? 'bg-yellow-100 dark:bg-yellow-900'
            : 'bg-red-100 dark:bg-red-900',
        colorClass,
        className
      )}
    >
      {clampedScore}%
    </span>
  );
}
