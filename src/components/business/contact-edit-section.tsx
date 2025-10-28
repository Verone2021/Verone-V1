"use client"

import { useState } from 'react'
import { User, Save, X, Edit, Mail, Phone, Globe } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import { getOrganisationDisplayName } from '../../lib/utils/organisation-helpers'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Organisation {
  id: string
  legal_name: string
  trade_name?: string | null
  email?: string | null
  phone?: string | null
  secondary_email?: string | null
  website?: string | null
}

interface ContactEditSectionProps {
  organisation: Organisation
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void
  className?: string
}

export function ContactEditSection({ organisation, onUpdate, className }: ContactEditSectionProps) {
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
    organisationId: organisation.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour informations contact:', error)
    }
  })

  const section: EditableSection = 'contact'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      legal_name: organisation.legal_name,
      trade_name: organisation.trade_name || '',
      email: organisation.email || '',
      phone: organisation.phone || '',
      secondary_email: organisation.secondary_email || '',
      website: organisation.website || ''
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Informations contact mises à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: string) => {
    // Nettoyage automatique des emails et URLs
    let processedValue = value.trim()

    if (field === 'email' || field === 'secondary_email') {
      processedValue = processedValue.toLowerCase()
    }

    if (field === 'website' && processedValue && !processedValue.startsWith('http')) {
      processedValue = `https://${processedValue}`
    }

    updateEditedData(section, { [field]: processedValue || null })
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informations Contact
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
              variant="secondary"
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
          {/* Nom du fournisseur */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Nom du fournisseur *
            </label>
            <input
              type="text"
              value={editData?.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Nom du fournisseur"
              required
            />
          </div>

          {/* Email principal */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email principal
            </label>
            <input
              type="email"
              value={editData?.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="contact@fournisseur.com"
            />
          </div>

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
              placeholder="commercial@fournisseur.com"
            />
            <div className="text-xs text-gray-500 mt-1">
              Email alternatif pour les contacts commerciaux
            </div>
          </div>

          {/* Site web */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Site web
            </label>
            <input
              type="url"
              value={editData?.website || ''}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="www.fournisseur.com"
            />
            <div className="text-xs text-gray-500 mt-1">
              Site web du fournisseur (https:// sera ajouté automatiquement)
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
          <User className="h-5 w-5 mr-2" />
          Informations Contact
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-sm text-black opacity-70">Nom:</span>
          <div className="text-lg font-semibold text-black">{getOrganisationDisplayName(organisation as any)}</div>
        </div>

        {organisation.email && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              Email principal:
            </span>
            <div className="text-sm text-blue-600">
              <a href={`mailto:${organisation.email}`} className="hover:underline">
                {organisation.email}
              </a>
            </div>
          </div>
        )}

        {organisation.phone && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              Téléphone:
            </span>
            <div className="text-sm text-black">
              <a href={`tel:${organisation.phone}`} className="hover:underline">
                {organisation.phone}
              </a>
            </div>
          </div>
        )}

        {organisation.secondary_email && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              Email secondaire:
            </span>
            <div className="text-sm text-blue-600">
              <a href={`mailto:${organisation.secondary_email}`} className="hover:underline">
                {organisation.secondary_email}
              </a>
            </div>
          </div>
        )}

        {organisation.website && (
          <div>
            <span className="text-sm text-black opacity-70 flex items-center">
              <Globe className="h-3 w-3 mr-1" />
              Site web:
            </span>
            <div className="text-sm text-blue-600">
              <a href={organisation.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {organisation.website}
              </a>
            </div>
          </div>
        )}

        {/* Message si aucune info contact */}
        {!organisation.email && !organisation.phone && !organisation.website && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Aucune information de contact renseignée
          </div>
        )}
      </div>
    </div>
  )
}