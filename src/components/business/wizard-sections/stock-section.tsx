"use client"

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Alert, AlertDescription } from '../../ui/alert'
import { Package, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import { WizardFormData } from '../complete-product-wizard'

interface StockSectionProps {
  formData: WizardFormData
  setFormData: (data: WizardFormData) => void
  onSave: () => void
}

export function StockSection({
  formData,
  setFormData,
  onSave
}: StockSectionProps) {

  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  // Calculs de statut stock
  const stockReal = parseInt(formData.stock_real || '0')
  const stockMin = parseInt(formData.min_stock || '0')
  const reorderPoint = parseInt(formData.reorder_point || '0')

  const getStockStatus = () => {
    if (stockReal <= 0) return { status: 'out', label: 'Rupture', color: 'text-red-600' }
    if (stockReal <= stockMin) return { status: 'low', label: 'Stock faible', color: 'text-orange-600' }
    if (stockReal <= reorderPoint) return { status: 'reorder', label: 'À réapprovisionner', color: 'text-yellow-600' }
    return { status: 'ok', label: 'Stock correct', color: 'text-green-600' }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Gestion du stock
          </CardTitle>
          <CardDescription>
            Paramètres de stock et inventaire pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stock actuel et gestion */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_real">
                Stock physique réel
              </Label>
              <Input
                id="stock_real"
                type="number"
                min="0"
                value={formData.stock_real}
                onChange={(e) => updateField('stock_real', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Quantité réellement présente en entrepôt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">
                Stock total (legacy)
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => updateField('stock_quantity', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Stock total actuel (champ legacy)
              </p>
            </div>
          </div>

          {/* Stock prévisionnel */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_forecasted_in" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                Stock prévu en entrée
              </Label>
              <Input
                id="stock_forecasted_in"
                type="number"
                min="0"
                value={formData.stock_forecasted_in}
                onChange={(e) => updateField('stock_forecasted_in', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Quantité en commande chez les fournisseurs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_forecasted_out" className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                Stock prévu en sortie
              </Label>
              <Input
                id="stock_forecasted_out"
                type="number"
                min="0"
                value={formData.stock_forecasted_out}
                onChange={(e) => updateField('stock_forecasted_out', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Quantité réservée par les commandes clients
              </p>
            </div>
          </div>

          {/* Seuils de réapprovisionnement */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_stock" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-orange-600" />
                Stock minimum critique
              </Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => updateField('min_stock', e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-gray-500">
                Seuil d'alerte stock critique
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">
                Niveau minimum (legacy)
              </Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => updateField('min_stock_level', e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-gray-500">
                Niveau de stock minimum (champ legacy)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">
                Point de réapprovisionnement
              </Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => updateField('reorder_point', e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-gray-500">
                Seuil pour déclencher une commande
              </p>
            </div>
          </div>

          {/* Statut du stock calculé */}
          {(formData.stock_real || formData.min_stock || formData.reorder_point) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Analyse du stock :</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Stock réel</div>
                      <div className="font-semibold">{stockReal} unités</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Statut</div>
                      <div className={`font-semibold ${stockStatus.color}`}>
                        {stockStatus.label}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Stock disponible</div>
                      <div className="font-semibold">
                        {Math.max(0, stockReal - parseInt(formData.stock_forecasted_out || '0'))} unités
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Stock futur</div>
                      <div className="font-semibold text-blue-600">
                        {stockReal + parseInt(formData.stock_forecasted_in || '0') - parseInt(formData.stock_forecasted_out || '0')} unités
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Aide et recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommandations stock</CardTitle>
          <CardDescription>
            Bonnes pratiques pour la gestion des stocks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Point de réapprovisionnement
              </div>
              <div className="text-xs text-blue-600">
                Définissez-le selon le délai fournisseur et la consommation moyenne.
                Généralement 2-3 fois le stock minimum.
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-2">
                Stock minimum critique
              </div>
              <div className="text-xs text-orange-600">
                Correspond au stock de sécurité pour éviter les ruptures.
                Basé sur la variabilité de la demande.
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">
                Stock prévisionnel
              </div>
              <div className="text-xs text-green-600">
                Utilisé pour calculer le stock disponible réel et anticiper les besoins.
                Mis à jour automatiquement par les commandes.
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-800 mb-2">
                Optimisation
              </div>
              <div className="text-xs text-purple-600">
                Analysez régulièrement les mouvements pour ajuster les seuils
                et optimiser le niveau de stock.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}