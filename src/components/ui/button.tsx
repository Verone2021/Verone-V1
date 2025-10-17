'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { colors, spacing, componentShadows } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export interface ButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  asChild?: boolean
}

/**
 * ButtonV2 - Bouton moderne Design System V2
 *
 * Tendances 2025 :
 * - Rounded corners (10px)
 * - Micro-interactions (hover scale 1.02)
 * - Transitions smooth (200ms cubic-bezier)
 * - Shadows élégantes
 * - Accessibilité ARIA complète
 *
 * Inspirations : Vercel, Linear, Stripe, shadcn/ui
 *
 * @see /src/lib/design-system pour tokens
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
  ...props
}: ButtonV2Props) {

  // Variant styles
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
      hoverBg: colors.primary[50], // ✅ Hover bleu très léger
      hoverColor: colors.primary[700],
      shadow: 'none',
    },
    outline: {
      backgroundColor: 'transparent', // ✅ Transparent pour superposition
      color: colors.text.DEFAULT, // ✅ Texte noir
      border: `1.5px solid ${colors.border.strong}`, // ✅ Bordure grise
      hoverBg: colors.background.hover, // ✅ Fond gris léger au hover
      hoverColor: colors.text.DEFAULT,
      shadow: 'none',
    },
    success: {
      backgroundColor: colors.success[500],
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.success[600],
      shadow: componentShadows.button,
    },
    danger: {
      backgroundColor: colors.danger[500],
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.danger[600],
      shadow: componentShadows.button,
    },
    warning: {
      backgroundColor: colors.warning[500], // Orange #ff9b3e
      color: colors.text.inverse,
      border: 'none',
      hoverBg: colors.warning[600],
      shadow: componentShadows.button,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.DEFAULT,
      border: 'none',
      hoverBg: colors.neutral[100],
      shadow: 'none',
    },
  }

  // Size styles - Optimisés selon standards 2025 (shadcn/ui, Linear, Vercel)
  const sizeStyles = {
    xs: {
      padding: `${spacing[1.5]} ${spacing[3]}`, // 6px 12px
      fontSize: '12px',
      height: '28px',
      iconSize: 14,
    },
    sm: {
      padding: `${spacing[2]} ${spacing[3]}`, // 8px 12px (réduit de 16px)
      fontSize: '13px',
      height: '32px', // Réduit: 36px → 32px
      iconSize: 16,
    },
    md: {
      padding: `${spacing[2.5]} ${spacing[4]}`, // 10px 16px (réduit de 24px)
      fontSize: '14px',
      height: '36px', // Réduit: 44px → 36px (Material Design 3 standard)
      iconSize: 16,
    },
    lg: {
      padding: `${spacing[3]} ${spacing[5]}`, // 12px 20px (réduit de 32px)
      fontSize: '15px',
      height: '40px', // Réduit: 52px → 40px (shadcn/ui large)
      iconSize: 18,
    },
    xl: {
      padding: `${spacing[3.5]} ${spacing[6]}`, // 14px 24px
      fontSize: '16px',
      height: '44px', // Touch-friendly (≥44px mobile accessibility)
      iconSize: 20,
    },
  }

  const variantStyle = variantStyles[variant] || variantStyles.primary
  const sizeStyle = sizeStyles[size] || sizeStyles.md
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium',
        'rounded-[10px]',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        !isDisabled && 'hover:scale-[1.02] active:scale-[0.98]',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border,
        padding: sizeStyle.padding,
        height: sizeStyle.height,
        fontSize: sizeStyle.fontSize,
        boxShadow: variantStyle.shadow,
        // Transitions CSS
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionProperty: 'transform, box-shadow, background-color, color',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hoverBg
          if (variantStyle.hoverColor) {
            e.currentTarget.style.color = variantStyle.hoverColor
          }
          if (variant !== 'ghost' && variant !== 'secondary') {
            e.currentTarget.style.boxShadow = componentShadows.buttonHover
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.backgroundColor
          e.currentTarget.style.color = variantStyle.color
          e.currentTarget.style.boxShadow = variantStyle.shadow || 'none'
        }
      }}
    >
      {loading && (
        <Loader2
          size={sizeStyle.iconSize}
          className="animate-spin"
        />
      )}

      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={sizeStyle.iconSize} strokeWidth={2} />
      )}

      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={sizeStyle.iconSize} strokeWidth={2} />
      )}
    </button>
  )
}

// Alias pour compatibilité avec ancien code
export const Button = ButtonV2
export const buttonVariants = {}
