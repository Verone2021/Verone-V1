'use client'

/**
 * 🎨 ChannelBadge Component
 *
 * Badge de canal de vente avec icône et couleur distinctives
 * Design System V2 - Best Practices 2025
 *
 * @example
 * ```tsx
 * <ChannelBadge channelCode="b2b" size="md" showIcon />
 * <ChannelBadge channelCode="ecommerce" size="sm" />
 * ```
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { CHANNEL_CONFIG, type ChannelCode, SIZES } from './types'

export interface ChannelBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Code du canal de vente
   */
  channelCode: ChannelCode

  /**
   * Taille du badge
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Afficher l'icône du canal
   * @default true
   */
  showIcon?: boolean
}

/**
 * Badge canal de vente avec configuration visuelle dédiée
 *
 * Features:
 * - 4 canaux supportés (B2B, E-commerce, Retail, Wholesale)
 * - Icônes distinctives lucide-react
 * - 3 tailles (sm/md/lg)
 * - Micro-interaction hover scale 1.05
 * - Couleurs Design System V2
 * - Accessibility compliant (ARIA labels)
 */
export function ChannelBadge({
  channelCode,
  size = 'md',
  showIcon = true,
  className,
  ...props
}: ChannelBadgeProps) {
  const config = CHANNEL_CONFIG[channelCode]
  const sizeConfig = SIZES[size]
  const Icon = config.icon

  return (
    <div
      role="status"
      aria-label={`Canal ${config.label}`}
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5 rounded font-medium uppercase',
        'transition-all duration-150 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400',

        // Hover microinteraction (scale 1.05)
        'hover:scale-105',

        // Colors
        config.bgColor,
        config.textColor,
        config.hoverColor,

        // Size variants
        sizeConfig.padding,
        sizeConfig.fontSize,

        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className="flex-shrink-0"
          size={sizeConfig.iconSize}
          aria-hidden="true"
        />
      )}

      <span className="leading-none">{config.label}</span>
    </div>
  )
}

/**
 * Type export pour usage externe
 */
ChannelBadge.displayName = 'ChannelBadge'
