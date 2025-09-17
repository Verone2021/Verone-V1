'use client'

import { Settings, Save, X, Edit, Phone, Mail, Globe2, MessageCircle, Bell } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import type { Contact } from '../../hooks/use-contacts'

interface ContactPreferencesEditSectionProps {
  contact: Contact
  onUpdate: (updatedContact: Partial<Contact>) => void
  className?: string
}

export function ContactPreferencesEditSection({ contact, onUpdate, className }: ContactPreferencesEditSectionProps) {
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
      console.error('❌ Erreur mise à jour préférences:', error)
    }
  })

  const section: EditableSection = 'preferences'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      preferred_communication_method: contact.preferred_communication_method || 'email',
      accepts_marketing: contact.accepts_marketing || false,
      accepts_notifications: contact.accepts_notifications || false,
      language_preference: contact.language_preference || 'fr'
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Préférences mises à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: any) => {
    updateEditedData(section, { [field]: value })
  }

  const getCommunicationMethodLabel = (method: string) => {
    switch (method) {
      case 'email': return 'Email'
      case 'phone': return 'Téléphone'
      case 'both': return 'Email + Téléphone'
      default: return 'Email'
    }
  }

  const getCommunicationMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      case 'both': return <MessageCircle className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'fr': return 'Français'
      case 'en': return 'English'
      case 'es': return 'Español'
      case 'it': return 'Italiano'
      case 'de': return 'Deutsch'
      default: return 'Français'
    }
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Préférences de Communication
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
          {/* Méthode de communication préférée */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Méthode de communication préférée
            </label>
            <div className="space-y-2">
              {[
                { value: 'email', label: 'Email uniquement', icon: <Mail className="h-4 w-4" /> },
                { value: 'phone', label: 'Téléphone uniquement', icon: <Phone className="h-4 w-4" /> },
                { value: 'both', label: 'Email et téléphone', icon: <MessageCircle className="h-4 w-4" /> }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`comm_${option.value}`}
                    name="communication_method"
                    value={option.value}
                    checked={editData?.preferred_communication_method === option.value}
                    onChange={(e) => handleFieldChange('preferred_communication_method', e.target.value)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300"
                  />
                  <label htmlFor={`comm_${option.value}`} className="flex items-center cursor-pointer">
                    {option.icon}
                    <span className="ml-2 text-sm text-black">{option.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Langue préférée */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Langue préférée
            </label>
            <select
              value={editData?.language_preference || 'fr'}
              onChange={(e) => handleFieldChange('language_preference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Préférences marketing et notifications */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accepts_marketing"
                checked={editData?.accepts_marketing || false}
                onChange={(e) => handleFieldChange('accepts_marketing', e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="accepts_marketing" className="flex-1 cursor-pointer">
                <span className="font-medium text-black">Accepte le marketing</span>
                <div className="text-sm text-gray-600">
                  Recevoir des communications commerciales et promotionnelles
                </div>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accepts_notifications"
                checked={editData?.accepts_notifications || false}
                onChange={(e) => handleFieldChange('accepts_notifications', e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="accepts_notifications" className="flex-1 cursor-pointer">
                <span className="font-medium text-black">Accepte les notifications</span>
                <div className="text-sm text-gray-600">
                  Recevoir des notifications pour les commandes, livraisons, etc.
                </div>
              </label>
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
          <Settings className="h-5 w-5 mr-2" />
          Préférences de Communication
        </h3>
        <Button variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </Button>
      </div>

      <div className="space-y-3">
        {/* Méthode de communication */}
        <div>
          <span className="text-sm text-black opacity-70">Communication préférée:</span>
          <div className="flex items-center mt-1">
            {getCommunicationMethodIcon(contact.preferred_communication_method)}
            <span className="ml-2 text-sm text-black font-medium">
              {getCommunicationMethodLabel(contact.preferred_communication_method)}
            </span>
          </div>
        </div>

        {/* Langue */}
        <div>
          <span className="text-sm text-black opacity-70 flex items-center">
            <Globe2 className="h-3 w-3 mr-1" />
            Langue:
          </span>
          <div className="text-sm text-black font-medium">
            {getLanguageLabel(contact.language_preference)}
          </div>
        </div>

        {/* Préférences */}
        <div>
          <span className="text-sm text-black opacity-70">Préférences:</span>
          <div className="flex gap-2 flex-wrap mt-1">
            {contact.accepts_marketing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <MessageCircle className="h-3 w-3 mr-1" />
                Marketing
              </Badge>
            )}
            {contact.accepts_notifications && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Bell className="h-3 w-3 mr-1" />
                Notifications
              </Badge>
            )}
            {!contact.accepts_marketing && !contact.accepts_notifications && (
              <span className="text-xs text-gray-400 italic">
                Aucune communication automatique
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}