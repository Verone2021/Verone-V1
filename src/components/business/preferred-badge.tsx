/**
 * Composant: PreferredBadge
 * Affiche un badge pour les organisations préférées (fournisseurs, clients, partenaires)
 *
 * Design V2 - Badge discret avec icône cœur
 * Couleur rose/accent cohérente avec section Performance
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Heart } from 'lucide-react'

export type OrganisationType = 'supplier' | 'customer' | 'partner'

interface PreferredBadgeProps {
  type: OrganisationType
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

// Configuration des labels par type
const TYPE_CONFIG: Record<OrganisationType, { label: string }> = {
  supplier: {
    label: 'Fournisseur préféré',
  },
  customer: {
    label: 'Client préféré',
  },
  partner: {
    label: 'Partenaire préféré',
  },
}

// Configuration tailles
const SIZE_CONFIG = {
  sm: {
    container: 'px-2 py-0.5 gap-1',
    text: 'text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5',
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
  },
}

export function PreferredBadge({
  type,
  size = 'sm',
  showIcon = true,
  className,
}: PreferredBadgeProps) {
  const config = TYPE_CONFIG[type]
  const sizeConfig = SIZE_CONFIG[size]

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-md border font-medium',
        'transition-all duration-200',
        // Colors (rose/pink pour cohérence avec section Performance)
        'bg-pink-50',
        'text-pink-700',
        'border-pink-200',
        // Size
        sizeConfig.container,
        sizeConfig.text,
        // Custom className
        className
      )}
    >
      {showIcon && (
        <Heart
          className={cn('flex-shrink-0 fill-current', sizeConfig.icon)}
        />
      )}
      <span>{config.label}</span>
    </span>
  )
}

/**
 * Variante: Badge avec tooltip explicatif
 */
export function PreferredBadgeWithTooltip({
  type,
  size = 'sm',
  showIcon = true,
  className,
}: PreferredBadgeProps) {
  const DESCRIPTIONS: Record<OrganisationType, string> = {
    supplier: 'Fournisseur marqué comme préféré pour sa qualité et fiabilité',
    customer: 'Client marqué comme préféré pour sa fidélité et valeur',
    partner: 'Partenaire marqué comme préféré pour sa collaboration',
  }

  return (
    <span title={DESCRIPTIONS[type]} className="cursor-help">
      <PreferredBadge
        type={type}
        size={size}
        showIcon={showIcon}
        className={className}
      />
    </span>
  )
}
