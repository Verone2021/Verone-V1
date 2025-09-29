"use client"

import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Upload, Palette, Settings, Info } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import {
  Collection,
  CollectionFormState,
  CollectionFormErrors,
  CreateCollectionInput,
  CollectionStyle,
  RoomCategory,
  CollectionVisibility,
  COLLECTION_STYLE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
  COLLECTION_VISIBILITY_OPTIONS
} from '../../types/collections'

interface CollectionCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCollectionInput) => Promise<boolean>
  loading?: boolean
  editingCollection?: Collection
}

type WizardStep = 1 | 2 | 3

export function CollectionCreationWizard({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  editingCollection
}: CollectionCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<CollectionFormState>({
    // Step 1: Basic Info
    name: '',
    description: '',
    image_url: '',
    // Step 2: Style & Category
    style: null,
    room_category: null,
    color_theme: '#FFFFFF',
    // Step 3: Metadata & Settings
    visibility: 'private',
    theme_tags: [],
    meta_title: '',
    meta_description: '',
    sort_order: 0
  })
  const [errors, setErrors] = useState<CollectionFormErrors>({})
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())

  // Initialize form when modal opens (create or edit mode)
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setFormData(editingCollection ? {
        name: editingCollection.name || '',
        description: editingCollection.description || '',
        image_url: editingCollection.image_url || '',
        style: editingCollection.style || null,
        room_category: editingCollection.room_category || null,
        color_theme: editingCollection.color_theme || '#FFFFFF',
        visibility: editingCollection.visibility || 'private',
        theme_tags: editingCollection.theme_tags || [],
        meta_title: editingCollection.meta_title || '',
        meta_description: editingCollection.meta_description || '',
        sort_order: editingCollection.sort_order || 0
      } : {
        name: '',
        description: '',
        image_url: '',
        style: null,
        room_category: null,
        color_theme: '#FFFFFF',
        visibility: 'private',
        theme_tags: [],
        meta_title: '',
        meta_description: '',
        sort_order: 0
      })
      setErrors({})
      setCompletedSteps(new Set())
    }
  }, [isOpen, editingCollection])

  const updateFormData = (updates: Partial<CollectionFormState>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof CollectionFormErrors]
    })
    setErrors(newErrors)
  }

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: CollectionFormErrors = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Le nom est obligatoire'
        } else if (formData.name.length < 3) {
          newErrors.name = 'Le nom doit contenir au moins 3 caractères'
        }

        if (formData.description.length > 500) {
          newErrors.description = 'La description ne peut pas dépasser 500 caractères'
        }

        if (formData.image_url && !isValidUrl(formData.image_url)) {
          newErrors.image_url = 'URL image invalide';
        }
        break;

      case 2:
        if (!formData.style) {
          newErrors.style = 'Veuillez sélectionner un style'
        }
        if (!formData.room_category) {
          newErrors.room_category = 'Veuillez sélectionner une catégorie de pièce'
        }
        break

      case 3:
        if (formData.meta_title && formData.meta_title.length > 60) {
          newErrors.meta_title = 'Le titre SEO ne peut pas dépasser 60 caractères'
        }
        if (formData.meta_description && formData.meta_description.length > 160) {
          newErrors.meta_description = 'La description SEO ne peut pas dépasser 160 caractères'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const canProceed = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return !!formData.name.trim()
      case 2:
        return !!formData.style && !!formData.room_category
      case 3:
        return true // Optional step
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as WizardStep)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    const submitData: CreateCollectionInput = {
      name: formData.name,
      description: formData.description || undefined,
      image_url: formData.image_url || undefined,
      style: formData.style || undefined,
      room_category: formData.room_category || undefined,
      color_theme: formData.color_theme,
      visibility: formData.visibility,
      theme_tags: formData.theme_tags,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
      sort_order: formData.sort_order
    }

    const success = await onSubmit(submitData)
    if (success) {
      onClose()
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.theme_tags.includes(tag.trim())) {
      updateFormData({
        theme_tags: [...formData.theme_tags, tag.trim()]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      theme_tags: formData.theme_tags.filter(tag => tag !== tagToRemove)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">
              {editingCollection ? 'Modifier la collection' : 'Créer une collection'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Organisez vos produits selon votre style et vos besoins
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => {
              const isCompleted = completedSteps.has(step as WizardStep)
              const isCurrent = currentStep === step
              const canAccess = step <= currentStep || isCompleted

              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => canAccess && setCurrentStep(step as WizardStep)}
                    disabled={!canAccess}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                      isCompleted && "bg-green-600 text-white",
                      isCurrent && !isCompleted && "bg-black text-white",
                      !isCurrent && !isCompleted && canAccess && "bg-gray-200 text-gray-600 hover:bg-gray-300",
                      !canAccess && "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step}
                  </button>

                  <div className="ml-3 text-sm">
                    <div className={cn(
                      "font-medium",
                      isCurrent ? "text-black" : "text-gray-600"
                    )}>
                      {step === 1 && "Informations"}
                      {step === 2 && "Style & Pièce"}
                      {step === 3 && "Paramètres"}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {step === 1 && "Nom et description"}
                      {step === 2 && "Style et catégorie"}
                      {step === 3 && "Visibilité et SEO"}
                    </div>
                  </div>

                  {step < 3 && (
                    <ArrowRight className="h-4 w-4 text-gray-300 mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-black">Informations de base</h3>
              </div>

              {/* Collection Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Nom de la collection *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Salon minimaliste blanc"
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black",
                    errors.name ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Décrivez l'ambiance et le style de cette collection..."
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black",
                    errors.description ? "border-red-500" : "border-gray-300"
                  )}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.description.length}/500
                  </p>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Image de couverture
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => updateFormData({ image_url: e.target.value })}
                    placeholder="https://exemple.com/image.jpg"
                    className={cn(
                      "flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black",
                      errors.image_url ? "border-red-500" : "border-gray-300"
                    )}
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {errors.image_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.image_url}</p>
                )}
              </div>

              {/* Image Preview */}
              {formData.image_url && isValidUrl(formData.image_url) && (
                <div className="mt-4">
                  <img
                    src={formData.image_url}
                    alt="Aperçu"
                    className="w-full h-32 object-cover rounded-md border"
                    onError={() => updateFormData({ image_url: '' })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Style & Category */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Palette className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium text-black">Style et catégorie</h3>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Style décoratif *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {COLLECTION_STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData({
                        style: option.value,
                        color_theme: option.color
                      })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        formData.style === option.value
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: option.color }}
                        />
                        <div>
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.style && (
                  <p className="mt-2 text-sm text-red-600">{errors.style}</p>
                )}
              </div>

              {/* Room Category */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Catégorie de pièce *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROOM_CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData({ room_category: option.value })}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        formData.room_category === option.value
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{option.icon}</span>
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.room_category && (
                  <p className="mt-2 text-sm text-red-600">{errors.room_category}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Settings & Metadata */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-black">Paramètres et métadonnées</h3>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Visibilité
                </label>
                <div className="space-y-2">
                  {COLLECTION_VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData({ visibility: option.value })}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all",
                        formData.visibility === option.value
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Tags thématiques
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Tapez un tag et appuyez sur Entrée"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.theme_tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Metadata */}
              <div className="space-y-4">
                <h4 className="font-medium text-black">Référencement (SEO)</h4>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Titre SEO
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => updateFormData({ meta_title: e.target.value })}
                    placeholder="Titre optimisé pour les moteurs de recherche"
                    className={cn(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black",
                      errors.meta_title ? "border-red-500" : "border-gray-300"
                    )}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.meta_title && (
                      <p className="text-sm text-red-600">{errors.meta_title}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.meta_title.length}/60
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description SEO
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => updateFormData({ meta_description: e.target.value })}
                    placeholder="Description optimisée pour les moteurs de recherche"
                    rows={2}
                    className={cn(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black",
                      errors.meta_description ? "border-red-500" : "border-gray-300"
                    )}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.meta_description && (
                      <p className="text-sm text-red-600">{errors.meta_description}</p>
                    )}
                    <p className="text-xs text-gray-500 ml-auto">
                      {formData.meta_description.length}/160
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            disabled={loading}
          >
            {currentStep === 1 ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </>
            )}
          </Button>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Étape {currentStep} sur 3
            </span>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed(currentStep) || loading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Créer la collection
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}