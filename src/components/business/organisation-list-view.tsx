'use client'

import { Badge } from '@/components/ui/badge'
import { ButtonV2 } from '@/components/ui/button'
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Eye,
  Package,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers'
import { OrganisationLogo } from './organisation-logo'
import { SupplierSegmentBadge, SupplierSegmentType } from './supplier-segment-badge'

interface OrganisationListViewProps {
  organisations: Array<{
    id: string
    legal_name: string
    trade_name?: string | null
    type: 'customer' | 'supplier' | 'partner'
    email?: string | null
    phone?: string | null
    country?: string | null
    city?: string | null
    postal_code?: string | null
    is_active: boolean
    archived_at?: string | null
    logo_url?: string | null
    customer_type?: 'professional' | 'individual' | null
    supplier_segment?: SupplierSegmentType | null
    _count?: {
      products?: number
    }
  }>
  activeTab: 'active' | 'archived'
  onArchive: (id: string) => void
  onDelete?: (id: string) => void
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
 * Retourne le label de type d'organisation
 */
function getTypeLabel(type: string, customerType?: string | null) {
  if (type === 'customer') {
    return customerType === 'professional' ? 'B2B Pro' : 'B2C'
  }
  if (type === 'supplier') return 'Fournisseur'
  return 'Partenaire'
}

/**
 * Retourne la couleur du badge selon le type
 */
function getTypeBadgeColor(type: string, customerType?: string | null) {
  if (type === 'customer') {
    return customerType === 'professional'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-purple-50 text-purple-700 border-purple-200'
  }
  if (type === 'supplier') return 'bg-green-50 text-green-700 border-green-200'
  return 'bg-orange-50 text-orange-700 border-orange-200'
}

/**
 * Vue liste (table) ultra-compacte pour organisations
 * - Typography: text-sm (14px) body, text-xs (12px) headers
 * - Padding: py-1.5 (6px) rows compacts
 * - Standards 2025: Minimal spacing, responsive
 */
export function OrganisationListView({
  organisations,
  activeTab,
  onArchive,
  onDelete
}: OrganisationListViewProps) {
  const getBaseUrl = (type: string) => {
    if (type === 'customer') return '/contacts-organisations/customers'
    if (type === 'supplier') return '/contacts-organisations/suppliers'
    return '/contacts-organisations/partners'
  }

  // Afficher colonne Produits uniquement pour Suppliers
  const showProductsColumn = organisations.some(org => org.type === 'supplier')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-600 border-b">
            <th className="py-2 px-3 text-left font-medium">Organisation</th>
            <th className="py-2 px-3 text-left font-medium">Type</th>
            <th className="py-2 px-3 text-left font-medium">Localisation</th>
            <th className="py-2 px-3 text-left font-medium">Contact</th>
            {showProductsColumn && (
              <th className="py-2 px-3 text-left font-medium">Produits</th>
            )}
            <th className="py-2 px-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {organisations.map((org) => {
            const countryCode = formatCountryCode(org.country)
            const baseUrl = getBaseUrl(org.type)

            return (
              <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                {/* Organisation: Logo + Nom */}
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <OrganisationLogo
                      logoUrl={org.logo_url}
                      organisationName={getOrganisationDisplayName(org)}
                      size="xs"
                      fallback="initials"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-black truncate leading-tight">
                        {getOrganisationDisplayName(org)}
                      </p>
                      {org.archived_at && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1 py-0 mt-0.5"
                        >
                          Archivé
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>

                {/* Type: Badge ou Segment */}
                <td className="py-1.5 px-3">
                  {org.type === 'supplier' && org.supplier_segment ? (
                    <SupplierSegmentBadge
                      segment={org.supplier_segment}
                      size="xs"
                      showIcon={false}
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0.5 ${getTypeBadgeColor(org.type, org.customer_type)}`}
                    >
                      {getTypeLabel(org.type, org.customer_type)}
                    </Badge>
                  )}
                </td>

                {/* Localisation: Pays - Ville */}
                <td className="py-1.5 px-3">
                  <div className="space-y-0.5">
                    {countryCode && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        🌍 <span className="font-medium">{countryCode}</span>
                      </div>
                    )}
                    {org.city && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {org.city}
                          {org.postal_code && `, ${org.postal_code}`}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Contact: Email + Phone */}
                <td className="py-1.5 px-3">
                  <div className="space-y-0.5 text-xs text-gray-600">
                    {org.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{org.phone}</span>
                      </div>
                    )}
                    {!org.email && !org.phone && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>

                {/* Produits (suppliers uniquement) */}
                {showProductsColumn && (
                  <td className="py-1.5 px-3">
                    {org.type === 'supplier' && org._count !== undefined ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="font-medium text-black">
                          {org._count.products || 0}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                )}

                {/* Actions */}
                <td className="py-1.5 px-3">
                  <div className="flex items-center justify-end gap-1">
                    {activeTab === 'active' ? (
                      <>
                        <Link href={`${baseUrl}/${org.id}`}>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            className="h-9 w-9 p-0"
                            aria-label="Voir détails"
                          />
                        </Link>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(org.id)}
                          icon={Archive}
                          className="h-9 w-9 p-0 text-gray-600 hover:text-black"
                          aria-label="Archiver"
                        />
                      </>
                    ) : (
                      <>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(org.id)}
                          icon={ArchiveRestore}
                          className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700"
                          aria-label="Restaurer"
                        />
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(org.id)}
                          icon={Trash2}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                          aria-label="Supprimer"
                        />
                        <Link href={`${baseUrl}/${org.id}`}>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            className="h-9 w-9 p-0"
                            aria-label="Voir détails"
                          />
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
