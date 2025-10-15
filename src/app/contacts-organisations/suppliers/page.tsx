'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui-v2/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Building2,
  MapPin,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Globe,
  Trash2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useSuppliers } from '@/hooks/use-organisations'
import { SupplierFormModal } from '@/components/business/supplier-form-modal'
import { OrganisationLogo } from '@/components/business/organisation-logo'
import { SupplierSegmentBadge, SupplierSegmentType } from '@/components/business/supplier-segment-badge'
import { SupplierCategoryBadge, SupplierCategoryCode } from '@/components/business/supplier-category-badge'
import { spacing, colors } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
  email: string | null
  country: string | null
  is_active: boolean
  archived_at: string | null
  website: string | null
  logo_url: string | null
  supplier_segment: SupplierSegmentType | null
  supplier_category: string | null
  _count?: {
    products: number
  }
}

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archivedSuppliers, setArchivedSuppliers] = useState<Supplier[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const filters = useMemo(() => ({
    is_active: true,
    search: searchQuery || undefined
  }), [searchQuery])

  const {
    organisations: suppliers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useSuppliers(filters)

  const handleCreateSupplier = () => {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSupplier(null)
  }

  const handleSupplierSuccess = () => {
    refetch()
    handleCloseModal()
  }

  const loadArchivedSuppliersData = async () => {
    setArchivedLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organisations')
        .select(`
          *,
          products:products(count)
        `)
        .eq('type', 'supplier')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) throw error

      // Transform data
      const organisationsWithCounts = (data || []).map((org: any) => {
        const { products, ...rest } = org
        return {
          ...rest,
          _count: {
            products: products?.[0]?.count || 0
          }
        }
      })

      setArchivedSuppliers(organisationsWithCounts as Supplier[])
    } catch (err) {
      console.error('Erreur chargement fournisseurs archivés:', err)
    } finally {
      setArchivedLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedSuppliersData()
    }
  }, [activeTab])

  const handleArchive = async (supplier: Supplier) => {
    if (!supplier.archived_at) {
      const success = await archiveOrganisation(supplier.id)
      if (success) {
        refetch()
        if (activeTab === 'archived') {
          await loadArchivedSuppliersData()
        }
      }
    } else {
      const success = await unarchiveOrganisation(supplier.id)
      if (success) {
        refetch()
        await loadArchivedSuppliersData()
      }
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${supplier.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(supplier.id)
      if (success) {
        await loadArchivedSuppliersData()
      }
    }
  }

  const displayedSuppliers = activeTab === 'active' ? suppliers : archivedSuppliers
  const isLoading = activeTab === 'active' ? loading : archivedLoading

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start" style={{ marginBottom: spacing[6] }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <ButtonV2 variant="ghost" size="sm" icon={ArrowLeft}>
                Organisations
              </ButtonV2>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: colors.text.DEFAULT }}>
            Fournisseurs
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion des fournisseurs et partenaires commerciaux
          </p>
        </div>
        <ButtonV2 variant="primary" onClick={handleCreateSupplier} icon={Plus}>
          Nouveau Fournisseur
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {suppliers.length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Total fournisseurs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.success[500] }}>
              {suppliers.filter(s => s.is_active).length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent[500] }}>
              {suppliers.reduce((sum, s) => sum + (s._count?.products || 0), 0)}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Produits individuels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {suppliers.filter(s => s.email || s.website).length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Avec contact
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {archivedSuppliers.length}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Archivés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Actifs/Archivés */}
      <div className="flex items-center gap-2" style={{ marginBottom: spacing[4] }}>
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'active'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Actifs
          <span className="ml-2 opacity-70">({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'archived'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Archivés
          <span className="ml-2 opacity-70">({archivedSuppliers.length})</span>
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{ borderColor: colors.border.DEFAULT, color: colors.text.DEFAULT }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid - 4-5 par ligne, cartes compactes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader style={{ padding: spacing[2] }}>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent style={{ padding: spacing[2] }}>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          displayedSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow" data-testid="supplier-card">
              <CardHeader style={{ padding: spacing[2] }}>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5 flex-1 min-w-0">
                    <OrganisationLogo
                      logoUrl={supplier.logo_url}
                      organisationName={supplier.name}
                      size="sm"
                      fallback="initials"
                      className="flex-shrink-0"
                    />
                    {supplier.website ? (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate flex items-center gap-1"
                        style={{ color: colors.text.DEFAULT }}
                        data-testid="supplier-name"
                      >
                        <span className="truncate">{supplier.name}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                      </a>
                    ) : (
                      <span className="truncate" style={{ color: colors.text.DEFAULT }} data-testid="supplier-name">
                        {supplier.name}
                      </span>
                    )}
                  </CardTitle>
                  {supplier.archived_at && (
                    <Badge
                      variant="destructive"
                      className="text-xs flex-shrink-0"
                      style={{ backgroundColor: colors.danger[100], color: colors.danger[700] }}
                    >
                      Archivé
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5" style={{ padding: spacing[2] }}>
                {/* Badges Taxonomie: Segment + Catégories */}
                {(supplier.supplier_segment || supplier.supplier_category) && (
                  <div className="flex flex-wrap items-center gap-1.5 pb-1.5">
                    {supplier.supplier_segment && (
                      <SupplierSegmentBadge segment={supplier.supplier_segment} size="sm" showIcon={true} />
                    )}
                    {supplier.supplier_category && (
                      <SupplierCategoryBadge
                        category={supplier.supplier_category}
                        size="sm"
                        showIcon={false}
                        mode="single"
                      />
                    )}
                  </div>
                )}

                {/* Pays uniquement */}
                {supplier.country && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.subtle }}>
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{supplier.country}</span>
                  </div>
                )}

                {/* Stats produits */}
                <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: colors.border.DEFAULT }}>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: colors.text.subtle }}>Produits:</span>
                    <span className="font-medium" style={{ color: colors.text.DEFAULT }}>
                      {supplier._count?.products || 0}
                    </span>
                  </div>
                </div>

                {/* Actions - Button Group Horizontal */}
                <div className="pt-1.5 border-t flex items-center gap-1" style={{ borderColor: colors.border.DEFAULT }}>
                  {activeTab === 'active' ? (
                    <>
                      {/* Onglet Actifs: Voir détails + Archive icon */}
                      <Link href={`/contacts-organisations/suppliers/${supplier.id}`} className="flex-1">
                        <ButtonV2 variant="ghost" size="sm" className="w-full text-xs">
                          Voir détails
                        </ButtonV2>
                      </Link>

                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(supplier)}
                        icon={Archive}
                        className="px-2 text-xs"
                        aria-label="Archiver"
                      />
                    </>
                  ) : (
                    <>
                      {/* Onglet Archivés: Icons + Voir détails */}
                      <ButtonV2
                        variant="secondary"
                        size="sm"
                        onClick={() => handleArchive(supplier)}
                        icon={ArchiveRestore}
                        className="px-2 text-xs"
                        aria-label="Restaurer"
                      />

                      <ButtonV2
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(supplier)}
                        icon={Trash2}
                        className="px-2 text-xs"
                        aria-label="Supprimer"
                      />

                      <Link href={`/contacts-organisations/suppliers/${supplier.id}`} className="flex-1">
                        <ButtonV2 variant="ghost" size="sm" className="w-full text-xs">
                          Voir détails
                        </ButtonV2>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {displayedSuppliers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center" style={{ padding: spacing[8] }}>
            <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.DEFAULT }}>
              Aucun fournisseur trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun fournisseur ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier fournisseur.'
                  : 'Aucun fournisseur archivé.'
              }
            </p>
            {activeTab === 'active' && (
              <ButtonV2 variant="primary" onClick={handleCreateSupplier} icon={Plus}>
                Créer un fournisseur
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        supplier={selectedSupplier as any}
        onSuccess={handleSupplierSuccess}
      />
    </div>
  )
}
