"use client"

import { useState } from 'react'
import { Truck, Save, X, AlertTriangle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Product {
  id: string
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  stock_quantity?: number
  min_stock?: number
}

interface StockEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

// Statuts automatiques (calculés par le système)
const AUTOMATIC_STATUS_OPTIONS = [
  { value: 'in_stock', label: '✓ En stock', color: 'bg-green-600 text-white', description: 'Stock disponible (calculé automatiquement)' },
  { value: 'out_of_stock', label: '✕ Rupture', color: 'bg-red-600 text-white', description: 'Aucun stock disponible (calculé automatiquement)' },
  { value: 'coming_soon', label: '⏳ Bientôt', color: 'bg-black text-white', description: 'Commande fournisseur en cours (calculé automatiquement)' }
] as const

// Statuts manuels (modifiables par l'utilisateur)
const MANUAL_STATUS_OPTIONS = [
  { value: 'preorder', label: '📅 Précommande', color: 'bg-blue-600 text-white', description: 'Produit en précommande' },
  { value: 'discontinued', label: '⚠ Arrêté', color: 'bg-gray-600 text-white', description: 'Produit arrêté du catalogue' }
] as const

const ALL_STATUS_OPTIONS = [...AUTOMATIC_STATUS_OPTIONS, ...MANUAL_STATUS_OPTIONS]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'refurbished', label: 'Reconditionné' },
  { value: 'used', label: 'Occasion' }
] as const

export function StockEditSection({ product, onUpdate, className }: StockEditSectionProps) {
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
    productId: product.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour stock:', error)
    }
  })

  const section: EditableSection = 'stock'
  const editData = getEditedData(section)
  const error = getError(section)

  const handleStartEdit = () => {
    startEdit(section, {
      status: product.status,
      condition: product.condition,
      stock_quantity: product.stock_quantity || 0,
      min_stock: product.min_stock || 5
    })
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      // Optionnel : afficher une notification de succès
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handleFieldChange = (field: string, value: any) => {
    updateEditedData(section, { [field]: value })
  }

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { color: 'text-red-600', level: 'Rupture' }
    if (quantity <= minLevel) return { color: 'text-black', level: 'Critique' }
    if (quantity <= minLevel * 2) return { color: 'text-gray-700', level: 'Faible' }
    return { color: 'text-green-600', level: 'Bon' }
  }

  if (isEditing(section)) {
    const stockStatus = getStockStatus(editData?.stock_quantity || 0, editData?.min_stock || 5)

    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Stock & Disponibilité
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
          {/* Statuts automatiques (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Statuts automatiques (gérés par le système)
            </label>
            <div className="bg-gray-50 p-3 rounded-md border-2 border-gray-200">
              <div className="space-y-2">
                {AUTOMATIC_STATUS_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center p-2 rounded-md",
                      editData?.status === option.value ? "bg-white border border-gray-300 shadow-sm" : "opacity-60"
                    )}
                  >
                    <Badge className={cn(option.color, "mr-3")}>{option.label}</Badge>
                    <div className="flex-1">
                      <span className="text-sm text-black">
                        {option.description}
                      </span>
                      {editData?.status === option.value && (
                        <div className="text-xs text-gray-600 mt-1">
                          ✅ Statut actuel - Calculé automatiquement par le système
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statuts manuels (éditables) */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Statuts manuels (modifiables)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {MANUAL_STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center p-3 border rounded-md cursor-pointer transition-colors",
                    editData?.status === option.value
                      ? "border-black bg-gray-50"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={editData?.status === option.value}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="sr-only"
                  />
                  <Badge className={cn(option.color, "mr-3")}>{option.label}</Badge>
                  <span className="text-sm text-black">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantité stock (calculée automatiquement) */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Quantité en stock (calculée automatiquement)
            </label>
            <div className="bg-gray-100 p-3 rounded-md border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-2xl font-bold", stockStatus.color)}>
                    {editData?.stock_quantity || 0} unités
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    📊 Calculé automatiquement selon les mouvements de stock
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-medium", stockStatus.color)}>
                    {stockStatus.level}
                  </div>
                  <div className="text-xs text-gray-600">
                    Niveau stock
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seuil minimum */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Seuil d'alerte minimum
            </label>
            <input
              type="number"
              value={editData?.min_stock || 5}
              onChange={(e) => handleFieldChange('min_stock', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              min="0"
              step="1"
            />
            <div className="text-xs text-gray-500 mt-1">
              Alerte lorsque le stock descend en dessous de cette valeur
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Condition *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {CONDITION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center p-2 border rounded-md cursor-pointer transition-colors",
                    editData?.condition === option.value
                      ? "border-black bg-gray-50"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <input
                    type="radio"
                    name="condition"
                    value={option.value}
                    checked={editData?.condition === option.value}
                    onChange={(e) => handleFieldChange('condition', e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm text-black">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alertes et validation */}
          {editData && editData.stock_quantity <= (editData.min_stock || 5) && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
              <div className="flex items-center text-gray-800">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  Attention: Stock faible ({editData.stock_quantity} ≤ {editData.min_stock})
                </span>
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
  const stockStatus = getStockStatus(product.stock_quantity || 0, product.min_stock || 5)
  const currentStatus = ALL_STATUS_OPTIONS.find(opt => opt.value === product.status)
  const currentCondition = CONDITION_OPTIONS.find(opt => opt.value === product.condition)

  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Stock & Disponibilité
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Truck className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Statut:</span>
          {currentStatus && (
            <Badge className={cn(currentStatus.color)}>
              {currentStatus.label}
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Quantité:</span>
          <span className={cn("font-semibold", stockStatus.color)}>
            {product.stock_quantity || 0} unités
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Seuil minimum:</span>
          <span className="text-black">{product.min_stock || 5} unités</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Condition:</span>
          <Badge variant="outline">
            {currentCondition?.label}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Niveau stock:</span>
          <span className={cn("font-medium", stockStatus.color)}>
            {stockStatus.level}
          </span>
        </div>
      </div>
    </div>
  )
}