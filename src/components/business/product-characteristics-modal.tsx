'use client'

/**
 * 🎯 VÉRONE - Modal Gestion Caractéristiques Produit
 *
 * Modal dédié pour la gestion complète des caractéristiques produit
 * - Variant attributes (couleur, matière, style, etc.)
 * - Dimensions physiques (largeur, hauteur, profondeur)
 * - Propriétés techniques (poids, matériau, finition)
 * - Interface claire et validation en temps réel
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Plus,
  X,
  Save,
  Ruler,
  Weight,
  Palette,
  Layers,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ProductCharacteristicsModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  initialData?: {
    variant_attributes?: Record<string, any>
    dimensions?: Record<string, any>
    weight?: number
  }
  onUpdate: (data: any) => void
}

// Caractéristiques prédéfinies pour l'interface
const VARIANT_TEMPLATES = {
  color: {
    label: 'Couleur',
    icon: Palette,
    placeholder: 'ex: Blanc cassé, Bleu marine...',
    suggestions: ['Blanc', 'Noir', 'Gris', 'Beige', 'Marron', 'Bleu', 'Rouge', 'Vert']
  },
  material: {
    label: 'Matériau',
    icon: Layers,
    placeholder: 'ex: Chêne massif, Métal brossé...',
    suggestions: ['Bois', 'Métal', 'Tissu', 'Cuir', 'Plastique', 'Verre', 'Céramique', 'Marbre']
  },
  style: {
    label: 'Style',
    icon: Package,
    placeholder: 'ex: Moderne, Classique...',
    suggestions: ['Moderne', 'Classique', 'Industriel', 'Scandinave', 'Rustique', 'Art déco']
  },
  finish: {
    label: 'Finition',
    icon: Settings,
    placeholder: 'ex: Vernis mat, Laqué brillant...',
    suggestions: ['Mat', 'Brillant', 'Satiné', 'Brossé', 'Poli', 'Texturé']
  }
}

const DIMENSION_FIELDS = [
  { key: 'width', label: 'Largeur', unit: 'cm' },
  { key: 'height', label: 'Hauteur', unit: 'cm' },
  { key: 'depth', label: 'Profondeur', unit: 'cm' }
]

export function ProductCharacteristicsModal({
  isOpen,
  onClose,
  productId,
  productName,
  initialData,
  onUpdate
}: ProductCharacteristicsModalProps) {
  const supabase = createClient()

  // États locaux pour les formulaires
  const [variantAttributes, setVariantAttributes] = useState<Record<string, string>>({})
  const [dimensions, setDimensions] = useState<Record<string, number>>({})
  const [weight, setWeight] = useState<number | undefined>()
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({})

  // États UI
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newAttributeKey, setNewAttributeKey] = useState('')
  const [newAttributeValue, setNewAttributeValue] = useState('')

  // Initialiser les données
  useEffect(() => {
    if (initialData) {
      // Variant attributes
      const variants = initialData.variant_attributes || {}
      const predefinedKeys = Object.keys(VARIANT_TEMPLATES)

      const predefined: Record<string, string> = {}
      const custom: Record<string, string> = {}

      Object.entries(variants).forEach(([key, value]) => {
        if (predefinedKeys.includes(key)) {
          predefined[key] = String(value)
        } else {
          custom[key] = String(value)
        }
      })

      setVariantAttributes(predefined)
      setCustomAttributes(custom)

      // Dimensions
      setDimensions(initialData.dimensions || {})

      // Weight
      setWeight(initialData.weight)
    }
  }, [initialData])

  /**
   * 💾 Sauvegarde des caractéristiques
   */
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Combiner tous les variant_attributes
      const allVariantAttributes = {
        ...variantAttributes,
        ...customAttributes
      }

      // Nettoyer les valeurs vides
      Object.keys(allVariantAttributes).forEach(key => {
        if (!allVariantAttributes[key] || allVariantAttributes[key].trim() === '') {
          delete allVariantAttributes[key]
        }
      })

      // Nettoyer les dimensions vides
      const cleanDimensions = { ...dimensions }
      Object.keys(cleanDimensions).forEach(key => {
        if (!cleanDimensions[key] || cleanDimensions[key] === 0) {
          delete cleanDimensions[key]
        }
      })

      const updateData = {
        variant_attributes: Object.keys(allVariantAttributes).length > 0 ? allVariantAttributes : null,
        dimensions: Object.keys(cleanDimensions).length > 0 ? cleanDimensions : null,
        weight: weight || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (error) throw error

      setSuccess(true)
      onUpdate(updateData)

      // Fermer le modal après 1.5s
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)

    } catch (err) {
      console.error('❌ Erreur sauvegarde caractéristiques:', err)
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  /**
   * ➕ Ajouter attribut personnalisé
   */
  const handleAddCustomAttribute = () => {
    if (newAttributeKey.trim() && newAttributeValue.trim()) {
      setCustomAttributes(prev => ({
        ...prev,
        [newAttributeKey.trim()]: newAttributeValue.trim()
      }))
      setNewAttributeKey('')
      setNewAttributeValue('')
    }
  }

  /**
   * 🗑️ Supprimer attribut personnalisé
   */
  const handleRemoveCustomAttribute = (key: string) => {
    setCustomAttributes(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  /**
   * 📐 Mise à jour dimension
   */
  const handleDimensionChange = (key: string, value: string) => {
    const numValue = parseFloat(value)
    setDimensions(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-black" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-black">Caractéristiques produit</span>
              <span className="text-sm text-gray-600 font-normal">{productName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">

          {/* Messages d'état */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Caractéristiques mises à jour avec succès !
              </AlertDescription>
            </Alert>
          )}

          {/* Section 1: Caractéristiques prédéfinies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Caractéristiques principales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(VARIANT_TEMPLATES).map(([key, template]) => {
                const Icon = template.icon
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600" />
                      {template.label}
                    </Label>
                    <Input
                      id={key}
                      value={variantAttributes[key] || ''}
                      onChange={(e) => setVariantAttributes(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      placeholder={template.placeholder}
                      className="text-sm"
                    />
                    {template.suggestions && (
                      <div className="flex flex-wrap gap-1">
                        {template.suggestions.slice(0, 4).map(suggestion => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => setVariantAttributes(prev => ({
                              ...prev,
                              [key]: suggestion
                            }))}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Dimensions physiques */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Dimensions physiques
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIMENSION_FIELDS.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type="number"
                      step="0.1"
                      min="0"
                      value={dimensions[field.key] || ''}
                      onChange={(e) => handleDimensionChange(field.key, e.target.value)}
                      placeholder="0"
                      className="text-sm pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Poids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-2">
                  <Weight className="h-4 w-4 text-gray-600" />
                  Poids
                </Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                    className="text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attributs personnalisés */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Attributs personnalisés
            </h3>

            {/* Liste des attributs existants */}
            {Object.keys(customAttributes).length > 0 && (
              <div className="space-y-2">
                {Object.entries(customAttributes).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-black">{key}</div>
                      <div className="text-sm text-gray-700">{value}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomAttribute(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </ButtonV2>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter nouvel attribut */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newAttributeKey}
                onChange={(e) => setNewAttributeKey(e.target.value)}
                placeholder="Nom de l'attribut"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Input
                  value={newAttributeValue}
                  onChange={(e) => setNewAttributeValue(e.target.value)}
                  placeholder="Valeur"
                  className="text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomAttribute}
                  disabled={!newAttributeKey.trim() || !newAttributeValue.trim()}
                >
                  <Plus className="h-4 w-4" />
                </ButtonV2>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(variantAttributes).length + Object.keys(customAttributes).length} attribut(s) défini(s)
            </div>
            <div className="flex gap-2">
              <ButtonV2 variant="outline" onClick={onClose} disabled={saving}>
                Annuler
              </ButtonV2>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {saving ? (
                  <>Sauvegarde...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}