'use client';

import { useState } from 'react';

import { FileText, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SalesOrder } from '@/shared/modules/orders/hooks';
// TODO: Réactiver lors Phase 2+ (module logistics désactivé)
// import { ShipmentRecapData, ShipmentType } from './shipment-recap-modal'
type ShipmentRecapData = any;
type ShipmentType = string;

interface ManualShipmentFormProps {
  order: SalesOrder;
  onComplete: (data: ShipmentRecapData) => void;
  onBack: () => void;
}

export function ManualShipmentForm({
  order,
  onComplete,
  onBack,
}: ManualShipmentFormProps) {
  // Type expédition
  const [shipmentType, setShipmentType] = useState<ShipmentType>('parcel');

  // Transporteur
  const [carrierName, setCarrierName] = useState('');

  // Dimensions selon type
  const [weightKg, setWeightKg] = useState(0);
  const [lengthCm, setLengthCm] = useState(0);
  const [widthCm, setWidthCm] = useState(0);
  const [heightCm, setHeightCm] = useState(0);

  // Tracking
  const [tracking, setTracking] = useState('');

  // Coûts
  const [costPaid, setCostPaid] = useState(0);
  const [costCharged, setCostCharged] = useState(0);
  const [notes, setNotes] = useState('');

  const canSubmit = (): boolean => {
    return carrierName.trim() !== '' && weightKg > 0;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    const recapData: ShipmentRecapData = {
      orderId: order.id,
      orderNumber: order.order_number || '',
      shippingMethod: 'manual',
      carrierName: carrierName,
      shipmentType: shipmentType,
      parcels: [
        {
          number: 1,
          type: shipmentType,
          weight_kg: weightKg,
          length_cm: lengthCm,
          width_cm: widthCm,
          height_cm: heightCm,
        },
      ],
      costPaid,
      costCharged,
      trackingNumber: tracking || undefined,
      notes: notes || undefined,
    };

    onComplete(recapData);
  };

  // Dimensions suggérées selon type
  const handleTypeChange = (type: ShipmentType) => {
    setShipmentType(type);

    // Pré-remplir dimensions standards
    if (type === 'pallet') {
      setLengthCm(120);
      setWidthCm(80);
      setHeightCm(150);
    } else {
      setLengthCm(0);
      setWidthCm(0);
      setHeightCm(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête Manuel */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Expédition Manuelle
              </h3>
              <p className="text-sm text-gray-700">
                Saisie libre pour tout autre transporteur (Colissimo, UPS,
                Geodis, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type d'expédition */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Type d'expédition *</h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeChange('parcel')}
              className={`p-4 border-2 rounded-lg transition-all ${
                shipmentType === 'parcel'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Package className="h-6 w-6 mx-auto mb-2" />
              <p className="font-semibold">Colis</p>
              <p className="text-xs mt-1 opacity-80">Manutention manuelle</p>
            </button>

            <button
              onClick={() => handleTypeChange('pallet')}
              className={`p-4 border-2 rounded-lg transition-all ${
                shipmentType === 'pallet'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Package className="h-6 w-6 mx-auto mb-2" />
              <p className="font-semibold">Palette</p>
              <p className="text-xs mt-1 opacity-80">Manutention chariot</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transporteur */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom du transporteur *
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          value={carrierName}
          onChange={e => setCarrierName(e.target.value)}
          placeholder="Ex: Colissimo, UPS, Geodis, TNT..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Nom du transporteur utilisé pour cette expédition
        </p>
      </div>

      {/* Dimensions et poids */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              {shipmentType === 'parcel' ? 'Colis' : 'Palette'}
            </h3>
            <Badge variant="outline">
              {shipmentType === 'parcel' ? 'Colis standard' : 'Palette EUR'}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Poids */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Poids (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={weightKg || ''}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 5.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                {shipmentType === 'parcel'
                  ? 'Poids du colis en kilogrammes'
                  : 'Poids total palette chargée (max recommandé : 240 kg)'}
              </p>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Longueur (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                  value={lengthCm || ''}
                  onChange={e => setLengthCm(parseInt(e.target.value) || 0)}
                  placeholder={shipmentType === 'pallet' ? '120' : 'L'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Largeur (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                  value={widthCm || ''}
                  onChange={e => setWidthCm(parseInt(e.target.value) || 0)}
                  placeholder={shipmentType === 'pallet' ? '80' : 'l'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hauteur (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                  value={heightCm || ''}
                  onChange={e => setHeightCm(parseInt(e.target.value) || 0)}
                  placeholder={shipmentType === 'pallet' ? '150' : 'h'}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {shipmentType === 'parcel'
                ? 'Dimensions optionnelles'
                : 'Palette EUR standard : 120 × 80 cm base'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tracking */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Numéro de suivi
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md font-mono"
          value={tracking}
          onChange={e => setTracking(e.target.value)}
          placeholder="Numéro de tracking (optionnel)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Numéro de suivi fourni par le transporteur (si disponible)
        </p>
      </div>

      {/* Coûts */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Coûts de livraison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Coût payé au transporteur (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={costPaid || ''}
                onChange={e => setCostPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant facturé par le transporteur
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Coût facturé au client (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                value={costCharged || ''}
                onChange={e => setCostCharged(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Montant facturé au client (0 si inclus)
              </p>
            </div>
          </div>

          {/* Marge calculée */}
          {(costPaid > 0 || costCharged > 0) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Marge calculée
              </span>
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
        <label className="block text-sm font-medium mb-2">
          Notes (optionnel)
        </label>
        <textarea
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Informations complémentaires sur l'expédition..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <ButtonV2 variant="outline" onClick={onBack}>
          ← Retour
        </ButtonV2>
        <ButtonV2 onClick={handleSubmit} disabled={!canSubmit()} size="lg">
          Continuer vers le récapitulatif →
        </ButtonV2>
      </div>

      {!canSubmit() && (
        <p className="text-sm text-red-600 text-center">
          ⚠️ Veuillez renseigner le nom du transporteur et le poids
        </p>
      )}
    </div>
  );
}
