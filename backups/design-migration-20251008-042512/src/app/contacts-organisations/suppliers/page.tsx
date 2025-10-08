'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Building2,
  Mail,
  MapPin,
  Trash2,
  ArrowLeft,
  Filter,
  Archive,
  ArchiveRestore,
  Phone,
  Globe,
  FileText,
  Star,
  Package,
  Award,
  Banknote,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { useSuppliers } from '@/hooks/use-organisations'
import { SupplierFormModal } from '@/components/business/supplier-form-modal'

interface Supplier {
  id: string
  name: string
  email: string | null
  country: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string

  // Nouveaux champs de contact
  phone: string | null
  website: string | null
  secondary_email: string | null

  // Adresse complète
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  region: string | null

  // Identifiants légaux
  siret: string | null
  vat_number: string | null
  legal_form: string | null

  // Classification business
  industry_sector: string | null
  supplier_segment: string | null
  supplier_category: string | null

  // Informations commerciales
  payment_terms: string | null
  delivery_time_days: number | null
  minimum_order_amount: number | null
  currency: string | null

  // Performance et qualité
  rating: number | null
  certification_labels: string[] | null
  preferred_supplier: boolean | null
  notes: string | null

  _count?: {
    products: number
  }
}

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Utiliser useMemo pour stabiliser l'objet filters et éviter la boucle infinie
  const filters = useMemo(() => ({
    is_active: showActiveOnly ? true : undefined,
    search: searchQuery || undefined
  }), [showActiveOnly, searchQuery])

  const {
    organisations: suppliers,
    loading,
    error,
    toggleOrganisationStatus,
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

  const handleArchive = async (supplier: Supplier) => {
    if (!supplier.archived_at) {
      // Archiver
      const success = await archiveOrganisation(supplier.id)
      if (success) {
        console.log('✅ Fournisseur archivé avec succès')
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(supplier.id)
      if (success) {
        console.log('✅ Fournisseur restauré avec succès')
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
        console.log('✅ Fournisseur supprimé définitivement')
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
          <h1 className="text-3xl font-semibold text-black">Fournisseurs</h1>
          <p className="text-gray-600 mt-2">
            Gestion des fournisseurs et partenaires commerciaux
          </p>
        </div>
        <Button
          className="bg-black text-white hover:bg-gray-800"
          onClick={handleCreateSupplier}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Fournisseur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">{suppliers.length}</div>
            <p className="text-sm text-gray-600">Total fournisseurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.is_active).length}
            </div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {suppliers.reduce((sum, s) => sum + (s._count?.products || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Produits individuels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              {suppliers.filter(s => s.email || s.phone).length}
            </div>
            <p className="text-sm text-gray-600">Avec contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-black">
              {suppliers.filter(s => s.preferred_supplier).length}
            </div>
            <p className="text-sm text-gray-600">Privilégiés</p>
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

      {/* Suppliers List */}
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
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow" data-testid="supplier-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-black flex items-center gap-2" data-testid="supplier-name">
                      <Building2 className="h-5 w-5" />
                      {supplier.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ID: {supplier.id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={supplier.is_active ? 'default' : 'secondary'}
                      className={supplier.is_active ? 'bg-green-100 text-green-800' : ''}
                    >
                      {supplier.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    {supplier.archived_at && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                        Archivé
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {supplier.phone}
                    </div>
                  )}

                  {supplier.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:underline truncate"
                      >
                        Site web
                      </a>
                    </div>
                  )}
                </div>

                {/* Location & Legal */}
                <div className="space-y-2">
                  {(supplier.city || supplier.country) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {supplier.siret && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>SIRET: {supplier.siret}</span>
                    </div>
                  )}
                </div>

                {/* Performance indicators */}
                <div className="flex flex-wrap gap-2">
                  {supplier.preferred_supplier && (
                    <Badge variant="default" className="bg-black text-white text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Privilégié
                    </Badge>
                  )}

                  {supplier.rating && supplier.rating > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {supplier.rating}/5
                    </Badge>
                  )}

                  {supplier.supplier_segment && (
                    <Badge variant="outline" className="text-xs">
                      {supplier.supplier_segment}
                    </Badge>
                  )}

                  {supplier.certification_labels && supplier.certification_labels.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {supplier.certification_labels.length} certif.
                    </Badge>
                  )}
                </div>

                {/* Commercial Info */}
                {(supplier.payment_terms || supplier.delivery_time_days || supplier.minimum_order_amount) && (
                  <div className="space-y-2 text-xs text-gray-600">
                    {supplier.payment_terms && (
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3 w-3" />
                        <span>Paiement: {supplier.payment_terms}</span>
                      </div>
                    )}

                    {supplier.delivery_time_days && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3" />
                        <span>Livraison: {supplier.delivery_time_days} jours</span>
                      </div>
                    )}

                    {supplier.minimum_order_amount && (
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>Commande min: {supplier.minimum_order_amount}€</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="border-t pt-4">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produits:</span>
                      <span className="font-medium text-black">
                        {supplier._count?.products || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="flex gap-2 flex-wrap">
                    {/* 1. Archiver/Restaurer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(supplier)}
                      className={`flex-1 min-w-0 ${supplier.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                    >
                      {supplier.archived_at ? (
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
                      onClick={() => handleDelete(supplier)}
                      className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>

                    {/* 3. Voir détails */}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-1 min-w-0"
                      data-testid="supplier-actions"
                    >
                      <Link href={`/contacts-organisations/suppliers/${supplier.id}`}>
                        Voir détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {suppliers.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucun fournisseur trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Aucun fournisseur ne correspond à votre recherche.'
                : 'Commencez par créer votre premier fournisseur.'
              }
            </p>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={handleCreateSupplier}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un fournisseur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        supplier={selectedSupplier as any}
        onSuccess={handleSupplierSuccess}
      />
    </div>
  )
}