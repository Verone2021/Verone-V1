'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Phone,
  Mail,
  Edit,
  Trash2,
  UserCheck,
  Users,
  Building2,
  Star,
  StarOff,
  ExternalLink,
  Eye
} from 'lucide-react'
import { useContacts, type Contact } from '@/hooks/use-contacts'
import { ContactFormModal } from './contact-form-modal'

interface ContactsManagementSectionProps {
  organisationId: string
  organisationName: string
  organisationType: 'supplier' | 'customer'
  onUpdate?: () => void
}

export function ContactsManagementSection({
  organisationId,
  organisationName,
  organisationType,
  onUpdate
}: ContactsManagementSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const {
    loading,
    contacts,
    fetchOrganisationContacts,
    createContact,
    updateContact,
    deactivateContact,
    setPrimaryContact,
    getContactFullName,
    getContactRoles
  } = useContacts()

  // Charger les contacts à l'initialisation
  useEffect(() => {
    loadContacts()
  }, [organisationId])

  // Filtrer les contacts de cette organisation
  const organisationContacts = useMemo(() => {
    return contacts.filter(contact => contact.organisation_id === organisationId)
  }, [contacts, organisationId])

  const loadContacts = async () => {
    try {
      await fetchOrganisationContacts(organisationId)
    } catch (error: any) {
      console.error('Erreur lors du chargement des contacts:', error)
    }
  }

  const handleCreateContact = () => {
    setEditingContact(null)
    setIsModalOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleContactSaved = async (contactData: any) => {
    try {
      console.log('🔄 ContactsManagementSection - Sauvegarde contact:', {
        organisationId,
        organisationName,
        organisationType,
        contactData,
        editingContact: editingContact?.id
      })

      if (editingContact) {
        // Mise à jour
        await updateContact(editingContact.id, contactData)
      } else {
        // Création avec association automatique
        const fullContactData = {
          ...contactData,
          organisation_id: organisationId
        }
        console.log('📝 Données finales pour création:', fullContactData)
        await createContact(fullContactData)
      }

      setIsModalOpen(false)
      setEditingContact(null)
      await loadContacts()
      onUpdate?.()
    } catch (error: any) {
      console.error('❌ ERREUR SAUVEGARDE CONTACT - ContactsManagementSection:')
      console.error('Error object:', error)
      console.error('Error string:', String(error))
      console.error('Error message:', error?.message)
      console.error('OrganisationId:', organisationId)
      console.error('ContactData received:', contactData)

      try {
        console.error('Error JSON:', JSON.stringify(error, null, 2))
      } catch (e) {
        console.error('Cannot stringify error:', e)
      }
    }
  }

  const handleDeleteContact = async (contact: Contact) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer le contact "${getContactFullName(contact)}" ?\n\nCette action peut être annulée en réactivant le contact.`
    )

    if (confirmed) {
      try {
        await deactivateContact(contact.id)
        await loadContacts()
        onUpdate?.()
      } catch (error: any) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleSetPrimary = async (contact: Contact) => {
    try {
      await setPrimaryContact(contact.id)
      await loadContacts()
      onUpdate?.()
    } catch (error: any) {
      console.error('Erreur lors de la définition du contact principal:', error)
    }
  }

  const getContactTypeIcon = (contact: Contact) => {
    if (contact.is_primary_contact) {
      return <Star className="h-4 w-4 text-gray-700" />
    }
    return <Users className="h-4 w-4 text-gray-400" />
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
          Commercial
        </Badge>
      )
    }
    if (contact.is_billing_contact) {
      badges.push(
        <Badge key="billing" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Facturation
        </Badge>
      )
    }
    if (contact.is_technical_contact) {
      badges.push(
        <Badge key="technical" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          Technique
        </Badge>
      )
    }

    return badges
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contacts
              </CardTitle>
              <CardDescription>
                Gestion des contacts pour {organisationName}
                {organisationContacts.length > 0 && ` • ${organisationContacts.length} contact${organisationContacts.length > 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            <ButtonV2 onClick={handleCreateContact}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau contact
            </ButtonV2>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : organisationContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                Aucun contact
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer le premier contact pour cette organisation.
              </p>
              <ButtonV2 onClick={handleCreateContact}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier contact
              </ButtonV2>
            </div>
          ) : (
            <div className="space-y-4">
              {organisationContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getContactTypeIcon(contact)}
                        <Link
                          href={`/contacts-organisations/contacts/${contact.id}`}
                          className="hover:underline"
                        >
                          <h4 className="font-medium text-black hover:text-blue-600 transition-colors">
                            {getContactFullName(contact)}
                          </h4>
                        </Link>
                        <Link
                          href={`/contacts-organisations/contacts/${contact.id}`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <div className="flex gap-1 flex-wrap">
                          {getContactTypeBadges(contact)}
                        </div>
                      </div>

                      {contact.title && (
                        <p className="text-sm text-gray-600 mb-2">
                          {contact.title}
                          {contact.department && ` • ${contact.department}`}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{contact.mobile} (mobile)</span>
                          </div>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {!contact.is_primary_contact && (
                        <ButtonV2
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(contact)}
                          className="text-gray-700 border-gray-200 hover:bg-gray-50"
                          title="Définir comme contact principal"
                        >
                          <StarOff className="h-4 w-4" />
                        </ButtonV2>
                      )}
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        asChild
                        title="Voir le détail du contact"
                      >
                        <Link href={`/contacts-organisations/contacts/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </ButtonV2>
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContact(contact)}
                        title="Modifier le contact"
                      >
                        <Edit className="h-4 w-4" />
                      </ButtonV2>
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContact(contact)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        title="Supprimer le contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <ContactFormModal
        {...({
          isOpen: isModalOpen,
          onClose: () => {
            setIsModalOpen(false)
            setEditingContact(null)
          },
          onSave: handleContactSaved,
          contact: (editingContact ?? undefined) as any,
          organisationId: organisationId,
          organisationName: organisationName
        } as any)}
      />
    </>
  )
}