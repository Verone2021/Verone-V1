'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Building2,
  Archive,
  ArchiveRestore,
  Package,
  Phone,
  ShoppingCart,
  FileText
} from 'lucide-react'
import { useOrganisation, useSuppliers } from '@/hooks/use-organisations'
import { useOrganisationTabs } from '@/hooks/use-organisation-tabs'
import { ContactEditSection } from '@/components/business/contact-edit-section'
import { AddressEditSection } from '@/components/business/address-edit-section'
import { CommercialEditSection } from '@/components/business/commercial-edit-section'
import { PerformanceEditSection } from '@/components/business/performance-edit-section'
import { ContactsManagementSection } from '@/components/business/contacts-management-section'
import { OrganisationLogoCard } from '@/components/business/organisation-logo-card'
import { OrganisationStatsCard } from '@/components/business/organisation-stats-card'
import { OrganisationPurchaseOrdersSection } from '@/components/business/organisation-purchase-orders-section'
import { OrganisationProductsSection } from '@/components/business/organisation-products-section'
import { TabsNavigation, TabContent } from '@/components/ui/tabs-navigation'
import type { Organisation } from '@/hooks/use-organisations'

export default function SupplierDetailPage() {
  const { supplierId } = useParams()
  const [activeTab, setActiveTab] = useState('contacts')

  const { organisation: supplier, loading, error } = useOrganisation(supplierId as string)
  const {
    archiveOrganisation,
    unarchiveOrganisation,
    refetch
  } = useSuppliers()

  // Hook centralisé pour les compteurs d'onglets
  const { counts, refreshCounts } = useOrganisationTabs({
    organisationId: supplierId as string,
    organisationType: 'supplier'
  })

  // Gestionnaire de mise à jour des données fournisseur
  const handleSupplierUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    refetch()
    // Rafraîchir les compteurs
    refreshCounts()
  }

  // Configuration des onglets avec compteurs du hook
  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: counts.contacts.toString()
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="h-4 w-4" />,
      badge: counts.orders.toString()
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: true // Module en développement
    },
    {
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: counts.products.toString()
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
            <ButtonV2 asChild>
              <Link href="/contacts-organisations/suppliers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux fournisseurs
              </Link>
            </ButtonV2>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/suppliers">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Fournisseurs
              </ButtonV2>
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
          <ButtonV2
            variant="outline"
            onClick={handleArchive}
            className={supplier.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-black border-gray-200 hover:bg-gray-50"}
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
          </ButtonV2>
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

        {/* Colonne latérale - Logo, Performance et Statistiques */}
        <div className="space-y-6">
          {/* Logo de l'organisation - Composant réutilisable */}
          <OrganisationLogoCard
            organisationId={supplier.id}
            organisationName={supplier.name}
            organisationType="supplier"
            currentLogoUrl={supplier.logo_url}
            onUploadSuccess={() => refetch()}
          />

          {/* Performance & Qualité */}
          <PerformanceEditSection
            organisation={supplier}
            onUpdate={handleSupplierUpdate}
          />

          {/* Statistiques - Composant réutilisable */}
          <OrganisationStatsCard
            organisation={supplier}
            organisationType="supplier"
          />
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
            onUpdate={() => handleSupplierUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="orders">
          <OrganisationPurchaseOrdersSection
            organisationId={supplier.id}
            organisationName={supplier.name}
            organisationType="supplier"
            onUpdate={() => handleSupplierUpdate({})}
          />
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
          <OrganisationProductsSection
            organisationId={supplier.id}
            organisationName={supplier.name}
            organisationType="supplier"
            onUpdate={() => handleSupplierUpdate({})}
          />
        </TabContent>
      </div>

    </div>
  )
}