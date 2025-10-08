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

  // Calcul du prix minimum de vente selon la logique Vérone
  const calculateMinimumSellingPrice = () => {
    const costPrice = parseFloat(formData.cost_price || '0')
    const targetMargin = parseFloat(formData.target_margin_percentage || '0')

    if (costPrice > 0 && targetMargin >= 0) {
      // Formule: Prix d'achat × (1 + marge_cible/100)
      const minimumPrice = costPrice * (1 + targetMargin / 100)
      return minimumPrice.toFixed(2)
    }
    return '0'
  }

  const calculateGrossProfit = () => {
    const costPrice = parseFloat(formData.cost_price || '0')
    const minimumPrice = parseFloat(calculateMinimumSellingPrice())

    if (costPrice > 0 && minimumPrice > 0) {
      const profit = minimumPrice - costPrice
      return profit.toFixed(2)
    }
    return '0'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tarification et coûts
          </CardTitle>
          <CardDescription>
            Prix d'achat et calcul automatique du prix minimum de vente (HT)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prix d'achat */}
          <div className="space-y-2 max-w-md">
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

          {/* Prix minimum de vente calculé */}
          <div className="space-y-2">
            <Label className="text-green-700 font-medium">
              Prix minimum de vente HT (€)
            </Label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-green-600" />
                <span className="text-lg font-semibold text-green-700">
                  {calculateMinimumSellingPrice()}€ HT
                </span>
              </div>
            </div>
            <p className="text-xs text-green-600">
              Calculé automatiquement : Prix d'achat × (1 + Marge cible)
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
                  placeholder="Ex: 100 pour doubler le prix d'achat"
                />
                <div className="flex items-center">
                  <Badge variant="outline" className="text-green-600 bg-green-50">
                    {calculateMinimumSellingPrice()}€ HT
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Exemple: 100% = double le prix d'achat, 50% = +50% du prix d'achat
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-700">
                Profit brut (€)
              </Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-700">
                    +{calculateGrossProfit()}€ HT
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600">
                Profit brut = Prix minimum - Prix d'achat
              </p>
            </div>
          </div>

          {/* Résumé des calculs */}
          {(formData.cost_price || formData.target_margin_percentage) && (
            <Alert className="bg-gray-50 border-gray-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Résumé financier Vérone :</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Prix d'achat</div>
                      <div className="font-semibold">{formData.cost_price || '0'}€ HT</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Marge cible</div>
                      <div className="font-semibold text-black">{formData.target_margin_percentage || '0'}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Prix minimum</div>
                      <div className="font-semibold text-green-600">{calculateMinimumSellingPrice()}€ HT</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Profit brut</div>
                      <div className="font-semibold text-blue-600">
                        +{calculateGrossProfit()}€ HT
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Guide logique métier Vérone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logique métier Vérone</CardTitle>
          <CardDescription>
            Comment fonctionne le calcul automatique du prix minimum de vente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">
                Prix minimum de vente
              </div>
              <div className="text-xs text-green-600">
                Calculé automatiquement : Prix d'achat HT × (1 + Marge cible/100)
                <br />
                Exemple : 10€ × (1 + 100/100) = 20€ HT minimum
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Pas de prix de vente fixe
              </div>
              <div className="text-xs text-blue-600">
                Vérone calcule uniquement le prix minimum basé sur vos coûts et marge cible.
                Tout est en HT, pas de TVA.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}