'use client'

import { UserCheck, Save, X, Edit, Star, Users, Calculator, Wrench } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import type { Contact } from '../../hooks/use-contacts'

interface ContactRolesEditSectionProps {
  contact: Contact
  onUpdate: (updatedContact: Partial<Contact>) => void
  className?: string
}

export function ContactRolesEditSection({ contact, onUpdate, className }: ContactRolesEditSectionProps) {
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
      console.error('❌ Erreur mise à jour rôles:', error)
    }
  })

  const section: EditableSection = 'roles'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      is_primary_contact: contact.is_primary_contact || false,
      is_commercial_contact: contact.is_commercial_contact || false,
      is_billing_contact: contact.is_billing_contact || false,
      is_technical_contact: contact.is_technical_contact || false
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Rôles mis à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleRoleChange = (role: string, checked: boolean) => {
    updateEditedData(section, { [role]: checked })
  }

  const getContactTypeBadges = (contactData: any) => {
    const badges = []

    if (contactData?.is_primary_contact) {
      badges.push(
        <Badge key="primary" variant="default" className="bg-gray-100 text-gray-900 border-gray-200">
          <Star className="h-3 w-3 mr-1" />
          Principal
        </Badge>
      )
    }
    if (contactData?.is_commercial_contact) {
      badges.push(
        <Badge key="commercial" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Users className="h-3 w-3 mr-1" />
          Commercial
        </Badge>
      )
    }
    if (contactData?.is_billing_contact) {
      badges.push(
        <Badge key="billing" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Calculator className="h-3 w-3 mr-1" />
          Facturation
        </Badge>
      )
    }
    if (contactData?.is_technical_contact) {
      badges.push(
        <Badge key="technical" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Wrench className="h-3 w-3 mr-1" />
          Technique
        </Badge>
      )
    }

    return badges
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Rôles & Responsabilités
          </h3>
          <div className="flex space-x-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs text-gray-600 mb-4">
            Un contact peut avoir plusieurs rôles selon ses responsabilités dans l'organisation.
          </div>

          {/* Contact Principal */}
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="is_primary_contact"
              checked={editData?.is_primary_contact || false}
              onChange={(e) => handleRoleChange('is_primary_contact', e.target.checked)}
              className="h-4 w-4 text-gray-700 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="is_primary_contact" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-gray-700" />
                <span className="font-medium text-black">Contact Principal</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Contact privilégié pour toutes les communications importantes
              </div>
            </label>
          </div>

          {/* Contact Commercial */}
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="is_commercial_contact"
              checked={editData?.is_commercial_contact || false}
              onChange={(e) => handleRoleChange('is_commercial_contact', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_commercial_contact" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium text-black">Contact Commercial</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Responsable des relations commerciales, devis et négociations
              </div>
            </label>
          </div>

          {/* Contact Facturation */}
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="is_billing_contact"
              checked={editData?.is_billing_contact || false}
              onChange={(e) => handleRoleChange('is_billing_contact', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="is_billing_contact" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium text-black">Contact Facturation</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Responsable de la gestion des factures et des paiements
              </div>
            </label>
          </div>

          {/* Contact Technique */}
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="is_technical_contact"
              checked={editData?.is_technical_contact || false}
              onChange={(e) => handleRoleChange('is_technical_contact', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_technical_contact" className="flex-1 cursor-pointer">
              <div className="flex items-center">
                <Wrench className="h-4 w-4 mr-2 text-purple-600" />
                <span className="font-medium text-black">Contact Technique</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Responsable des aspects techniques, support et maintenance
              </div>
            </label>
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
          <UserCheck className="h-5 w-5 mr-2" />
          Rôles & Responsabilités
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {getContactTypeBadges(contact)}
        </div>

        {/* Description des rôles actifs */}
        <div className="space-y-2 text-sm text-gray-600">
          {contact.is_primary_contact && (
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-2 text-gray-700" />
              Contact privilégié pour toutes les communications importantes
            </div>
          )}
          {contact.is_commercial_contact && (
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-2 text-blue-600" />
              Responsable des relations commerciales, devis et négociations
            </div>
          )}
          {contact.is_billing_contact && (
            <div className="flex items-center">
              <Calculator className="h-3 w-3 mr-2 text-green-600" />
              Responsable de la gestion des factures et des paiements
            </div>
          )}
          {contact.is_technical_contact && (
            <div className="flex items-center">
              <Wrench className="h-3 w-3 mr-2 text-purple-600" />
              Responsable des aspects techniques, support et maintenance
            </div>
          )}
        </div>

        {/* Message si aucun rôle spécifique */}
        {!contact.is_primary_contact && !contact.is_commercial_contact && !contact.is_billing_contact && !contact.is_technical_contact && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Aucun rôle spécifique attribué
          </div>
        )}
      </div>
    </div>
  )
}