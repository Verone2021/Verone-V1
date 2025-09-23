'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Building2,
  User,
  ShoppingCart,
  Euro,
  Archive,
  Trash2,
  ArchiveRestore,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useOrganisations } from '@/hooks/use-organisations'
import { CustomerFormModal } from '@/components/business/customer-form-modal'
import { IndividualCustomerFormModal } from '@/components/business/individual-customer-form-modal'

interface CustomerStats {
  totalCustomers: number
  professionalCustomers: number
  activeCustomers: number
  averageOrderValue: number
  totalRevenue: number
}

export default function CustomersPage() {
  const searchParams = useSearchParams()
  const urlType = searchParams.get('type') as 'professional' | 'individual' | null

  const [searchQuery, setSearchQuery] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Pour cette page, on force toujours le type professional si l'URL l'indique
  const currentCustomerType = urlType === 'professional' ? 'professional' : (urlType === 'individual' ? 'individual' : undefined)

  // Utiliser useMemo pour stabiliser l'objet filters et éviter la boucle infinie
  const filters = useMemo(() => ({
    type: 'customer' as const,
    customer_type: currentCustomerType as 'all' | 'professional' | 'individual',
    is_active: showActiveOnly ? true : undefined,
    search: searchQuery || undefined
  }), [currentCustomerType, showActiveOnly, searchQuery])

  const {
    organisations: customers,
    loading,
    error,
    toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useOrganisations(filters)


  // Les clients sont déjà filtrés par le hook selon customer_type
  const filteredCustomers = customers

  // Calculer les statistiques basées sur les clients filtrés de la page actuelle
  const stats: CustomerStats = {
    totalCustomers: filteredCustomers.length,
    professionalCustomers: filteredCustomers.filter(customer =>
      !customer.customer_type || customer.customer_type === 'professional'
    ).length,
    activeCustomers: filteredCustomers.filter(c => c.is_active).length,
    averageOrderValue: 0, // À calculer avec les commandes
    totalRevenue: 0 // À calculer avec les commandes
  }

  const getCustomerTypeInfo = (type: string) => {
    switch (type) {
      case 'professional':
        return {
          icon: <Building2 className="h-4 w-4" />,
          label: 'Professionnel',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'individual':
        return {
          icon: <User className="h-4 w-4" />,
          label: 'Particulier',
          color: 'bg-green-50 text-green-700 border-green-200'
        }
      default:
        return {
          icon: <User className="h-4 w-4" />,
          label: 'Client',
          color: 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }
  }

  const handleArchive = async (customer: any) => {
    if (!customer.archived_at) {
      // Archiver
      const success = await archiveOrganisation(customer.id)
      if (success) {
        console.log('✅ Client archivé avec succès')
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(customer.id)
      if (success) {
        console.log('✅ Client restauré avec succès')
      }
    }
  }

  const handleDelete = async (customer: any) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${customer.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(customer.id)
      if (success) {
        console.log('✅ Client supprimé définitivement')
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Organisations
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-black">
            {urlType === 'professional' ? 'Clients Professionnels' :
             urlType === 'individual' ? 'Clients Particuliers' : 'Clients'}
          </h1>
          <p className="text-gray-600 mt-2">
            {urlType === 'professional' ? 'Gestion des clients professionnels B2B' :
             urlType === 'individual' ? 'Gestion des clients particuliers B2C' :
             'Gestion de tous les clients'}
          </p>
          {urlType && (
            <div className="mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Filtré: {urlType === 'professional' ? 'Professionnels uniquement' : 'Particuliers uniquement'}
              </Badge>
            </div>
          )}
        </div>
        <Button
          className="bg-black text-white hover:bg-gray-800"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{stats.totalCustomers}</div>
            <p className="text-sm text-gray-600">Total clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.activeCustomers}
            </div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.professionalCustomers}
            </div>
            <p className="text-sm text-gray-600">Professionnels</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showActiveOnly ? 'default' : 'outline'}
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showActiveOnly ? 'Actifs uniquement' : 'Tous'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredCustomers.map((customer) => {
            const typeInfo = getCustomerTypeInfo(customer.customer_type || 'individual')

            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow" data-testid="customer-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-black flex items-center gap-2" data-testid="customer-name">
                        {typeInfo.icon}
                        {customer.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        ID: {customer.id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={customer.is_active ? 'default' : 'secondary'}
                        className={customer.is_active ? 'bg-green-100 text-green-800' : ''}
                      >
                        {customer.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                      {customer.archived_at && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                          Archivé
                        </Badge>
                      )}
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    {(customer.city || customer.country) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {[customer.city, customer.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <div className="flex gap-2 flex-wrap">
                      {/* 1. Archiver/Restaurer */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(customer)}
                        className={`flex-1 min-w-0 ${customer.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                      >
                        {customer.archived_at ? (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-1" />
                            Restaurer
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-1" />
                            Archiver
                          </>
                        )}
                      </Button>

                      {/* 2. Supprimer */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>

                      {/* 3. Voir détails */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-0"
                        data-testid="customer-actions"
                        asChild
                      >
                        <Link href={`/contacts-organisations/customers/${customer.id}`}>
                          Voir détails
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucun client trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Commencez par créer votre premier client.'
              }
            </p>
            <Button
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer Form Modal - Professional or Individual based on URL type */}
      {urlType === 'individual' ? (
        <IndividualCustomerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCustomerCreated={() => {
            setIsModalOpen(false)
            refetch()
          }}
        />
      ) : (
        <CustomerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCustomerCreated={() => {
            setIsModalOpen(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}