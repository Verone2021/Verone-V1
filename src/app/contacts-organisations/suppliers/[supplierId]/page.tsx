'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  Archive,
  ArchiveRestore,
  Trash2,
  Package,
  Phone,
  ShoppingCart,
  FileText,
  Users
} from 'lucide-react'
import { useOrganisation, useSuppliers } from '@/hooks/use-organisations'
import { useContacts } from '@/hooks/use-contacts'
import { ContactEditSection } from '@/components/business/contact-edit-section'
import { AddressEditSection } from '@/components/business/address-edit-section'
import { CommercialEditSection } from '@/components/business/commercial-edit-section'
import { PerformanceEditSection } from '@/components/business/performance-edit-section'
import { ContactsManagementSection } from '@/components/business/contacts-management-section'
import { TabsNavigation, TabContent } from '@/components/ui/tabs-navigation'
import type { Organisation } from '@/hooks/use-organisations'

export default function SupplierDetailPage() {
  const { supplierId } = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('contacts')

  const { organisation: supplier, loading, error } = useOrganisation(supplierId as string)
  const {
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useSuppliers()

  // Hook pour compter les contacts
  const { contacts, fetchOrganisationContacts } = useContacts()
  const [contactCount, setContactCount] = useState(0)

  // Mettre à jour le nombre de contacts
  useEffect(() => {
    if (supplier?.id) {
      fetchOrganisationContacts(supplier.id).then(() => {
        const orgContacts = contacts.filter(contact => contact.organisation_id === supplier.id)
        setContactCount(orgContacts.length)
      })
    }
  }, [supplier?.id, contacts, fetchOrganisationContacts])

  // Gestionnaire de mise à jour des données fournisseur
  const handleSupplierUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    // Nous n'avons besoin que de rafraîchir pour obtenir les dernières données
    refetch()
    // Rafraîchir aussi le nombre de contacts si nécessaire
    if (supplier?.id) {
      fetchOrganisationContacts(supplier.id)
    }
  }

  // Configuration des onglets
  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: contactCount.toString()
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="h-4 w-4" />,
      disabled: true // TODO: Activer quand le module sera développé
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: true // TODO: Activer quand le module sera développé
    },
    {
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: supplier?.stats?.products_count || '0'
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Fournisseur introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce fournisseur n'existe pas ou vous n'avez pas les droits pour le consulter.
            </p>
            <Button asChild>
              <Link href="/contacts-organisations/suppliers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux fournisseurs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleArchive = async () => {
    if (!supplier.archived_at) {
      // Archiver
      const success = await archiveOrganisation(supplier.id)
      if (success) {
        console.log('✅ Fournisseur archivé avec succès')
        refetch()
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(supplier.id)
      if (success) {
        console.log('✅ Fournisseur restauré avec succès')
        refetch()
      }
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${supplier.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(supplier.id)
      if (success) {
        console.log('✅ Fournisseur supprimé définitivement')
        router.push('/contacts-organisations/suppliers')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/suppliers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Fournisseurs
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-semibold text-black">{supplier.name}</h1>
            <div className="flex gap-2">
              <Badge
                variant={supplier.is_active ? 'default' : 'secondary'}
                className={supplier.is_active ? 'bg-green-100 text-green-800' : ''}
              >
                {supplier.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {supplier.archived_at && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Archivé
                </Badge>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Fournisseur • {supplier.supplier_segment && `${supplier.supplier_segment} • `}ID: {supplier.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleArchive}
            className={supplier.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}
          >
            {supplier.archived_at ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restaurer
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Layout en 2 colonnes avec composants EditSection */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne principale - Informations éditables */}
        <div className="xl:col-span-2 space-y-6">
          {/* Informations de Contact */}
          <ContactEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Adresse */}
          <AddressEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Conditions Commerciales */}
          <CommercialEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />
        </div>

        {/* Colonne latérale - Performance et Statistiques */}
        <div className="space-y-6">
          {/* Performance & Qualité */}
          <PerformanceEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Statistiques (lecture seule) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Produits référencés:</span>
                <span className="text-2xl font-bold text-black">
                  {supplier._count?.products || 0}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Créé le:</span>
                  <span>{formatDate(supplier.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modifié le:</span>
                  <span>{formatDate(supplier.updated_at)}</span>
                </div>
                {supplier.supplier_segment && (
                  <div className="flex justify-between">
                    <span>Segment:</span>
                    <span className="font-medium">{supplier.supplier_segment}</span>
                  </div>
                )}
                {supplier.supplier_category && (
                  <div className="flex justify-between">
                    <span>Catégorie:</span>
                    <span className="font-medium">{supplier.supplier_category}</span>
                  </div>
                )}
                {supplier.industry_sector && (
                  <div className="flex justify-between">
                    <span>Secteur:</span>
                    <span className="font-medium">{supplier.industry_sector}</span>
                  </div>
                )}
              </div>

              {supplier.archived_at && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Archivé le:</span>
                    <span className="text-red-600 font-medium">{formatDate(supplier.archived_at)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section avec onglets - Modules business */}
      <div className="mt-8">
        <TabsNavigation
          tabs={tabs}
          defaultTab="contacts"
          onTabChange={setActiveTab}
        />

        <TabContent activeTab={activeTab} tabId="contacts">
          <ContactsManagementSection
            organisationId={supplier.id}
            organisationName={supplier.name}
            organisationType="supplier"
            onUpdate={handleSupplierUpdate}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="orders">
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Module Commandes
            </h3>
            <p className="text-gray-600">
              Ce module sera disponible dans une prochaine version.
            </p>
          </div>
        </TabContent>

        <TabContent activeTab={activeTab} tabId="invoices">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Module Factures
            </h3>
            <p className="text-gray-600">
              Ce module sera disponible dans une prochaine version.
            </p>
          </div>
        </TabContent>

        <TabContent activeTab={activeTab} tabId="products">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Produits Fournisseur
            </h3>
            <p className="text-gray-600">
              {supplier._count?.products || 0} produit(s) référencé(s) pour ce fournisseur.
            </p>
          </div>
        </TabContent>
      </div>

    </div>
  )
}