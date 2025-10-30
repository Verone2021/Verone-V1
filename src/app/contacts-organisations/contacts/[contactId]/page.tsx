'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Trash2,
  MessageCircle,
  Clock,
  Archive,
  ArchiveRestore,
  Star,
  Users,
  Calculator,
  Wrench
} from 'lucide-react'
import { useContacts, type Contact } from '@/hooks/use-contacts'
import { getOrganisationDisplayName, type Organisation } from '@/hooks/use-organisations'
import { ContactPersonalEditSection } from '@/components/business/contact-personal-edit-section'
import { ContactDetailsEditSection } from '@/components/business/contact-details-edit-section'
import { ContactRolesEditSection } from '@/components/business/contact-roles-edit-section'
import { ContactPreferencesEditSection } from '@/components/business/contact-preferences-edit-section'

export default function ContactDetailPage() {
  const { contactId } = useParams()
  const router = useRouter()

  const {
    currentContact,
    loading,
    fetchContact,
    deactivateContact,
    activateContact,
    getContactFullName,
    setCurrentContact
  } = useContacts()

  // Charger le contact au montage
  useEffect(() => {
    if (contactId) {
      fetchContact(contactId as string)
    }
  }, [contactId, fetchContact])

  // Gestionnaire de mise à jour du contact
  const handleContactUpdate = (updatedData: Partial<Contact>) => {
    if (currentContact) {
      const updatedContact = { ...currentContact, ...updatedData }
      setCurrentContact(updatedContact)
      // Rafraîchir les données depuis la base
      fetchContact(currentContact.id)
    }
  }

  const handleToggleActive = async () => {
    if (!currentContact) return

    const action = currentContact.is_active ? 'désactiver' : 'réactiver'
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir ${action} le contact "${getContactFullName(currentContact)}" ?`
    )

    if (confirmed) {
      try {
        if (currentContact.is_active) {
          await deactivateContact(currentContact.id)
        } else {
          await activateContact(currentContact.id)
        }
        await fetchContact(currentContact.id)
      } catch (error) {
        console.error(`Erreur lors de ${action}:`, error)
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

  const getContactTypeBadges = (contact: Contact) => {
    const badges = []

    if (contact.is_primary_contact) {
      badges.push(
        <Badge key="primary" variant="secondary" className="bg-gray-100 text-gray-900 border-gray-200">
          <Star className="h-3 w-3 mr-1" />
          Principal
        </Badge>
      )
    }
    if (contact.is_commercial_contact) {
      badges.push(
        <Badge key="commercial" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          Commercial
        </Badge>
      )
    }
    if (contact.is_billing_contact) {
      badges.push(
        <Badge key="billing" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Calculator className="h-3 w-3 mr-1" />
          Facturation
        </Badge>
      )
    }
    if (contact.is_technical_contact) {
      badges.push(
        <Badge key="technical" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Wrench className="h-3 w-3 mr-1" />
          Technique
        </Badge>
      )
    }

    return badges
  }

  const getOrganisationTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'Fournisseur'
      case 'customer': return 'Client'
      case 'professional': return 'Client professionnel'
      case 'provider': return 'Prestataire'
      default: return type
    }
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

  if (!currentContact) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Contact introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              Ce contact n'existe pas ou vous n'avez pas les droits pour le consulter.
            </p>
            <ButtonV2 onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ButtonV2 variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </ButtonV2>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-semibold text-black">
              {getContactFullName(currentContact)}
            </h1>
            <div className="flex gap-1 flex-wrap">
              {getContactTypeBadges(currentContact)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4" />
            <span>
              {currentContact.organisation && getOrganisationDisplayName(currentContact.organisation as Organisation)} • {getOrganisationTypeLabel(currentContact.organisation?.type || '')}
            </span>
            {currentContact.title && (
              <>
                <span>•</span>
                <span>{currentContact.title}</span>
              </>
            )}
            <span>• ID: {currentContact.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <ButtonV2
            variant="outline"
            onClick={handleToggleActive}
            className={currentContact.is_active ? "text-black border-gray-200 hover:bg-gray-50" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
          >
            {currentContact.is_active ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Désactiver
              </>
            ) : (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Réactiver
              </>
            )}
          </ButtonV2>
        </div>
      </div>

      {/* Layout en 2 colonnes avec composants EditSection */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne principale - Sections éditables */}
        <div className="xl:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <ContactPersonalEditSection
            contact={currentContact}
            onUpdate={handleContactUpdate}
          />

          {/* Coordonnées */}
          <ContactDetailsEditSection
            contact={currentContact}
            onUpdate={handleContactUpdate}
          />

          {/* Préférences de communication */}
          <ContactPreferencesEditSection
            contact={currentContact}
            onUpdate={handleContactUpdate}
          />
        </div>

        {/* Colonne latérale - Informations statiques */}
        <div className="space-y-6">
          {/* Rôles et responsabilités */}
          <ContactRolesEditSection
            contact={currentContact}
            onUpdate={handleContactUpdate}
          />

          {/* Organisation */}
          {currentContact.organisation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-black opacity-70">Nom:</span>
                  <div className="text-lg font-semibold text-black">
                    <Link
                      href={`/contacts-organisations/${currentContact.organisation.type === 'supplier' ? 'suppliers' : 'customers'}/${currentContact.organisation_id}`}
                      className="hover:underline hover:text-blue-600"
                    >
                      {getOrganisationDisplayName(currentContact.organisation as Organisation)}
                    </Link>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-black opacity-70">Type:</span>
                  <div className="text-sm text-black">{getOrganisationTypeLabel(currentContact.organisation.type)}</div>
                </div>
                {currentContact.organisation.customer_type && (
                  <div>
                    <span className="text-sm text-black opacity-70">Catégorie client:</span>
                    <div className="text-sm text-black capitalize">{currentContact.organisation.customer_type}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Créé le:</span>
                <span className="text-black">{formatDate(currentContact.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modifié le:</span>
                <span className="text-black">{formatDate(currentContact.updated_at)}</span>
              </div>
              {currentContact.last_contact_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernier contact:</span>
                  <span className="text-black">{formatDate(currentContact.last_contact_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge variant={currentContact.is_active ? 'secondary' : 'secondary'} className={currentContact.is_active ? 'bg-green-100 text-green-800' : ''}>
                  {currentContact.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {currentContact.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{currentContact.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}