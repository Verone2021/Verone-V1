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

  // Calculs de statut stock basés sur min_stock uniquement
  const stockReal = parseInt(formData.stock_real || '0')
  const stockMin = parseInt(formData.min_stock || '0')
  const reorderPoint = parseInt(formData.reorder_point || '0')
  const stockForecastedIn = parseInt(formData.stock_forecasted_in || '0')
  const stockForecastedOut = parseInt(formData.stock_forecasted_out || '0')

  const getStockStatus = () => {
    if (stockReal <= 0) return {
      status: 'rupture',
      label: 'Rupture de stock',
      color: 'text-red-600',
      icon: '🚨'
    }
    if (stockReal <= stockMin) return {
      status: 'critique',
      label: 'Stock critique',
      color: 'text-orange-600',
      icon: '⚠️'
    }
    if (stockReal <= reorderPoint) return {
      status: 'reappro',
      label: 'À réapprovisionner',
      color: 'text-yellow-600',
      icon: '📦'
    }
    return {
      status: 'ok',
      label: 'Stock correct',
      color: 'text-green-600',
      icon: '✅'
    }
  }

  // Calculer le stock disponible (réel - réservé)
  const stockAvailable = Math.max(0, stockReal - stockForecastedOut)
  // Calculer le stock projeté (réel + entrant - sortant)
  const stockProjected = stockReal + stockForecastedIn - stockForecastedOut

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
          {/* STOCKS AUTOMATIQUES - LECTURE SEULE */}
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center mb-3">
              <Info className="h-4 w-4 mr-2 text-blue-600" />
              <h4 className="font-medium text-blue-800">Stocks calculés automatiquement</h4>
            </div>
            <p className="text-xs text-blue-600 mb-4">
              Ces valeurs sont mises à jour automatiquement par les mouvements de stock, commandes et réceptions.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Stock physique réel
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={`${formData.stock_real || '0'} unités`}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ⚡ Calculé automatiquement par les mouvements de stock
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Stock total
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={`${formData.stock_quantity || '0'} unités`}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ⚡ Synchronisé automatiquement avec le stock réel
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  Stock prévu en entrée
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={`${formData.stock_forecasted_in || '0'} unités`}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ⚡ Calculé par les commandes fournisseurs en cours
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                  Stock prévu en sortie
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={`${formData.stock_forecasted_out || '0'} unités`}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ⚡ Calculé par les commandes clients confirmées
                </p>
              </div>
            </div>
          </div>

          {/* SEUILS CONFIGURABLES - MODIFIABLES PAR L'UTILISATEUR */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-4 w-4 mr-2 text-green-600" />
              <h4 className="font-medium text-green-800">Paramètres configurables</h4>
            </div>
            <p className="text-xs text-green-600 mb-4">
              Ces seuils sont configurés par vous selon vos besoins métier et stratégie de stock.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="min_stock" className="flex items-center text-base font-medium">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                  Stock minimum critique
                </Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => updateField('min_stock', e.target.value)}
                  placeholder="5"
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
                <div className="text-xs space-y-1">
                  <p className="text-orange-600 font-medium">
                    ⚠️ Seuil d'alerte critique - Déclenche statut "Stock faible"
                  </p>
                  <p className="text-gray-500">
                    Stock de sécurité minimum pour éviter les ruptures
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_point" className="flex items-center text-base font-medium">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                  Point de réapprovisionnement
                </Label>
                <Input
                  id="reorder_point"
                  type="number"
                  min="0"
                  value={formData.reorder_point}
                  onChange={(e) => updateField('reorder_point', e.target.value)}
                  placeholder="10"
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="text-xs space-y-1">
                  <p className="text-blue-600 font-medium">
                    📦 Seuil de récommande - Déclenche statut "À réapprovisionner"
                  </p>
                  <p className="text-gray-500">
                    Généralement 2-3x le stock minimum selon délai fournisseur
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ANALYSE ET STATUT DU STOCK */}
          {(formData.stock_real || formData.min_stock || formData.reorder_point) && (
            <Alert className="bg-slate-50 border-slate-200">
              <div className="flex items-center">
                {stockStatus.icon && <span className="text-lg mr-2">{stockStatus.icon}</span>}
                <Info className="h-4 w-4 mr-2" />
                <span className="font-medium">Analyse automatique du stock</span>
              </div>
              <AlertDescription className="mt-3">
                <div className="space-y-3">
                  {/* Statut principal */}
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">Statut actuel:</span>
                    <span className={`font-semibold ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                  {/* Métriques détaillées */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-3 rounded border">
                    <div>
                      <div className="text-gray-600 text-xs">Stock physique</div>
                      <div className="font-semibold text-lg">{stockReal}</div>
                      <div className="text-xs text-gray-500">unités en entrepôt</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Stock disponible</div>
                      <div className="font-semibold text-lg text-green-600">{stockAvailable}</div>
                      <div className="text-xs text-gray-500">vendable immédiatement</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Stock projeté</div>
                      <div className={`font-semibold text-lg ${stockProjected > stockReal ? 'text-blue-600' : stockProjected < stockReal ? 'text-orange-600' : 'text-gray-700'}`}>
                        {stockProjected}
                      </div>
                      <div className="text-xs text-gray-500">après mouvements prévus</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Seuils configurés</div>
                      <div className="text-sm space-y-1">
                        <div>Min: <span className="font-medium text-orange-600">{stockMin}</span></div>
                        <div>Réappro: <span className="font-medium text-blue-600">{reorderPoint}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Alertes et recommandations */}
                  {stockStatus.status === 'rupture' && (
                    <div className="bg-red-50 text-red-800 p-2 rounded text-xs">
                      🚨 <strong>Action urgente requise:</strong> Stock en rupture - Réapprovisionnement prioritaire
                    </div>
                  )}
                  {stockStatus.status === 'critique' && (
                    <div className="bg-orange-50 text-orange-800 p-2 rounded text-xs">
                      ⚠️ <strong>Stock critique:</strong> Niveau inférieur au minimum de sécurité ({stockMin} unités)
                    </div>
                  )}
                  {stockStatus.status === 'reappro' && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-xs">
                      📦 <strong>Réapprovisionnement recommandé:</strong> Stock sous le point de commande ({reorderPoint} unités)
                    </div>
                  )}
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