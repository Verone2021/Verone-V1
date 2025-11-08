'use client';

import React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import {
  colors,
  componentSpacing,
  componentShadows,
} from '@/lib/design-system';
import { cn } from '@verone/utils';

/**
 * @deprecated Utilisez ButtonUnified à la place
 * @see src/components/ui/button-unified.tsx
 * @see scripts/codemods/MIGRATION-GUIDE.md
 *
 * ActionButton - Bouton d'action rapide optimisé (60x60px)
 *
 * ⚠️ DEPRECATED: Ce composant sera supprimé le 2025-11-21
 * Migration: ActionButton → ButtonUnified
 *
 * Améliorations vs version précédente (80x80px) :
 * - Taille réduite : 60x60px par défaut (vs 80x80px)
 * - Variante inline : 36px hauteur, icon + texte horizontal
 * - Couleurs solides design-system (sans gradients)
 * - CVA pour gestion propre des variantes
 * - Tailles multiples : sm (48px), md (60px), lg (72px)
 *
 * @see /src/lib/design-system pour tokens
 */

const actionButtonVariants = cva(
  'flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        square: 'flex-col gap-1 rounded-2xl',
        inline: 'flex-row gap-2 rounded-lg px-4',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      color: {
        primary: '',
        success: '',
        warning: '',
        danger: '',
        accent: '',
      },
    },
    compoundVariants: [
      // Square sizes
      { variant: 'square', size: 'sm', className: 'w-12 h-12' },
      { variant: 'square', size: 'md', className: 'w-[60px] h-[60px]' },
      { variant: 'square', size: 'lg', className: 'w-[72px] h-[72px]' },
      // Inline sizes
      { variant: 'inline', size: 'sm', className: 'h-8' },
      { variant: 'inline', size: 'md', className: 'h-9' },
      { variant: 'inline', size: 'lg', className: 'h-10' },
    ],
    defaultVariants: {
      variant: 'square',
      size: 'md',
      color: 'primary',
    },
  }
);

export interface ActionButtonProps
  extends VariantProps<typeof actionButtonVariants> {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  label,
  icon: Icon,
  variant = 'square',
  size = 'md',
  color = 'primary',
  onClick,
  disabled = false,
  className,
}: ActionButtonProps) {
  // Deprecation warning en développement
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ DEPRECATED: ActionButton sera supprimé le 2025-11-21. Utilisez ButtonUnified à la place. Voir scripts/codemods/MIGRATION-GUIDE.md'
    );
  }
  // Couleurs solides du design system (sans gradients)
  const colorMap = {
    primary: {
      bg: colors.primary.DEFAULT,
      hover: colors.primary[600],
      active: colors.primary[700],
    },
    success: {
      bg: colors.success.DEFAULT,
      hover: colors.success[600],
      active: colors.success[700],
    },
    warning: {
      bg: colors.warning.DEFAULT,
      hover: colors.warning[600],
      active: colors.warning[700],
    },
    danger: {
      bg: colors.danger.DEFAULT,
      hover: colors.danger[600],
      active: colors.danger[700],
    },
    accent: {
      bg: colors.accent.DEFAULT,
      hover: colors.accent[600],
      active: colors.accent[700],
    },
  };

  const colorScheme = colorMap[color || 'primary'];

  // Tailles d'icônes selon variante et taille
  const iconSizeMap = {
    square: {
      sm: 18,
      md: 22,
      lg: 26,
    },
    inline: {
      sm: 14,
      md: 16,
      lg: 18,
    },
  };

  const iconSize = iconSizeMap[variant || 'square'][size || 'md'];

  // Taille de texte selon variante
  const textSizeMap = {
    square: {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm',
    },
    inline: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  };

  const textSize = textSizeMap[variant || 'square'][size || 'md'];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        actionButtonVariants({ variant, size, color }),
        'group text-white',
        !disabled && 'hover:scale-105 active:scale-95 cursor-pointer',
        className
      )}
      style={{
        backgroundColor: disabled ? colors.neutral[400] : colorScheme.bg,
        boxShadow: disabled ? 'none' : componentShadows.button,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colorScheme.hover;
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colorScheme.bg;
        }
      }}
      onMouseDown={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colorScheme.active;
        }
      }}
      onMouseUp={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colorScheme.hover;
        }
      }}
    >
      <Icon
        size={iconSize}
        className={cn(
          'flex-shrink-0',
          !disabled && 'group-hover:scale-110 transition-transform'
        )}
      />
      <span
        className={cn(
          textSize,
          'leading-tight',
          variant === 'square' ? 'text-center px-1' : 'truncate'
        )}
      >
        {label}
      </span>
    </button>
  );
}
