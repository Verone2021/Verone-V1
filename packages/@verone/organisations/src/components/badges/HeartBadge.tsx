/**
 * Composant: HeartBadge
 * Badge discret avec icône cœur uniquement (sans texte)
 *
 * Usage: Affiché sous le logo des organisations préférées
 * Design V2 - Badge minimaliste rose/accent
 */

import React from 'react';

import { Heart } from 'lucide-react';

import { cn } from '@verone/utils';

interface HeartBadgeProps {
  /**
   * Classes CSS personnalisées
   */
  className?: string;
}

/**
 * HeartBadge - Badge cœur minimaliste pour organisations préférées
 *
 * Caractéristiques:
 * - Icône cœur uniquement (14x14px)
 * - Position absolute pour être placé sous le logo
 * - Couleur rose cohérente avec PreferredBadge et section Performance
 * - Border et background subtils
 */
export function HeartBadge({ className }: HeartBadgeProps) {
  return (
    <div
      className={cn(
        // Style badge - Position normale (pas absolute)
        'bg-pink-100 rounded-full p-1',
        'border border-pink-200',
        // Transition pour micro-interactions
        'transition-all duration-200',
        // Shadow subtile
        'shadow-sm',
        // Custom className
        className
      )}
      title="Organisation préférée"
    >
      <Heart className="h-3 w-3 text-pink-600 fill-pink-600" />
    </div>
  );
}
