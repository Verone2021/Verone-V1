"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Link, Package, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { useDrafts } from '../../hooks/use-drafts'
import { useToast } from '../../hooks/use-toast'
import { ClientAssignmentSelector } from './client-assignment-selector'
import { ConsultationSuggestions } from './consultation-suggestions'

interface SourcingQuickFormProps {
  onSuccess?: (draftId: string) => void
  onCancel?: () => void
  className?: string
}

export function SourcingQuickForm({
  onSuccess,
  onCancel,
  className
}: SourcingQuickFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { createSourcingDraft } = useDrafts()

  // États du formulaire - Simplifié pour la nouvelle logique
  const [formData, setFormData] = useState({
    name: '',
    supplier_page_url: '',
    assigned_client_id: '' // Facultatif - détermine automatiquement le type de sourcing
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Gestion upload image
  const handleImageSelect = (file: File) => {
    setSelectedImage(file)

    // Créer preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Effacer erreur image
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }))
    }
  }

  // Gestion drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile) {
      handleImageSelect(imageFile)
    } else {
      toast({
        title: "Format invalide",
        description: "Seules les images sont acceptées",
        variant: "destructive"
      })
    }
  }

  // Validation formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire'
    }

    if (!formData.supplier_page_url.trim()) {
      newErrors.supplier_page_url = 'L\'URL de la page fournisseur est obligatoire'
    } else {
      // Validation format URL
      try {
        new URL(formData.supplier_page_url)
      } catch {
        newErrors.supplier_page_url = 'Format d\'URL invalide'
      }
    }

    if (!selectedImage) {
      newErrors.image = 'Une image est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de continuer",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Calculer automatiquement le type de sourcing
      const sourcingType = formData.assigned_client_id ? 'client' : 'interne'

      const draftData = {
        name: formData.name,
        supplier_page_url: formData.supplier_page_url,
        creation_mode: 'sourcing' as const,
        sourcing_type: sourcingType,
        assigned_client_id: formData.assigned_client_id || undefined,
        imageFile: selectedImage || undefined
      }

      const newDraft = await createSourcingDraft(draftData)

      if (newDraft) {
        toast({
          title: "Sourcing enregistré",
          description: "Le produit a été ajouté aux brouillons"
        })

        // Callback ou redirection
        if (onSuccess) {
          onSuccess(newDraft.id)
        } else {
          router.push('/catalogue?tab=drafts')
        }
      }

    } catch (error) {
      console.error('Erreur création sourcing:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le sourcing",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("bg-white", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Sourcing Rapide</h1>
            <p className="text-gray-600 mt-1">
              Ajoutez rapidement un produit à sourcer pour le catalogue général ou pour un client spécifique
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Package className="h-4 w-4 mr-2" />
            Mode Sourcing
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 1. UPLOAD IMAGE - Obligatoire */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Image du produit *
          </Label>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              selectedImage
                ? "border-green-300 bg-green-50"
                : errors.image
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="mx-auto h-32 w-32 object-cover rounded-lg"
                />
                <div className="text-sm text-gray-600">
                  {selectedImage?.name}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview('')
                  }}
                >
                  Changer d'image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-gray-600">
                    Glissez-déposez une image ou
                  </p>
                  <Label className="cursor-pointer text-black hover:underline">
                    cliquez pour sélectionner
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageSelect(file)
                      }}
                    />
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP jusqu'à 10MB
                </p>
              </div>
            )}
          </div>

          {errors.image && (
            <p className="text-sm text-red-600">{errors.image}</p>
          )}
        </div>

        {/* 2. NOM PRODUIT - Obligatoire */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nom du produit *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }))
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
            }}
            placeholder="Ex: Fauteuil design scandinave..."
            className={cn(
              "transition-colors",
              errors.name && "border-red-300 focus:border-red-500"
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* 3. URL FOURNISSEUR - Obligatoire */}
        <div className="space-y-2">
          <Label htmlFor="supplier_url" className="text-sm font-medium">
            URL de la page fournisseur *
          </Label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="supplier_url"
              type="url"
              value={formData.supplier_page_url}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, supplier_page_url: e.target.value }))
                if (errors.supplier_page_url) setErrors(prev => ({ ...prev, supplier_page_url: '' }))
              }}
              placeholder="https://fournisseur.com/produit/123"
              className={cn(
                "pl-10 transition-colors",
                errors.supplier_page_url && "border-red-300 focus:border-red-500"
              )}
            />
          </div>
          {errors.supplier_page_url && (
            <p className="text-sm text-red-600">{errors.supplier_page_url}</p>
          )}
          <p className="text-xs text-gray-500">
            Lien vers la fiche produit chez le fournisseur
          </p>
        </div>

        {/* 4. ORGANISATION CLIENT PROFESSIONNELLE - Facultatif */}
        <div className="space-y-2">
          <ClientAssignmentSelector
            value={formData.assigned_client_id}
            onChange={(clientId, client) => {
              setFormData(prev => ({ ...prev, assigned_client_id: clientId }))
            }}
            label="Organisation client professionnelle (facultatif)"
            placeholder="Laisser vide pour sourcing interne ou sélectionner un client..."
            required={false}
            className="mb-4"
          />
          <p className="text-xs text-gray-500">
            <strong>Sourcing interne :</strong> Laissez vide pour ajouter au catalogue général<br/>
            <strong>Sourcing client :</strong> Sélectionnez un client pour une consultation spécifique
          </p>
        </div>

        {/* Suggestions de consultations si client assigné */}
        {formData.assigned_client_id && (
          <ConsultationSuggestions
            clientId={formData.assigned_client_id}
            onLinkToConsultation={(consultationId) => {
              console.log('Suggestion consultation:', consultationId)
              // TODO: Stocker l'association pour après création du produit
            }}
            className="bg-blue-50 border-blue-200"
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * Champs obligatoires
          </div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Enregistrer en brouillon
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}