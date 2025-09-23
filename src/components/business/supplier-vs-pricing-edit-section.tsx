"use client"

import { useState } from 'react'
import { DollarSign, Save, X, Edit, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '../ui/button'
import { cn, formatPrice } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'

interface Product {
  id: string
  // Prix clarifiés selon nouvelles règles business
  supplier_price?: number      // Prix d'achat fournisseur HT (centimes)
  selling_price: number        // Prix de vente Vérone HT (centimes)
  tax_rate?: number

  // Champs de transition (anciens noms)
  price_ht?: number           // À migrer vers selling_price
  cost_price?: number         // À migrer vers supplier_price
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

  // Récupération des prix avec CORRECTION de l'inversion (price_ht = prix d'achat, cost_price = prix de vente)
  const currentSellingPrice = product.selling_price || product.cost_price || 0  // CORRIGÉ : cost_price devient selling_price
  const currentSupplierPrice = product.supplier_price || product.price_ht || 0  // CORRIGÉ : price_ht devient supplier_price

  // Calculs automatiques
  const calculateMargin = (sellingPrice: number, supplierPrice: number) => {
    if (!supplierPrice || supplierPrice <= 0) return null
    return {
      amount: sellingPrice - supplierPrice,
      percentage: ((sellingPrice - supplierPrice) / supplierPrice) * 100
    }
  }

  const handleStartEdit = () => {
    startEdit(section, {
      selling_price: currentSellingPrice,
      supplier_price: currentSupplierPrice,
      tax_rate: product.tax_rate || 0.2
    })
  }

  const handleSave = async () => {
    // Validation business rules avant sauvegarde
    if (editData?.supplier_price && editData?.selling_price) {
      if (editData.selling_price <= editData.supplier_price) {
        alert('⚠️ Le prix de vente doit être supérieur au prix d\'achat fournisseur')
        return
      }

      const margin = calculateMargin(editData.selling_price, editData.supplier_price)
      if (margin && margin.percentage < 5) {
        const confirmed = confirm(`⚠️ Marge très faible (${margin.percentage.toFixed(1)}%). Continuer ?`)
        if (!confirmed) return
      }
    }

    const success = await saveChanges(section)
    if (success) {
      // Notification de succès
      console.log('✅ Prix mis à jour avec succès')
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
  }

  const handlePriceChange = (field: string, value: string) => {
    const numValue = field === 'tax_rate'
      ? parseFloat(value) / 100  // Conversion pourcentage → décimal
      : parseFloat(value) || 0 // Prix en euros (changé de parseInt vers parseFloat)

    updateEditedData(section, { [field]: numValue })
  }

  // Calculer marge en temps réel pendant l'édition
  const currentMargin = editData
    ? calculateMargin(editData.selling_price || 0, editData.supplier_price || 0)
    : calculateMargin(currentSellingPrice, currentSupplierPrice)

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tarification Fournisseur vs Vérone
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

        <div className="space-y-5">
          {/* SECTION FOURNISSEUR */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-3 flex items-center">
              📦 Prix Fournisseur (Coût d'achat)
            </h4>

            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Prix d'achat fournisseur HT (en euros)
              </label>
              <input
                type="number"
                value={editData?.supplier_price || ''}
                onChange={(e) => handlePriceChange('supplier_price', e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                step="1"
                min="0"
                placeholder="Prix d'achat chez le fournisseur"
              />
              {editData?.supplier_price && (
                <div className="text-xs text-red-600 mt-1">
                  💰 Coût: {formatPrice(editData.supplier_price)}
                </div>
              )}
            </div>
          </div>

          {/* SECTION VÉRONE (PRIX DE VENTE) */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
              🏪 Prix Vérone (Prix de vente client)
            </h4>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Prix de vente Vérone HT (en euros) *
              </label>
              <input
                type="number"
                value={editData?.selling_price || 0}
                onChange={(e) => handlePriceChange('selling_price', e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                step="1"
                min="0"
                required
              />
              <div className="text-xs text-green-600 mt-1">
                💳 Prix client: {formatPrice(editData?.selling_price || 0)}
              </div>
            </div>
          </div>

          {/* TVA */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Taux TVA (%)
            </label>
            <input
              type="number"
              value={Math.round((editData?.tax_rate || 0.2) * 100)}
              onChange={(e) => handlePriceChange('tax_rate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              step="0.1"
              min="0"
              max="100"
            />
          </div>

          {/* CALCULS AUTOMATIQUES */}
          {editData && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Calculs Automatiques
              </h4>

              <div className="space-y-2 text-sm">
                {/* Prix TTC */}
                <div className="flex justify-between">
                  <span className="text-blue-700">Prix TTC client:</span>
                  <span className="font-semibold text-blue-800">
                    {formatPrice((editData.selling_price || 0) * (1 + (editData.tax_rate || 0.2)))}
                  </span>
                </div>

                {/* Marge si prix fournisseur défini */}
                {currentMargin && (
                  <>
                    <div className="border-t border-blue-200 pt-2"></div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Marge brute (€):</span>
                      <span className={cn(
                        "font-semibold",
                        currentMargin.amount > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatPrice(currentMargin.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Marge (%):</span>
                      <span className={cn(
                        "font-semibold",
                        currentMargin.percentage > 20 ? "text-green-600" :
                        currentMargin.percentage > 5 ? "text-orange-600" : "text-red-600"
                      )}>
                        {currentMargin.percentage.toFixed(1)}%
                        {currentMargin.percentage < 5 && " ⚠️"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Alertes Business */}
              {editData.supplier_price && editData.selling_price && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  {editData.selling_price <= editData.supplier_price && (
                    <div className="flex items-center text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      🚨 Marge négative ! Prix de vente inférieur au prix d'achat
                    </div>
                  )}
                  {currentMargin && currentMargin.percentage < 5 && currentMargin.percentage > 0 && (
                    <div className="flex items-center text-orange-600 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      ⚠️ Marge très faible (&lt;5%)
                    </div>
                  )}
                </div>
              )}
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
        {/* Prix de Vente Vérone */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium mb-1">🏪 PRIX DE VENTE VÉRONE</div>
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">Prix HT:</span>
            <span className="text-xl font-bold text-green-800">
              {formatPrice(currentSellingPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-700">Prix TTC:</span>
            <span className="font-semibold text-green-700">
              {formatPrice(currentSellingPrice * (1 + (product.tax_rate || 0.2)))}
            </span>
          </div>
        </div>

        {/* Prix Fournisseur */}
        {currentSupplierPrice > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-red-600 font-medium mb-1">📦 PRIX D'ACHAT FOURNISSEUR</div>
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">Coût HT:</span>
              <span className="text-lg font-bold text-red-800">
                {formatPrice(currentSupplierPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Marge */}
        {currentMargin && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">📊 MARGE COMMERCIALE</div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">Marge:</span>
              <span className={cn(
                "text-lg font-bold",
                currentMargin.amount > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPrice(currentMargin.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">Pourcentage:</span>
              <span className={cn(
                "font-semibold",
                currentMargin.percentage > 20 ? "text-green-600" :
                currentMargin.percentage > 5 ? "text-orange-600" : "text-red-600"
              )}>
                {currentMargin.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Message si pas de prix fournisseur */}
        {!currentSupplierPrice && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            Prix d'achat fournisseur non renseigné
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