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
import { useOrganisation, useOrganisations, getOrganisationDisplayName } from '@/hooks/use-organisations'
import { useOrganisationTabs } from '@/hooks/use-organisation-tabs'
import { LegalIdentityEditSection } from '@/components/business/legal-identity-edit-section'
import { ContactEditSection } from '@/components/business/contact-edit-section'
import { AddressEditSection } from '@/components/business/address-edit-section'
import { CommercialEditSection } from '@/components/business/commercial-edit-section'
import { PerformanceEditSection } from '@/components/business/performance-edit-section'
import { ContactsManagementSection } from '@/components/business/contacts-management-section'
import { OrganisationLogoCard } from '@/components/business/organisation-logo-card'
import { OrganisationStatsCard } from '@/components/business/organisation-stats-card'
import { OrganisationProductsSection } from '@/components/business/organisation-products-section'
import { TabsNavigation, TabContent } from '@/components/ui/tabs-navigation'
import { isModuleDeployed, getModulePhase } from '@/lib/deployed-modules'
import type { Organisation } from '@/hooks/use-organisations'

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const [activeTab, setActiveTab] = useState('contacts')

  const { organisation: customer, loading, error } = useOrganisation(customerId as string)
  const {
    archiveOrganisation,
    unarchiveOrganisation,
    refetch
  } = useOrganisations({ type: 'customer' })

  // Hook centralisé pour les compteurs d'onglets
  const { counts, refreshCounts } = useOrganisationTabs({
    organisationId: customerId as string,
    organisationType: 'customer'
  })

  // Gestionnaire de mise à jour des données client
  const handleCustomerUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    refetch()
    // Rafraîchir les compteurs
    refreshCounts()
  }

  // Configuration des onglets avec compteurs du hook + modules déployés
  const tabs = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Phone className="h-4 w-4" />,
      badge: counts.contacts.toString(),
      disabled: !isModuleDeployed('contacts')
    },
    {
      id: 'orders',
      label: 'Commandes',
      icon: <ShoppingCart className="h-4 w-4" />,
      disabled: !isModuleDeployed('sales_orders'),
      disabledBadge: getModulePhase('sales_orders')
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: <FileText className="h-4 w-4" />,
      disabled: !isModuleDeployed('invoices'),
      disabledBadge: getModulePhase('invoices')
    },
    {
      id: 'products',
      label: 'Produits',
      icon: <Package className="h-4 w-4" />,
      badge: counts.products.toString(),
      disabled: !isModuleDeployed('products'),
      disabledBadge: getModulePhase('products')
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
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

  if (error || !customer) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Client introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce client n'existe pas ou vous n'avez pas les droits pour le consulter.
            </p>
            <ButtonV2 asChild>
              <Link href="/contacts-organisations/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux clients
              </Link>
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleArchive = async () => {
    if (!customer.archived_at) {
      // Archiver
      const success = await archiveOrganisation(customer.id)
      if (success) {
        console.log('✅ Client archivé avec succès')
        refetch()
      }
    } else {
      // Restaurer
      const success = await unarchiveOrganisation(customer.id)
      if (success) {
        console.log('✅ Client restauré avec succès')
        refetch()
      }
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/customers">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Clients
              </ButtonV2>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-black" />
            <h1 className="text-lg font-semibold text-black">{getOrganisationDisplayName(customer)}</h1>
            <div className="flex gap-2">
              <Badge
                variant={customer.is_active ? 'default' : 'secondary'}
                className={customer.is_active ? 'bg-green-100 text-green-800' : ''}
              >
                {customer.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {customer.archived_at && (
                <Badge variant="danger" className="bg-red-100 text-red-800">
                  Archivé
                </Badge>
              )}
              {customer.customer_type && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {customer.customer_type === 'professional' ? 'Client Professionnel' : 'Client Particulier'}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Entreprise • {customer.customer_type === 'professional' ? 'B2B' : 'B2C'} • ID: {customer.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <ButtonV2
            variant="outline"
            onClick={handleArchive}
            className={customer.archived_at ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-black border-gray-200 hover:bg-gray-50"}
          >
            {customer.archived_at ? (
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Colonne principale - Informations éditables */}
        <div className="xl:col-span-2 space-y-4">
          {/* Identité Légale */}
          <LegalIdentityEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Informations de Contact */}
          <ContactEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Adresse */}
          <AddressEditSection
            organisation={customer}
            onUpdate={handleCustomerUpdate}
          />

          {/* Conditions Commerciales - Uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <CommercialEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
            />
          )}
        </div>

        {/* Colonne latérale - Logo, Performance et Statistiques */}
        <div className="space-y-4">
          {/* Logo de l'organisation - Composant réutilisable */}
          <OrganisationLogoCard
            organisationId={customer.id}
            organisationName={customer.legal_name}
            organisationType="customer"
            currentLogoUrl={customer.logo_url}
            onUploadSuccess={() => refetch()}
          />

          {/* Performance & Qualité - Uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <PerformanceEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
              organisationType="customer"
            />
          )}

          {/* Statistiques - Composant réutilisable */}
          <OrganisationStatsCard
            organisation={customer}
            organisationType="customer"
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
            organisationId={customer.id}
            organisationName={customer.name}
            organisationType="customer"
            onUpdate={() => handleCustomerUpdate({})}
          />
        </TabContent>

        <TabContent activeTab={activeTab} tabId="orders">
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Module Commandes Vente
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
          <OrganisationProductsSection
            organisationId={customer.id}
            organisationName={customer.name}
            organisationType="customer"
            onUpdate={() => handleCustomerUpdate({})}
          />
        </TabContent>
      </div>

    </div>
  )
}
