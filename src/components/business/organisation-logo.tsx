'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/design-system'

interface OrganisationLogoProps {
  logoUrl?: string | null
  organisationName: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: 'initials' | 'icon'
  className?: string
}

const SIZE_CONFIG = {
  xs: { container: 'h-6 w-6', icon: 'h-3 w-3', text: 'text-[10px]', transform: 'width=48&height=48' },
  sm: { container: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-xs', transform: 'width=64&height=64' },
  md: { container: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-sm', transform: 'width=96&height=96' },
  lg: { container: 'h-16 w-16', icon: 'h-8 w-8', text: 'text-base', transform: 'width=128&height=128' },
  xl: { container: 'h-24 w-24', icon: 'h-12 w-12', text: 'text-lg', transform: 'width=192&height=192' }
}

/**
 * Composant pour afficher le logo d'une organisation
 *
 * @param logoUrl - Path du logo dans Storage (ex: "{org_id}/{timestamp}-logo.png")
 * @param organisationName - Nom de l'organisation (pour fallback initiales)
 * @param size - Taille du logo: sm (32px), md (48px), lg (64px), xl (96px)
 * @param fallback - Type de fallback: 'initials' (défaut) ou 'icon'
 * @param className - Classes CSS additionnelles
 *
 * @example
 * <OrganisationLogo
 *   logoUrl={supplier.logo_url}
 *   organisationName="DSA Menuiserie"
 *   size="sm"
 *   fallback="initials"
 * />
 */
export function OrganisationLogo({
  logoUrl,
  organisationName,
  size = 'md',
  fallback = 'initials',
  className
}: OrganisationLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeConfig = SIZE_CONFIG[size]
  const supabase = createClient()

  // Générer URL publique si logoUrl existe
  const publicUrl = logoUrl
    ? supabase.storage
        .from('organisation-logos')
        .getPublicUrl(logoUrl, {
          transform: {
            width: parseInt(sizeConfig.transform.match(/width=(\d+)/)?.[1] || '96'),
            height: parseInt(sizeConfig.transform.match(/height=(\d+)/)?.[1] || '96'),
            quality: 80
          }
        }).data.publicUrl
    : null

  // Extraire initiales du nom (ex: "DSA Menuiserie" → "DM")
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  // Si image error ou pas de logo, afficher fallback
  const showFallback = !publicUrl || imageError

  if (showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border',
          sizeConfig.container,
          className
        )}
        style={{
          backgroundColor: colors.neutral[100],
          borderColor: colors.border.DEFAULT
        }}
      >
        {fallback === 'icon' ? (
          <Building2
            className={sizeConfig.icon}
            style={{ color: colors.text.subtle }}
          />
        ) : (
          <span
            className={cn('font-semibold', sizeConfig.text)}
            style={{ color: colors.text.subtle }}
          >
            {getInitials(organisationName)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-md border overflow-hidden',
        sizeConfig.container,
        className
      )}
      style={{ borderColor: colors.border.DEFAULT }}
    >
      {/* Loading skeleton */}
      {imageLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: colors.neutral[100] }}
        />
      )}

      {/* Image */}
      <img
        src={publicUrl}
        alt={`Logo ${organisationName}`}
        className={cn(
          'h-full w-full object-contain',
          imageLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
      />
    </div>
  )
}
