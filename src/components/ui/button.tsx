'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { colors, spacing, componentShadows } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export interface ButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
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
      backgroundColor: colors.text.DEFAULT, // Noir #212529
      color: colors.text.inverse, // Blanc
      border: 'none',
      hoverBg: colors.neutral[900],
      shadow: componentShadows.button,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text.DEFAULT,
      border: `2px solid ${colors.text.DEFAULT}`,
      hoverBg: colors.text.DEFAULT,
      hoverColor: colors.text.inverse,
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

  // Size styles
  const sizeStyles = {
    sm: {
      padding: `${spacing[2]} ${spacing[4]}`, // 8px 16px
      fontSize: '14px',
      height: '36px',
      iconSize: 16,
    },
    md: {
      padding: `${spacing[3]} ${spacing[6]}`, // 12px 24px
      fontSize: '15px',
      height: '44px',
      iconSize: 18,
    },
    lg: {
      padding: `${spacing[4]} ${spacing[8]}`, // 16px 32px
      fontSize: '16px',
      height: '52px',
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
