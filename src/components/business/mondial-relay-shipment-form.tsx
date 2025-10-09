'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, AlertCircle } from 'lucide-react'
import { SalesOrder } from '@/hooks/use-sales-orders'
import { ShipmentRecapData } from './shipment-recap-modal'

interface MondialRelayShipmentFormProps {
  order: SalesOrder
  onComplete: (data: ShipmentRecapData) => void
  onBack: () => void
}

export function MondialRelayShipmentForm({ order, onComplete, onBack }: MondialRelayShipmentFormProps) {
  // Données colis
  const [weightKg, setWeightKg] = useState(0)
  const [lengthCm, setLengthCm] = useState(0)
  const [widthCm, setWidthCm] = useState(0)
  const [heightCm, setHeightCm] = useState(0)

  // Point relais
  const [relayPointId, setRelayPointId] = useState('')
  const [relayPointName, setRelayPointName] = useState('')
  const [relayPointAddress, setRelayPointAddress] = useState('')

  // Tracking
  const [tracking, setTracking] = useState('')

  // Coûts
  const [costPaid, setCostPaid] = useState(0)
  const [costCharged, setCostCharged] = useState(0)
  const [notes, setNotes] = useState('')

  const canSubmit = (): boolean => {
    return (
      weightKg > 0 &&
      weightKg <= 30 && // Limite Mondial Relay
      relayPointName.trim() !== '' // Nom point relais obligatoire
    )
  }

  const handleSubmit = () => {
    if (!canSubmit()) return

    const recapData: ShipmentRecapData = {
      orderId: order.id,
      orderNumber: order.order_number || '',
      shippingMethod: 'mondial_relay',
      carrierName: 'Mondial Relay',
      shipmentType: 'parcel',
      parcels: [
        {
          number: 1,
          type: 'parcel',
          weight_kg: weightKg,
          length_cm: lengthCm,
          width_cm: widthCm,
          height_cm: heightCm
        }
      ],
      costPaid,
      costCharged,
      trackingNumber: tracking || undefined,
      notes: notes || undefined,
      metadata: {
        relay_point_id: relayPointId || undefined,
        relay_point_name: relayPointName,
        relay_point_address: relayPointAddress || undefined
      }
    }

    onComplete(recapData)
  }

  return (
    <div className="space-y-6">
      {/* En-tête Mondial Relay */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Mondial Relay - Livraison en Point Relais</h3>
              <p className="text-sm text-yellow-700">
                Livraison économique dans un point relais proche du client
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note API */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">📋 Saisie manuelle</p>
              <p className="text-blue-800">
                Sélectionnez le point relais via l'interface Mondial Relay ou depuis votre système existant,
                puis renseignez les informations ci-dessous.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point Relais */}
      <Card className="border-2 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-lg">Point Relais *</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom du point relais *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={relayPointName}
                onChange={(e) => setRelayPointName(e.target.value)}
                placeholder="Ex: RELAY Paris 15 - Tabac Presse"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nom commercial du point relais sélectionné
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Adresse complète</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
                value={relayPointAddress}
                onChange={(e) => setRelayPointAddress(e.target.value)}
                placeholder="15 Rue de la Convention, 75015 Paris"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adresse complète pour identification du point relais
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ID Point Relais (optionnel)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md font-mono"
                value={relayPointId}
                onChange={(e) => setRelayPointId(e.target.value)}
                placeholder="Ex: FR-75015-001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique du point relais (si disponible)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensions et poids colis */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-lg">Colis</h3>
          </div>

          <div className="space-y-4">
            {/* Poids */}
            <div>
              <label className="block text-sm font-medium mb-2">Poids (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                className="w-full px-3 py-2 border rounded-md"
                value={weightKg || ''}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 5.5"
              />
              <p className="text-xs text-gray-500 mt-1">Max 30 kg pour Mondial Relay</p>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Longueur (cm)</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border rounded-md"
                  value={lengthCm || ''}
                  onChange={(e) => setLengthCm(parseInt(e.target.value) || 0)}
                  placeholder="L"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Largeur (cm)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border rounded-md"
                  value={widthCm || ''}
                  onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)}
                  placeholder="l"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hauteur (cm)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border rounded-md"
                  value={heightCm || ''}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                  placeholder="h"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Dimensions max Mondial Relay : 150 × 50 × 50 cm
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracking */}
      <div>
        <label className="block text-sm font-medium mb-2">Numéro de suivi</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md font-mono"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Ex: MR123456789FR"
        />
        <p className="text-xs text-gray-500 mt-1">
          Numéro de tracking fourni par Mondial Relay (optionnel)
        </p>
      </div>

      {/* Coûts */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Coûts de livraison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Coût payé à Mondial Relay (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={costPaid || ''}
                onChange={(e) => setCostPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Montant facturé par Mondial Relay</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coût facturé au client (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={costCharged || ''}
                onChange={(e) => setCostCharged(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Montant facturé au client (0 si inclus)</p>
            </div>
          </div>

          {/* Marge calculée */}
          {(costPaid > 0 || costCharged > 0) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Marge calculée</span>
              <span
                className={`font-semibold ${
                  costCharged - costPaid > 0
                    ? 'text-green-600'
                    : costCharged - costPaid < 0
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {costCharged - costPaid > 0 ? '+' : ''}
                {(costCharged - costPaid).toFixed(2)} €
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
        <textarea
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations complémentaires sur l'expédition en point relais..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          ← Retour
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit()} size="lg">
          Continuer vers le récapitulatif →
        </Button>
      </div>

      {!canSubmit() && (
        <p className="text-sm text-red-600 text-center">
          ⚠️ Veuillez renseigner le nom du point relais et le poids du colis
        </p>
      )}
    </div>
  )
}
