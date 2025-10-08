'use client'

import { Phone, Mail, Save, X, Edit } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import type { Contact } from '../../hooks/use-contacts'

interface ContactDetailsEditSectionProps {
  contact: Contact
  onUpdate: (updatedContact: Partial<Contact>) => void
  className?: string
}

export function ContactDetailsEditSection({ contact, onUpdate, className }: ContactDetailsEditSectionProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges
  } = useInlineEdit({
    contactId: contact.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour coordonnées:', error)
    }
  })

  const section: EditableSection = 'contact'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      secondary_email: contact.secondary_email || '',
      direct_line: contact.direct_line || ''
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Coordonnées mises à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: string) => {
    // Nettoyage automatique des emails
    let processedValue = value.trim()

    if (field === 'email' || field === 'secondary_email') {
      processedValue = processedValue.toLowerCase()
    }

    // Convertir les chaînes vides en null pour respecter les contraintes DB
    updateEditedData(section, { [field]: processedValue || null })
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Coordonnées
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email principal */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email principal *
            </label>
            <input
              type="email"
              value={editData?.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="contact@email.com"
              required
            />
          </div>

          {/* Email secondaire */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email secondaire
            </label>
            <input
              type="email"
              value={editData?.secondary_email || ''}
              onChange={(e) => handleFieldChange('secondary_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="contact.alternatif@email.com"
            />
            <div className="text-xs text-gray-500 mt-1">
              Email alternatif pour les communications
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={editData?.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Mobile
              </label>
              <input
                type="tel"
                value={editData?.mobile || ''}
                onChange={(e) => handleFieldChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Ligne directe */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Ligne directe
            </label>
            <input
              type="tel"
              value={editData?.direct_line || ''}
              onChange={(e) => handleFieldChange('direct_line', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="+33 1 23 45 67 89 (poste 123)"
            />
            <div className="text-xs text-gray-500 mt-1">
              Numéro direct ou ligne avec extension
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    )
  }

  // Mode affichage
  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          Coordonnées
        </h3>
        <Button variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm text-black opacity-70 flex items-center">
            <Mail className="h-3 w-3 mr-1" />
            Email principal:
          </span>
          <div className="text-sm text-blue-600">
            <a href={`mailto:${contact.email}`} className="hover:underline">
              {contact.email}
            </a>
          </div>
        </div>

        {contact.secondary_email && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              Email secondaire:
            </span>
            <div className="text-sm text-blue-600">
              <a href={`mailto:${contact.secondary_email}`} className="hover:underline">
                {contact.secondary_email}
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contact.phone && (
            <div>
              <span className="text-sm text-black opacity-70 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                Téléphone:
              </span>
              <div className="text-sm text-black">
                <a href={`tel:${contact.phone}`} className="hover:underline">
                  {contact.phone}
                </a>
              </div>
            </div>
          )}

          {contact.mobile && (
            <div>
              <span className="text-sm text-black opacity-70 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                Mobile:
              </span>
              <div className="text-sm text-black">
                <a href={`tel:${contact.mobile}`} className="hover:underline">
                  {contact.mobile}
                </a>
              </div>
            </div>
          )}
        </div>

        {contact.direct_line && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              Ligne directe:
            </span>
            <div className="text-sm text-black">
              <a href={`tel:${contact.direct_line}`} className="hover:underline">
                {contact.direct_line}
              </a>
            </div>
          </div>
        )}

        {/* Message si aucune info contact */}
        {!contact.phone && !contact.mobile && !contact.direct_line && !contact.secondary_email && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Seul l'email principal est renseigné
          </div>
        )}
      </div>
    </div>
  )
}