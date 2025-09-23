"use client"

import { useState, useEffect } from 'react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Alert, AlertDescription } from '../../ui/alert'
import { DollarSign, Calculator, Info } from 'lucide-react'
import { WizardFormData } from '../complete-product-wizard'

interface PricingSectionProps {
  formData: WizardFormData
  setFormData: (data: WizardFormData) => void
  onSave: () => void
}

export function PricingSection({
  formData,
  setFormData,
  onSave
}: PricingSectionProps) {

  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  // Calculs automatiques de marge
  const calculateMargin = () => {
    const costPrice = parseFloat(formData.cost_price || '0')
    const sellingPrice = parseFloat(formData.price_ht || '0')

    if (costPrice > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - costPrice) / costPrice) * 100
      return margin.toFixed(2)
    }
    return '0'
  }

  const calculateSellingPrice = () => {
    const costPrice = parseFloat(formData.cost_price || '0')
    const targetMargin = parseFloat(formData.target_margin_percentage || '0')

    if (costPrice > 0 && targetMargin > 0) {
      const sellingPrice = costPrice * (1 + targetMargin / 100)
      return sellingPrice.toFixed(2)
    }
    return '0'
  }

  // Mise à jour automatique de la marge quand les prix changent
  useEffect(() => {
    const margin = calculateMargin()
    if (margin !== formData.margin_percentage) {
      updateField('margin_percentage', margin)
    }
  }, [formData.cost_price, formData.price_ht])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tarification et coûts
          </CardTitle>
          <CardDescription>
            Gestion des prix d'achat, de vente et des marges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prix d'achat */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">
                Prix d'achat HT (€)
              </Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => updateField('cost_price', e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Prix d'achat hors taxes chez le fournisseur
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_cost_price">
                Coût fournisseur spécifique (€)
              </Label>
              <Input
                id="supplier_cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.supplier_cost_price}
                onChange={(e) => updateField('supplier_cost_price', e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Coût d'acquisition spécifique pour ce fournisseur
              </p>
            </div>
          </div>

          {/* Prix de vente */}
          <div className="space-y-2">
            <Label htmlFor="price_ht">
              Prix de vente HT (€)
            </Label>
            <Input
              id="price_ht"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_ht}
              onChange={(e) => updateField('price_ht', e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500">
              Prix de vente hors taxes à appliquer
            </p>
          </div>

          {/* Gestion des marges */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_margin_percentage">
                Marge cible (%)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="target_margin_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  value={formData.target_margin_percentage}
                  onChange={(e) => updateField('target_margin_percentage', e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex items-center">
                  <Badge variant="outline" className="text-blue-600">
                    {calculateSellingPrice()}€
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Marge souhaitée pour le calcul automatique du prix
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="margin_percentage">
                Marge réelle (%)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="margin_percentage"
                  type="number"
                  step="0.01"
                  value={formData.margin_percentage}
                  onChange={(e) => updateField('margin_percentage', e.target.value)}
                  placeholder="0.00"
                  disabled
                  className="bg-gray-50"
                />
                <Calculator className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Marge calculée automatiquement (lecture seule)
              </p>
            </div>
          </div>

          {/* Résumé des calculs */}
          {(formData.cost_price || formData.price_ht) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Résumé financier :</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Coût</div>
                      <div className="font-semibold">{formData.cost_price || '0'}€ HT</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Vente</div>
                      <div className="font-semibold">{formData.price_ht || '0'}€ HT</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Marge</div>
                      <div className="font-semibold">{formData.margin_percentage || '0'}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Bénéfice</div>
                      <div className="font-semibold text-green-600">
                        {((parseFloat(formData.price_ht || '0') - parseFloat(formData.cost_price || '0')).toFixed(2))}€
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Outils de calcul rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outils de calcul</CardTitle>
          <CardDescription>
            Calculateurs pour faciliter la tarification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Calcul par marge cible
              </div>
              <div className="text-xs text-blue-600">
                Saisissez le prix d'achat et la marge cible pour calculer automatiquement le prix de vente
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">
                Calcul de marge réelle
              </div>
              <div className="text-xs text-green-600">
                La marge réelle se calcule automatiquement basée sur les prix d'achat et de vente
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}