"use client"

import { useState } from 'react'
import { DollarSign, Save, X, Edit, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '../ui/button'
import { cn, formatPrice } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Product {
  id: string
  // Tarification simplifiée 2025
  cost_price?: number          // Prix d'achat fournisseur HT (euros)
  margin_percentage?: number   // Taux de marge en pourcentage (ex: 25 pour 25%)
  tax_rate?: number           // Taux de TVA (ex: 0.2 pour 20%)

  // Champs calculés automatiquement
  selling_price?: number      // Prix minimum de vente calculé
}

interface SupplierVsPricingEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function SupplierVsPricingEditSection({
  product,
  onUpdate,
  className
}: SupplierVsPricingEditSectionProps) {
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
      console.error('❌ Erreur mise à jour pricing supplier/internal:', error)
    }
  })

  const section: EditableSection = 'pricing'
  const editData = getEditedData(section)
  const error = getError(section)

  // Récupération des données de tarification simplifiée
  const currentCostPrice = product.cost_price || 0
  const currentMarginPercentage = product.margin_percentage || 25 // Défaut 25%

  // Calcul automatique du prix de vente minimum
  const calculateMinSellingPrice = (costPrice: number, marginPercentage: number) => {
    if (!costPrice || costPrice <= 0) return 0
    return costPrice * (1 + (marginPercentage / 100))
  }

  const currentSellingPrice = calculateMinSellingPrice(currentCostPrice, currentMarginPercentage)

  const handleStartEdit = () => {
    startEdit(section, {
      cost_price: currentCostPrice,
      margin_percentage: currentMarginPercentage
    })
  }

  const handleSave = async () => {
    // Validation business rules avant sauvegarde
    if (editData?.cost_price && editData.cost_price <= 0) {
      alert('⚠️ Le prix d\'achat doit être supérieur à 0')
      return
    }

    if (editData?.margin_percentage && editData.margin_percentage < 5) {
      const confirmed = confirm(`⚠️ Marge très faible (${editData.margin_percentage}%). Continuer ?`)
      if (!confirmed) return
    }

    // Calculer le prix de vente pour sauvegarde
    const sellingPrice = editData?.cost_price
      ? calculateMinSellingPrice(editData.cost_price, editData.margin_percentage || 25)
      : 0

    const dataToSave = {
      cost_price: editData?.cost_price,
      margin_percentage: editData?.margin_percentage,
      selling_price: sellingPrice // Prix calculé automatiquement
    }

    // Directement sauvegarder avec les données finales
    updateEditedData(section, dataToSave)

    // Attendre un cycle pour que l'état soit mis à jour
    setTimeout(async () => {
      const success = await saveChanges(section)
      if (success) {
        console.log('✅ Tarification mise à jour avec succès')
      }
    }, 0)
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handlePriceChange = (field: string, value: string) => {
    let numValue: number

    if (field === 'margin_percentage') {
      numValue = parseFloat(value) || 0   // Garde le pourcentage tel quel
    } else {
      numValue = parseFloat(value) || 0   // Prix en euros
    }

    updateEditedData(section, { [field]: numValue })
  }

  // Calculer prix de vente en temps réel pendant l'édition
  const editSellingPrice = editData
    ? calculateMinSellingPrice(editData.cost_price || 0, editData.margin_percentage || 25)
    : currentSellingPrice

  const editMarginAmount = editData
    ? editSellingPrice - (editData.cost_price || 0)
    : currentSellingPrice - currentCostPrice

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tarification Fournisseur vs Vérone
          </h3>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* PRIX D'ACHAT */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-3">
              📦 PRIX D'ACHAT FOURNISSEUR
            </h4>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Prix d'achat HT (en euros) *
              </label>
              <input
                type="number"
                value={editData?.cost_price || ''}
                onChange={(e) => handlePriceChange('cost_price', e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                step="0.01"
                min="0"
                placeholder="Prix d'achat chez le fournisseur"
                required
              />
              {editData?.cost_price && (
                <div className="text-xs text-red-600 mt-1">
                  💰 Coût: {formatPrice(editData.cost_price)}
                </div>
              )}
            </div>
          </div>

          {/* TAUX DE MARGE */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              📈 TAUX DE MARGE
            </h4>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Taux de marge (%)
              </label>
              <input
                type="number"
                value={editData?.margin_percentage || ''}
                onChange={(e) => handlePriceChange('margin_percentage', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="1"
                min="0"
                max="500"
                placeholder="Taux de marge en %"
              />
              <div className="text-xs text-blue-600 mt-1">
                Exemple: 25% = prix de vente 25% supérieur au prix d'achat
              </div>
            </div>
          </div>

          {/* PRIX DE VENTE CALCULÉ AUTOMATIQUEMENT */}
          {editData?.cost_price && editData?.margin_percentage && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                💰 PRIX MINIMUM DE VENTE (calculé)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Prix HT:</span>
                  <span className="text-xl font-bold text-green-800">
                    {formatPrice(editSellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700">Marge brute:</span>
                  <span className="font-semibold text-green-700">
                    {formatPrice(editMarginAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}


          {/* Alertes */}
          {editData?.margin_percentage && editData.margin_percentage < 5 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center text-black text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                ⚠️ Marge très faible (moins de 5%)
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
  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Tarification
        </h3>
        <Button variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </Button>
      </div>

      <div className="space-y-4">
        {/* Prix d'achat */}
        {currentCostPrice > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-red-600 font-medium mb-1">📦 PRIX D'ACHAT FOURNISSEUR</div>
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">Coût HT:</span>
              <span className="text-lg font-bold text-red-800">
                {formatPrice(currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Taux de marge */}
        {currentMarginPercentage > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">📈 TAUX DE MARGE</div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">Pourcentage:</span>
              <span className={cn(
                "text-lg font-bold",
                currentMarginPercentage > 20 ? "text-green-600" :
                currentMarginPercentage > 5 ? "text-black" : "text-red-600"
              )}>
                {currentMarginPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* Prix de vente calculé */}
        {currentCostPrice > 0 && currentMarginPercentage > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 font-medium mb-1">💰 PRIX MINIMUM DE VENTE</div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Prix HT:</span>
              <span className="text-xl font-bold text-green-800">
                {formatPrice(currentSellingPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700">Marge brute:</span>
              <span className="font-semibold text-green-700">
                {formatPrice(currentSellingPrice - currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {(!currentCostPrice || !currentMarginPercentage) && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            {!currentCostPrice && !currentMarginPercentage
              ? "Prix d'achat et taux de marge non renseignés"
              : !currentCostPrice
                ? "Prix d'achat non renseigné"
                : "Taux de marge non renseigné"}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Composant de tarification avec séparation claire supplier vs internal
 *
 * PRIX CLARIFIÉS:
 * - supplier_price: Prix d'achat fournisseur HT (centimes)
 * - selling_price: Prix de vente Vérone HT (centimes)
 *
 * FONCTIONNALITÉS:
 * - Calcul automatique des marges
 * - Validation business rules (prix vente > prix achat)
 * - Alertes marge faible/négative
 * - Labels explicites pour chaque prix
 *
 * CONFORME À:
 * - Manifeste supplier-vs-internal-data.md
 * - Exigence "S'il y a un prix, je veux savoir c'est un prix de quoi"
 */