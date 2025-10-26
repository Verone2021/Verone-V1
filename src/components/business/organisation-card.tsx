'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers'
import { OrganisationLogo } from './organisation-logo'
import { SupplierSegmentBadge, SupplierSegmentType } from './supplier-segment-badge'
import { SupplierCategoryBadge } from './supplier-category-badge'
import { spacing, colors } from '@/lib/design-system'

interface OrganisationCardProps {
  organisation: {
    id: string
    legal_name: string
    trade_name?: string | null
    type: 'customer' | 'supplier' | 'partner'
    email?: string | null
    country?: string | null
    city?: string | null
    postal_code?: string | null
    is_active: boolean
    archived_at?: string | null
    website?: string | null
    logo_url?: string | null
    customer_type?: 'professional' | 'individual' | null
    supplier_segment?: SupplierSegmentType | null
    supplier_category?: string | null
    _count?: {
      products?: number
    }
  }
  activeTab: 'active' | 'archived'
  onArchive: () => void
  onDelete?: () => void
}

/**
 * Formatte le code pays en version courte (FR au lieu de France)
 */
function formatCountryCode(country: string | null): string {
  if (!country) return ''

  const countryMap: Record<string, string> = {
    'France': 'FR',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Italy': 'IT',
    'Spain': 'ES',
    'Germany': 'DE',
    'United Kingdom': 'UK',
    'Netherlands': 'NL'
  }

  return countryMap[country] || country.substring(0, 2).toUpperCase()
}

/**
 * Retourne les informations de badge selon le type d'organisation
 */
function getOrganisationTypeInfo(type: string, customerType?: string | null) {
  if (type === 'customer') {
    return {
      label: customerType === 'professional' ? 'B2B Pro' : 'B2C',
      colorClass: customerType === 'professional'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-purple-50 text-purple-700 border-purple-200'
    }
  }

  if (type === 'supplier') {
    return {
      label: 'Fournisseur',
      colorClass: 'bg-green-50 text-green-700 border-green-200'
    }
  }

  return {
    label: 'Partenaire',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-200'
  }
}

/**
 * Carte organisation ultra-compacte (Standards 2025)
 * - Height: ~140-150px (vs 220px avant = -36%)
 * - Padding: 8px (p-2)
 * - Spacing: 4px (space-y-1)
 * - Typography: 10-14px
 */
export function OrganisationCard({
  organisation,
  activeTab,
  onArchive,
  onDelete
}: OrganisationCardProps) {
  const typeInfo = getOrganisationTypeInfo(organisation.type, organisation.customer_type)
  const countryCode = formatCountryCode(organisation.country)
  const baseUrl = organisation.type === 'customer'
    ? '/contacts-organisations/customers'
    : organisation.type === 'supplier'
    ? '/contacts-organisations/suppliers'
    : '/contacts-organisations/partners'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-2 space-y-1">
        {/* Ligne 1: Logo + Nom + Badge Archivé */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <OrganisationLogo
              logoUrl={organisation.logo_url}
              organisationName={getOrganisationDisplayName(organisation)}
              size="xs"
              fallback="initials"
              className="flex-shrink-0"
            />
            {organisation.website ? (
              <a
                href={organisation.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate flex items-center gap-1 text-sm font-medium leading-tight"
                style={{ color: colors.text.DEFAULT }}
              >
                <span className="truncate">{getOrganisationDisplayName(organisation)}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
              </a>
            ) : (
              <span className="truncate text-sm font-medium leading-tight" style={{ color: colors.text.DEFAULT }}>
                {getOrganisationDisplayName(organisation)}
              </span>
            )}
          </div>
          {organisation.archived_at && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0.5 flex-shrink-0 leading-tight"
              style={{ backgroundColor: colors.danger[100], color: colors.danger[700] }}
            >
              Archivé
            </Badge>
          )}
        </div>

        {/* Ligne 2: Badge Type / Segment Supplier */}
        {organisation.type === 'supplier' && organisation.supplier_segment ? (
          <div className="flex flex-wrap items-center gap-1">
            <SupplierSegmentBadge segment={organisation.supplier_segment} size="xs" showIcon={true} />
            {organisation.supplier_category && (
              <SupplierCategoryBadge
                category={organisation.supplier_category}
                size="xs"
                showIcon={false}
                mode="single"
              />
            )}
          </div>
        ) : (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 w-fit leading-tight ${typeInfo.colorClass}`}
          >
            {typeInfo.label}
          </Badge>
        )}

        {/* Ligne 3-4: Localisation (2 lignes compactes) */}
        {(countryCode || organisation.city) && (
          <div className="space-y-0.5">
            {countryCode && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 leading-tight border-gray-300">
                🌍 {countryCode}
              </Badge>
            )}
            {organisation.city && (
              <div className="flex items-center gap-1 text-xs text-gray-500 leading-tight">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {organisation.city}{organisation.postal_code ? `, ${organisation.postal_code}` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Ligne Produits (uniquement pour suppliers) */}
        {organisation.type === 'supplier' && organisation._count !== undefined && (
          <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: colors.border.DEFAULT }}>
            <div className="flex items-center gap-1 text-gray-500">
              <Package className="h-3 w-3" />
              <span>Produits:</span>
            </div>
            <span className="font-medium" style={{ color: colors.text.DEFAULT }}>
              {organisation._count.products || 0}
            </span>
          </div>
        )}

        {/* Ligne 5: Actions compactes */}
        <div className="flex items-center gap-1 pt-1 border-t" style={{ borderColor: colors.border.DEFAULT }}>
          {activeTab === 'active' ? (
            <>
              <Link href={`${baseUrl}/${organisation.id}`} className="flex-1">
                <ButtonV2 variant="ghost" size="sm" className="w-full text-[11px] h-7 leading-tight">
                  Détails
                </ButtonV2>
              </Link>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={onArchive}
                icon={Archive}
                className="px-2 text-[11px] h-7"
                aria-label="Archiver"
              />
            </>
          ) : (
            <>
              <ButtonV2
                variant="secondary"
                size="sm"
                onClick={onArchive}
                icon={ArchiveRestore}
                className="px-2 text-[11px] h-7"
                aria-label="Restaurer"
              />
              <ButtonV2
                variant="danger"
                size="sm"
                onClick={onDelete}
                icon={Trash2}
                className="px-2 text-[11px] h-7"
                aria-label="Supprimer"
              />
              <Link href={`${baseUrl}/${organisation.id}`} className="flex-1">
                <ButtonV2 variant="ghost" size="sm" className="w-full text-[11px] h-7 leading-tight">
                  Détails
                </ButtonV2>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}