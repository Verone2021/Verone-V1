'use client'

import { useState } from 'react'
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
  ShoppingCart,
  Users
} from 'lucide-react'
import { useOrganisation, useOrganisations } from '@/hooks/use-organisations'
import { ContactEditSection } from '@/components/business/contact-edit-section'
import { AddressEditSection } from '@/components/business/address-edit-section'
import { CommercialEditSection } from '@/components/business/commercial-edit-section'
import { PerformanceEditSection } from '@/components/business/performance-edit-section'
import { ContactsManagementSection } from '@/components/business/contacts-management-section'
import type { Organisation } from '@/hooks/use-organisations'

export default function CustomerDetailPage() {
  const { customerId } = useParams()
  const router = useRouter()

  const { organisation: customer, loading, error } = useOrganisation(customerId as string)
  const {
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    refetch
  } = useOrganisations({ type: 'customer' })

  // Gestionnaire de mise à jour des données client
  const handleCustomerUpdate = (updatedData: Partial<Organisation>) => {
    // Les données sont automatiquement mises à jour par le hook useInlineEdit
    // Nous n'avons besoin que de rafraîchir pour obtenir les dernières données
    refetch()
  }

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

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Client introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce client n'existe pas ou vous n'avez pas les droits pour le consulter.
            </p>
            <Button asChild>
              <Link href="/contacts-organisations/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux clients
              </Link>
            </Button>
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

  const handleDelete = async () => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${customer.name}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      const success = await hardDeleteOrganisation(customer.id)
      if (success) {
        console.log('✅ Client supprimé définitivement')
        router.push('/contacts-organisations/customers')
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

  const getCustomerTypeInfo = (type?: string | null) => {
    switch (type) {
      case 'professional':
        return {
          icon: <Building2 className="h-4 w-4" />,
          label: 'Client Professionnel',
          description: 'Entreprise • B2B'
        }
      case 'individual':
        return {
          icon: <Users className="h-4 w-4" />,
          label: 'Client Particulier',
          description: 'Particulier • B2C'
        }
      default:
        return {
          icon: <Building2 className="h-4 w-4" />,
          label: 'Client',
          description: 'Type non défini'
        }
    }
  }

  const customerTypeInfo = getCustomerTypeInfo(customer.customer_type)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations/customers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Clients
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            {customerTypeInfo.icon}
            <h1 className="text-3xl font-semibold text-black">{customer.name}</h1>
            <div className="flex gap-2">
              <Badge
                variant={customer.is_active ? 'default' : 'secondary'}
                className={customer.is_active ? 'bg-green-100 text-green-800' : ''}
              >
                {customer.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {customer.archived_at && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Archivé
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {customerTypeInfo.label}
              </Badge>
            </div>
          </div>
          <p className="text-gray-600">
            {customerTypeInfo.description} • ID: {customer.id.slice(0, 8)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
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

        {/* Colonne latérale - Performance et Statistiques */}
        <div className="space-y-6">
          {/* Performance & Qualité - Uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <PerformanceEditSection
              organisation={customer}
              onUpdate={handleCustomerUpdate}
            />
          )}

          {/* Statistiques (lecture seule) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Type de client:</span>
                  <span className="font-medium">{customerTypeInfo.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créé le:</span>
                  <span>{formatDate(customer.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modifié le:</span>
                  <span>{formatDate(customer.updated_at)}</span>
                </div>
                {customer.legal_form && (
                  <div className="flex justify-between">
                    <span>Forme juridique:</span>
                    <span className="font-medium">{customer.legal_form}</span>
                  </div>
                )}
                {customer.siret && (
                  <div className="flex justify-between">
                    <span>SIRET:</span>
                    <span className="font-medium">{customer.siret}</span>
                  </div>
                )}
                {customer.vat_number && (
                  <div className="flex justify-between">
                    <span>N° TVA:</span>
                    <span className="font-medium">{customer.vat_number}</span>
                  </div>
                )}
                {customer.payment_terms && (
                  <div className="flex justify-between">
                    <span>Conditions paiement:</span>
                    <span className="font-medium">{customer.payment_terms} jours</span>
                  </div>
                )}
                {customer.currency && customer.currency !== 'EUR' && (
                  <div className="flex justify-between">
                    <span>Devise:</span>
                    <span className="font-medium">{customer.currency}</span>
                  </div>
                )}
              </div>

              {customer.archived_at && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Archivé le:</span>
                    <span className="text-red-600 font-medium">{formatDate(customer.archived_at)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Gestion des Contacts - uniquement pour les clients professionnels */}
          {customer.customer_type === 'professional' && (
            <ContactsManagementSection
              organisationId={customer.id}
              organisationName={customer.name}
              organisationType="customer"
              onUpdate={() => handleCustomerUpdate({})}
            />
          )}
        </div>
      </div>

    </div>
  )
}