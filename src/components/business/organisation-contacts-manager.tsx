"use client"

import { useState, useEffect } from 'react'
import { ButtonV2 } from '@/components/ui-v2/button'
import { Badge } from '@/components/ui/badge'
import { spacing, colors } from '@/lib/design-system'
import { Plus, Mail, Phone, User, Trash2, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ContactFormModal } from './contact-form-modal'

interface Contact {
  id: string
  organisation_id: string
  first_name: string
  last_name: string
  title: string | null
  department: string | null
  email: string
  phone: string | null
  mobile: string | null
  is_primary_contact: boolean
  is_billing_contact: boolean
  is_technical_contact: boolean
  is_commercial_contact: boolean
  is_active: boolean
}

interface OrganisationContactsManagerProps {
  organisationId?: string
  mode: 'create' | 'edit'
}

export function OrganisationContactsManager({
  organisationId,
  mode
}: OrganisationContactsManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    if (mode === 'edit' && organisationId) {
      loadContacts()
    }
  }, [mode, organisationId])

  const loadContacts = async () => {
    if (!organisationId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organisation_id', organisationId)
        .eq('is_active', true)
        .order('is_primary_contact', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (err) {
      console.error('Erreur chargement contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = () => {
    setSelectedContact(null)
    setIsModalOpen(true)
  }

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsModalOpen(true)
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Supprimer le contact ${contact.first_name} ${contact.last_name} ?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: false })
        .eq('id', contact.id)

      if (error) throw error
      console.log('✅ Contact supprimé avec succès')
      await loadContacts()
    } catch (err) {
      console.error('❌ Erreur suppression contact:', err)
      alert('Erreur lors de la suppression. Veuillez réessayer.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedContact(null)
  }

  const handleContactSuccess = async () => {
    await loadContacts()
    handleModalClose()
  }

  if (mode === 'create') {
    return (
      <div
        style={{
          padding: spacing[4],
          backgroundColor: colors.background.subtle,
          borderRadius: '8px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.border.DEFAULT
        }}
      >
        <p style={{ color: colors.text.subtle, fontSize: '0.875rem' }}>
          💡 Les contacts pourront être ajoutés après la création de l'organisation
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
        <div>
          <h4 style={{ color: colors.text.DEFAULT, fontWeight: 600, fontSize: '0.875rem' }}>
            Contacts ({contacts.length})
          </h4>
        </div>
        <ButtonV2
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={handleCreateContact}
        >
          Ajouter un contact
        </ButtonV2>
      </div>

      {loading ? (
        <div style={{ padding: spacing[4], textAlign: 'center', color: colors.text.subtle }}>
          Chargement des contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div
          style={{
            padding: spacing[6],
            backgroundColor: colors.background.subtle,
            borderRadius: '8px',
            textAlign: 'center',
            borderWidth: '1px',
            borderStyle: 'dashed',
            borderColor: colors.border.DEFAULT
          }}
        >
          <User className="h-8 w-8 mx-auto mb-2" style={{ color: colors.text.muted }} />
          <p style={{ color: colors.text.subtle, fontSize: '0.875rem' }}>
            Aucun contact pour cette organisation
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                padding: spacing[3],
                backgroundColor: colors.background.DEFAULT,
                borderRadius: '8px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: colors.border.DEFAULT,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span style={{ color: colors.text.DEFAULT, fontWeight: 600, fontSize: '0.875rem' }}>
                    {contact.first_name} {contact.last_name}
                  </span>
                  {contact.is_primary_contact && (
                    <Badge style={{ backgroundColor: colors.primary[100], color: colors.primary[700], fontSize: '0.75rem' }}>
                      Principal
                    </Badge>
                  )}
                </div>

                {contact.title && (
                  <div style={{ color: colors.text.subtle, fontSize: '0.75rem', marginBottom: spacing[1] }}>
                    {contact.title}
                    {contact.department && ` - ${contact.department}`}
                  </div>
                )}

                <div style={{ display: 'flex', gap: spacing[3], fontSize: '0.75rem', color: colors.text.subtle }}>
                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                      <Mail className="h-3 w-3" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: spacing[1], marginTop: spacing[2] }}>
                  {contact.is_commercial_contact && (
                    <Badge variant="outline" style={{ fontSize: '0.625rem' }}>Commercial</Badge>
                  )}
                  {contact.is_billing_contact && (
                    <Badge variant="outline" style={{ fontSize: '0.625rem' }}>Facturation</Badge>
                  )}
                  {contact.is_technical_contact && (
                    <Badge variant="outline" style={{ fontSize: '0.625rem' }}>Technique</Badge>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: spacing[1] }}>
                <ButtonV2
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleEditContact(contact)}
                />
                <ButtonV2
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteContact(contact)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Form Modal */}
      {organisationId && (
        <ContactFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          organisationId={organisationId}
          contact={selectedContact}
          onSuccess={handleContactSuccess}
        />
      )}
    </div>
  )
}
