'use client';

import React from 'react';

import { cn } from '@verone/utils';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

import { ButtonUnified } from './button-unified';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/**
 * IconButton - Composant bouton icon-only avec tooltip intégré
 *
 * Design System V2 - Pattern icon-only pour tables denses et interfaces compactes
 *
 * Fonctionnalités :
 * - ✅ Tooltip Radix UI intégré automatiquement (WCAG 2.2 AA)
 * - ✅ aria-label automatique (accessibilité screen readers)
 * - ✅ 10 variants (tous variants ButtonUnified supportés)
 * - ✅ 3 sizes optimisées : sm (32px), md (40px), lg (48px)
 * - ✅ Icon size mapping automatique : sm=14px, md=16px, lg=18px
 * - ✅ Loading state avec spinner Loader2
 * - ✅ Disabled state avec tooltip fonctionnel
 * - ✅ Keyboard navigation (Tab + Enter)
 *
 * Use Cases :
 * - Tables denses avec actions CRUD compactes
 * - Toolbars avec multiples actions icon-only
 * - Interfaces mobiles space-constrained
 * - Boutons répétitifs où text est redondant
 *
 * @example
 * ```tsx
 * // Bouton action CRUD simple
 * <IconButton
 *   icon={Eye}
 *   variant="outline"
 *   size="sm"
 *   label="Voir détails"
 *   onClick={handleView}
 * />
 *
 * // Boutons sémantiques success/danger
 * <IconButton icon={CheckCircle} variant="success" label="Confirmer" />
 * <IconButton icon={Trash2} variant="danger" label="Supprimer" />
 *
 * // Loading state
 * <IconButton
 *   icon={Save}
 *   variant="default"
 *   label="Enregistrer"
 *   loading={isSaving}
 * />
 *
 * // Disabled avec tooltip
 * <IconButton
 *   icon={Ban}
 *   variant="outline"
 *   label="Annuler (action déjà effectuée)"
 *   disabled
 * />
 *
 * // Button group compact
 * <div className="flex gap-1">
 *   <IconButton icon={Eye} variant="ghost" size="sm" label="Voir" />
 *   <IconButton icon={Edit} variant="outline" size="sm" label="Éditer" />
 *   <IconButton icon={Trash2} variant="danger" size="sm" label="Supprimer" />
 * </div>
 * ```
 *
 * @see packages/@verone/ui/BUTTON-PATTERNS-2025.md - Pattern 3: Icon-only
 * @see apps/back-office/src/app/commandes/fournisseurs/page.tsx - Use case réel (18 buttons)
 */

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Icône Lucide à afficher (obligatoire)
   * @example icon={Eye}
   */
  icon: LucideIcon;
  /**
   * Label pour tooltip et aria-label (obligatoire pour accessibilité)
   * Affiché dans tooltip au hover, utilisé par screen readers
   * @example label="Voir les détails de la commande"
   */
  label: string;
  /**
   * Variant visuel (tous variants ButtonUnified supportés)
   * @default 'outline'
   */
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'gradient'
    | 'glass'
    | 'success'
    | 'danger';
  /**
   * Taille du bouton (3 sizes optimisées)
   * - sm: 32x32px (icon 14px) - Tables denses, toolbars compacts
   * - md: 40x40px (icon 16px) - Défaut, équilibré
   * - lg: 48x48px (icon 18px) - CTAs, headers
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * État loading : affiche spinner Loader2, désactive interaction
   */
  loading?: boolean;
  /**
   * Position tooltip (auto par défaut, override si nécessaire)
   * @default 'top'
   */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Classes Tailwind additionnelles
   */
  className?: string;
}

/**
 * IconButton Component
 *
 * Architecture :
 * - Wrapper Tooltip (Radix UI) pour accessibilité
 * - ButtonUnified interne avec size="icon" override
 * - Icon size mapping automatique selon size prop
 * - Span wrapper si disabled pour tooltip fonctionnel
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      label,
      variant = 'outline',
      size = 'md',
      loading = false,
      disabled = false,
      tooltipSide = 'top',
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    // Mapping icon size selon size bouton
    const iconSizeMap = {
      sm: 14, // 32px button
      md: 16, // 40px button (default)
      lg: 18, // 48px button
    };
    const iconSize = iconSizeMap[size];

    // Mapping dimensions bouton selon size
    const sizeClassMap = {
      sm: 'h-8 w-8', // 32x32px
      md: 'h-10 w-10', // 40x40px (default icon size ButtonUnified)
      lg: 'h-12 w-12', // 48x48px
    };
    const sizeClass = sizeClassMap[size];

    // Bouton interne (réutilise ButtonUnified)
    const buttonElement = (
      <ButtonUnified
        ref={ref}
        variant={variant}
        size="icon" // Force size="icon" (base 40x40px)
        disabled={disabled || loading}
        aria-label={label} // Accessibilité screen readers
        className={cn(
          sizeClass, // Override size="icon" default si sm/lg
          className
        )}
        onClick={onClick}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={iconSize} />
        ) : (
          <Icon size={iconSize} strokeWidth={2} />
        )}
      </ButtonUnified>
    );

    // Si disabled : Wrapper span pour tooltip fonctionnel
    // Radix Tooltip ne trigger pas sur éléments disabled sans wrapper
    const triggerElement = disabled ? (
      <span
        tabIndex={0} // Permet focus clavier pour accessibilité
        className="inline-flex cursor-not-allowed"
      >
        {buttonElement}
      </span>
    ) : (
      buttonElement
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{triggerElement}</TooltipTrigger>
        <TooltipContent side={tooltipSide} align="center">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

IconButton.displayName = 'IconButton';
