'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Building2,
  User,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useOrganisations, getOrganisationDisplayName } from '@/hooks/use-organisations'
import { CustomerFormModal } from '@/components/business/customer-form-modal'
import { OrganisationLogo } from '@/components/business/organisation-logo'
import { spacing, colors } from '@/lib/design-system'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  legal_name: string // Dénomination sociale
  trade_name: string | null // Nom commercial (si différent)
  has_different_trade_name: boolean | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  billing_address_line1: string | null
  billing_address_line2: string | null
  billing_city: string | null
  billing_country: string | null
  billing_postal_code: string | null
  is_active: boolean
  customer_type: 'professional' | 'individual' | null
  logo_url: string | null
  archived_at: string | null
  website: string | null
  _count?: {
    orders: number
  }
}

export default function CustomersPage() {
  const searchParams = useSearchParams()
  const urlType = searchParams.get('type') as 'professional' | 'individual' | null

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archivedCustomers, setArchivedCustomers] = useState<Customer[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const typeInfo = useMemo(() => {
    if (urlType === 'professional') {
      return {
        title: 'Clients Professionnels',
        description: 'Gestion des clients professionnels B2B',
        badgeText: 'Professionnels uniquement'
      }
    } else if (urlType === 'individual') {
      return {
        title: 'Clients Particuliers',
        description: 'Gestion des clients particuliers B2C',
        badgeText: 'Particuliers uniquement'
      }
    } else {
      return {
        title: 'Clients',
        description: 'Gestion de tous les clients',
        badgeText: null
      }
    }
  }, [urlType])

  const filters = useMemo(() => ({
    is_active: true,
    search: searchQuery || undefined,
    customer_type: urlType || undefined
  }), [searchQuery, urlType])

  const {
    organisations: customers,
    loading,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useOrganisations(filters)

  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    return customers.filter(customer => customer.type === 'customer')
  }, [customers])

  const stats = useMemo(() => {
    const total = filteredCustomers.length
    const active = filteredCustomers.filter(c => c.is_active).length
    const professional = filteredCustomers.filter(c => c.customer_type === 'professional').length
    const individual = filteredCustomers.filter(c => c.customer_type === 'individual').length

    return { total, active, professional, individual }
  }, [filteredCustomers])

  const handleCreateCustomer = () => {
    setSelectedCustomer(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
  }

  const handleCustomerSuccess = () => {
    refetch()
    handleCloseModal()
  }

  const loadArchivedCustomersData = async () => {
    setArchivedLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('type', 'customer')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) throw error
      setArchivedCustomers((data || []) as Customer[])
    } catch (err) {
      console.error('Erreur chargement clients archivés:', err)
    } finally {
      setArchivedLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedCustomersData()
    }
  }, [activeTab])

  const handleArchive = async (customer: Customer) => {
    if (!customer.archived_at) {
      const success = await archiveOrganisation(customer.id)
      if (success) {
        refetch()
        if (activeTab === 'archived') {
          await loadArchivedCustomersData()
        }
      }
    } else {
      const success = await unarchiveOrganisation(customer.id)
      if (success) {
        refetch()
        await loadArchivedCustomersData()
      }
    }
  }

  const handleDelete = async (customer: Customer) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${getOrganisationDisplayName(customer)}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(customer.id)
      if (success) {
        await loadArchivedCustomersData()
      }
    }
  }

  const displayedCustomers = activeTab === 'active' ? filteredCustomers : archivedCustomers
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
            {typeInfo.title}
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            {typeInfo.description}
          </p>
          {typeInfo.badgeText && (
            <div className="mt-2">
              <Badge variant="outline" style={{ backgroundColor: colors.primary[50], color: colors.primary[700], borderColor: colors.primary[200] }}>
                Filtré: {typeInfo.badgeText}
              </Badge>
            </div>
          )}
        </div>
        <ButtonV2 variant="primary" onClick={handleCreateCustomer} icon={Plus}>
          Nouveau Client
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {stats.total}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Total clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.success[500] }}>
              {stats.active}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Actifs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.primary[500] }}>
              {stats.professional}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Professionnels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.accent[500] }}>
              {stats.individual}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Particuliers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div className="text-2xl font-bold" style={{ color: colors.text.DEFAULT }}>
              {archivedCustomers.length}
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
          <span className="ml-2 opacity-70">({filteredCustomers.length})</span>
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
          <span className="ml-2 opacity-70">({archivedCustomers.length})</span>
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

      {/* Customers Grid - 4-5 par ligne, cartes compactes */}
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
          displayedCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-all duration-200" data-testid="customer-card">
              <CardContent style={{ padding: spacing[4] }}>
                {/* Layout Horizontal Spacieux - Logo GAUCHE + Infos DROITE */}
                <div className="flex gap-4">
                  {/* Logo GAUCHE - MD (48px) */}
                  <OrganisationLogo
                    logoUrl={customer.logo_url}
                    organisationName={getOrganisationDisplayName(customer)}
                    size="md"
                    fallback="initials"
                    className="flex-shrink-0"
                  />

                  {/* Contenu DROITE - Stack vertical spacieux */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Ligne 1: Nom + Badge Archivé */}
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">
                        {customer.website ? (
                          <a
                            href={customer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: colors.text.DEFAULT }}
                            data-testid="customer-name"
                          >
                            {getOrganisationDisplayName(customer)}
                          </a>
                        ) : (
                          <span style={{ color: colors.text.DEFAULT }} data-testid="customer-name">
                            {getOrganisationDisplayName(customer)}
                          </span>
                        )}
                      </CardTitle>

                      {customer.archived_at && (
                        <Badge
                          variant="destructive"
                          className="text-xs flex-shrink-0"
                          style={{ backgroundColor: colors.danger[100], color: colors.danger[700] }}
                        >
                          Archivé
                        </Badge>
                      )}
                    </div>

                    {/* Adresse de facturation complète - Polices plus petites */}
                    {(customer.billing_address_line1 || customer.billing_city || customer.billing_country) && (
                      <div className="space-y-0.5">
                        {customer.billing_address_line1 && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.text.subtle }}>
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{customer.billing_address_line1}</span>
                          </div>
                        )}
                        {(customer.billing_postal_code || customer.billing_city) && (
                          <div className="text-xs pl-[18px]" style={{ color: colors.text.subtle }}>
                            <span className="truncate">
                              {customer.billing_postal_code && `${customer.billing_postal_code}, `}
                              {customer.billing_city}
                            </span>
                          </div>
                        )}
                        {customer.billing_country && (
                          <div className="text-xs pl-[18px]" style={{ color: colors.text.subtle }}>
                            <span className="truncate">{customer.billing_country}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Séparateur + Boutons minimalistes */}
                    <div>
                      <div className="border-t my-2" style={{ borderColor: colors.border.DEFAULT }} />
                      <div className="flex items-center gap-2">
                        {activeTab === 'active' ? (
                          <>
                            <Link href={`/contacts-organisations/customers/${customer.id}`}>
                              <ButtonV2 variant="ghost" size="sm" className="text-xs h-7 px-3" icon={Eye}>
                                Voir
                              </ButtonV2>
                            </Link>
                            <ButtonV2
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(customer)}
                              icon={Archive}
                              className="h-7 px-2"
                              aria-label="Archiver"
                            />
                          </>
                        ) : (
                          <>
                            <ButtonV2
                              variant="secondary"
                              size="sm"
                              onClick={() => handleArchive(customer)}
                              icon={ArchiveRestore}
                              className="h-7 px-2"
                              aria-label="Restaurer"
                            />
                            <ButtonV2
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(customer)}
                              icon={Trash2}
                              className="h-7 px-2"
                              aria-label="Supprimer"
                            />
                            <Link href={`/contacts-organisations/customers/${customer.id}`}>
                              <ButtonV2 variant="ghost" size="sm" className="text-xs h-7 px-3" icon={Eye}>
                                Voir
                              </ButtonV2>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {displayedCustomers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center" style={{ padding: spacing[8] }}>
            <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.DEFAULT }}>
              Aucun client trouvé
            </h3>
            <p className="mb-4" style={{ color: colors.text.subtle }}>
              {searchQuery
                ? 'Aucun client ne correspond à votre recherche.'
                : activeTab === 'active'
                  ? 'Commencez par créer votre premier client.'
                  : 'Aucun client archivé.'
              }
            </p>
            {activeTab === 'active' && (
              <ButtonV2 variant="primary" onClick={handleCreateCustomer} icon={Plus}>
                Créer un client
              </ButtonV2>
            )}
          </CardContent>
        </Card>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCustomerCreated={handleCustomerSuccess}
        onCustomerUpdated={handleCustomerSuccess}
        customer={selectedCustomer as any}
        mode={selectedCustomer ? 'edit' : 'create'}
      />
    </div>
  )
}
