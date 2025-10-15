"use client"

import { useState } from 'react'
import { TrendingUp, Save, X, Edit, Star, Award, Heart, FileText } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Organisation {
  id: string
  rating?: number | null
  certification_labels?: string[] | null
  preferred_supplier?: boolean | null
  notes?: string | null
}

interface PerformanceEditSectionProps {
  organisation: Organisation
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void
  className?: string
}

export function PerformanceEditSection({ organisation, onUpdate, className }: PerformanceEditSectionProps) {
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
      console.error('❌ Erreur mise à jour performance:', error)
    }
  })

  const section: EditableSection = 'performance'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      rating: organisation.rating || 0,
      certification_labels: organisation.certification_labels || [],
      preferred_supplier: organisation.preferred_supplier || false,
      notes: organisation.notes || ''
    })
  }

  const handleSave = async () => {
    // Validation de la note
    if (editData?.rating && (editData.rating < 1 || editData.rating > 5)) {
      alert('⚠️ La note doit être comprise entre 1 et 5 étoiles')
      return
    }

    const success = await saveChanges(section)
    if (success) {
      console.log('✅ Performance mise à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleRatingChange = (rating: number) => {
    updateEditedData(section, { rating })
  }

  const handleCertificationChange = (value: string) => {
    // Convertir la chaîne en tableau en séparant par virgule
    const labels = value.split(',').map(label => label.trim()).filter(label => label.length > 0)
    updateEditedData(section, { certification_labels: labels.length > 0 ? labels : null })
  }

  // Options de certifications prédéfinies
  const commonCertifications = [
    'ISO 9001',
    'ISO 14001',
    'FSC',
    'PEFC',
    'CE',
    'NF',
    'Ecolabel',
    'OEKO-TEX',
    'Cradle to Cradle',
    'Green Guard'
  ]

  // Fonction pour afficher les étoiles
  const renderStars = (rating: number, editable: boolean = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const filled = index < rating
      return (
        <Star
          key={index}
          className={cn(
            "h-5 w-5",
            filled ? "fill-gray-600 text-gray-600" : "text-gray-300",
            editable ? "cursor-pointer hover:text-gray-600" : ""
          )}
          onClick={editable ? () => handleRatingChange(index + 1) : undefined}
        />
      )
    })
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance & Qualité
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
            </ButtonV2>
            <Button
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

        <div className="space-y-5">
          {/* Évaluation (étoiles) */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Évaluation globale
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {renderStars(editData?.rating || 0, true)}
              </div>
              <span className="text-sm text-gray-600 ml-3">
                {editData?.rating ? `${editData.rating}/5` : 'Non évalué'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cliquez sur les étoiles pour évaluer ce fournisseur
            </div>
          </div>

          {/* Fournisseur préféré */}
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-pink-600" />
              <div>
                <div className="text-sm font-medium text-pink-800">Fournisseur préféré</div>
                <div className="text-xs text-pink-600">Marquer comme fournisseur de confiance</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editData?.preferred_supplier || false}
                onChange={(e) => updateEditedData(section, { preferred_supplier: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Certifications & Labels qualité
            </label>
            <textarea
              value={editData?.certification_labels?.join(', ') || ''}
              onChange={(e) => handleCertificationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="ISO 9001, FSC, CE..."
              rows={2}
            />
            <div className="text-xs text-gray-500 mt-1">
              Séparez les certifications par des virgules
            </div>

            {/* Suggestions de certifications */}
            <div className="mt-2">
              <div className="text-xs text-gray-600 mb-2">Certifications courantes :</div>
              <div className="flex flex-wrap gap-1">
                {commonCertifications.map(cert => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => {
                      const currentCerts = editData?.certification_labels || []
                      if (!currentCerts.includes(cert)) {
                        const newCerts = [...currentCerts, cert]
                        updateEditedData(section, { certification_labels: newCerts })
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                  >
                    + {cert}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes internes */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Notes internes
            </label>
            <textarea
              value={editData?.notes || ''}
              onChange={(e) => updateEditedData(section, { notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Notes sur la qualité, fiabilité, points d'attention..."
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              Notes privées pour l'équipe Vérone (non visibles du fournisseur)
            </div>
          </div>

          {/* Résumé de performance */}
          {editData && (editData.rating > 0 || editData.preferred_supplier || editData.certification_labels?.length > 0) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Résumé Performance
              </h4>

              <div className="space-y-2 text-sm">
                {editData.rating > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Évaluation:</span>
                    <div className="flex space-x-1">
                      {renderStars(editData.rating)}
                    </div>
                  </div>
                )}

                {editData.preferred_supplier && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Statut:</span>
                    <span className="font-medium text-pink-600 flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      Fournisseur préféré
                    </span>
                  </div>
                )}

                {editData.certification_labels?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Certifications:</span>
                    <span className="font-medium text-blue-800">
                      {editData.certification_labels.length} label{editData.certification_labels.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
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
  const hasPerformanceData = organisation.rating || organisation.preferred_supplier || organisation.certification_labels?.length > 0 || organisation.notes

  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Performance & Qualité
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        {hasPerformanceData ? (
          <div className="space-y-3">
            {/* Évaluation */}
            {organisation.rating && organisation.rating > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-700 font-medium mb-1 flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  ÉVALUATION GLOBALE
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {renderStars(organisation.rating)}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {organisation.rating}/5
                  </span>
                </div>
              </div>
            )}

            {/* Fournisseur préféré */}
            {organisation.preferred_supplier && (
              <div className="bg-pink-50 p-3 rounded-lg">
                <div className="text-xs text-pink-600 font-medium mb-1 flex items-center">
                  <Heart className="h-3 w-3 mr-1" />
                  STATUT SPÉCIAL
                </div>
                <div className="text-sm font-semibold text-pink-800 flex items-center">
                  <Heart className="h-4 w-4 mr-1 fill-pink-600" />
                  Fournisseur préféré
                </div>
              </div>
            )}

            {/* Certifications */}
            {organisation.certification_labels && organisation.certification_labels.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 font-medium mb-2 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  CERTIFICATIONS & LABELS
                </div>
                <div className="flex flex-wrap gap-1">
                  {organisation.certification_labels.map(label => (
                    <span
                      key={label}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes internes */}
            {organisation.notes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium mb-1 flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  NOTES INTERNES
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {organisation.notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xs italic py-4">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Aucune donnée de performance renseignée
          </div>
        )}
      </div>
    </div>
  )
}