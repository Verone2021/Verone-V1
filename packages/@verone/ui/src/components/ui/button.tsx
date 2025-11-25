'use client';

import React from 'react';

import { cn } from '@verone/utils';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Design System V2 - Palette Vérone 2025
const colors = {
  primary: {
    DEFAULT: '#3b86d1', // Bleu professionnel
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b86d1',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    DEFAULT: '#38ce3c', // Vert validation
    50: '#f0fdf4',
    100: '#dcfce7',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    DEFAULT: '#ff9b3e', // Orange attention
    50: '#fff7ed',
    100: '#ffedd5',
    600: '#ea580c',
    700: '#c2410c',
  },
  danger: {
    DEFAULT: '#ff4d6b', // Rouge erreur
    50: '#fef2f2',
    100: '#fee2e2',
    600: '#dc2626',
    700: '#b91c1c',
  },
  accent: {
    DEFAULT: '#844fc1', // Violet moderne
  },
  text: {
    DEFAULT: '#1a1a1a', // Noir texte principal
    inverse: '#ffffff', // Blanc sur fonds sombres
    subtle: '#6b7280', // Gris texte secondaire
    muted: '#9ca3af', // Gris texte tertiaire
  },
  background: {
    DEFAULT: '#ffffff',
    hover: '#f9fafb',
  },
  border: {
    DEFAULT: '#e5e7eb',
    strong: '#d1d5db',
  },
};

const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
};

const componentShadows = {
  button: '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 1px rgba(0, 0, 0, 0.1)',
};

export interface ButtonV2Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant du bouton */
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'danger'
    | 'warning'
    | 'ghost'
    | 'default' // Alias de primary
    | 'destructive'; // Alias de danger
  /** Taille du bouton */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'default';
  /** Icône à afficher */
  icon?: LucideIcon;
  /** Position de l'icône */
  iconPosition?: 'left' | 'right';
  /** État de chargement */
  loading?: boolean;
  /** Mode enfant Radix (non utilisé mais préservé pour compatibilité) */
  asChild?: boolean;
}

/**
 * ButtonV2 - Design System V2 (2025)
 *
 * Boutons avec palette Vérone professionnelle:
 * - Primary: Bleu #3b86d1 (plus de noir!)
 * - Secondary: Fond blanc + texte/bordure bleu
 * - Success, Danger, Warning: Couleurs sémantiques
 * - Ghost: Minimal transparent
 *
 * Microinteractions 2025:
 * - Border-radius: 10px (moderne)
 * - Hover: scale(1.02) + shadow
 * - Active: scale(0.98)
 * - Loading: Spinner lucide-react
 *
 * @example
 * ```tsx
 * <ButtonV2 variant="primary" size="md">
 *   Enregistrer
 * </ButtonV2>
 *
 * <ButtonV2 variant="secondary" icon={Plus} iconPosition="left" loading={saving}>
 *   Ajouter un produit
 * </ButtonV2>
 * ```
 */
export function ButtonV2({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonV2Props) {
  const isDisabled = disabled || loading;

  // Mapper les alias vers les variants réels
  const normalizedVariant =
    variant === 'default'
      ? 'primary'
      : variant === 'destructive'
        ? 'danger'
        : variant;

  // Mapper les sizes avec aliases
  const normalizedSize = size === 'default' ? 'md' : size;

  // Variant styles - INLINE STYLES (pas CVA)
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary.DEFAULT, // ✅ Bleu #3b86d1 (plus noir!)
      color: colors.text.inverse, // Blanc
      border: 'none',
      hoverBg: colors.primary[600],
      shadow: componentShadows.button,
    },
    secondary: {
      backgroundColor: '#ffffff', // ✅ Fond blanc épuré
      color: colors.primary.DEFAULT, // ✅ Texte bleu
      border: `2px solid ${colors.primary.DEFAULT}`, // ✅ Bordure bleue
      hoverBg: colors.primary[50],
      hoverColor: colors.primary[700],
      shadow: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.text.DEFAULT,
      border: `1.5px solid ${colors.border.strong}`,
      hoverBg: colors.background.hover,
      hoverColor: colors.text.DEFAULT,
      shadow: 'none',
    },
    success: {
      backgroundColor: colors.success.DEFAULT,
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.success[600],
      shadow: componentShadows.button,
    },
    danger: {
      backgroundColor: colors.danger.DEFAULT,
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.danger[600],
      shadow: componentShadows.button,
    },
    warning: {
      backgroundColor: colors.warning.DEFAULT,
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.warning[600],
      shadow: componentShadows.button,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.DEFAULT,
      border: 'none',
      hoverBg: colors.background.hover,
      hoverColor: colors.text.DEFAULT,
      shadow: 'none',
    },
  };

  // Size styles - UI moderne 2025 compacte
  const sizeStyles = {
    xs: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: '12px',
      height: '28px',
      iconSize: 14,
    },
    sm: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: '13px',
      height: '32px',
      iconSize: 16,
    },
    md: {
      padding: `${spacing[2]} ${spacing[6]}`,
      fontSize: '14px',
      height: '36px',
      iconSize: 16,
    },
    lg: {
      padding: `${spacing[3]} ${spacing[8]}`,
      fontSize: '15px',
      height: '40px',
      iconSize: 18,
    },
    xl: {
      padding: `${spacing[4]} ${spacing[8]}`,
      fontSize: '16px',
      height: '44px',
      iconSize: 20,
    },
    icon: {
      padding: spacing[2],
      fontSize: '14px',
      height: '32px',
      width: '32px',
      iconSize: 16,
    },
  };

  const variantStyle = variantStyles[normalizedVariant];
  const sizeStyle = sizeStyles[normalizedSize];

  // Style object pour inline styles
  const buttonStyle: React.CSSProperties = {
    backgroundColor: variantStyle.backgroundColor,
    color: variantStyle.color,
    border: variantStyle.border,
    padding: sizeStyle.padding,
    height: sizeStyle.height,
    ...(normalizedSize === 'icon' && 'width' in sizeStyle
      ? { width: sizeStyle.width }
      : {}),
    fontSize: sizeStyle.fontSize,
    boxShadow: variantStyle.shadow,
    // Microinteractions gérées via CSS hover
  };

  return (
    <button
      type={type}
      {...props}
      disabled={isDisabled}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'font-medium',
        'rounded-[10px]', // ✅ Border-radius moderne 2025
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        (normalizedVariant === 'primary' ||
          normalizedVariant === 'secondary') &&
          'focus-visible:ring-blue-500',
        normalizedVariant === 'success' && 'focus-visible:ring-green-500',
        normalizedVariant === 'danger' && 'focus-visible:ring-red-500',
        normalizedVariant === 'warning' && 'focus-visible:ring-orange-500',
        // Microinteractions
        !isDisabled && 'hover:scale-[1.02] active:scale-[0.98]',
        // Disabled state
        isDisabled && 'opacity-50 cursor-not-allowed',
        // Icon-only button: centrer le contenu
        normalizedSize === 'icon' && 'p-0',
        className
      )}
      style={buttonStyle}
    >
      {loading && (
        <Loader2 size={sizeStyle.iconSize} className="animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={sizeStyle.iconSize} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={sizeStyle.iconSize} />
      )}
    </button>
  );
}

// Alias pour compatibilité progressive (ButtonV2 = Button)
export const Button = ButtonV2;

// Props alias
export type ButtonProps = ButtonV2Props;
