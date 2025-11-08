'use client';

import { useState } from 'react';

import { Plus, Trash2, Package } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import type { SalesOrder } from '@verone/orders/hooks';
// import { ShipmentRecapData } from './shipment-recap-modal'

// Temporary type until shipment-recap-modal is implemented
type ShipmentRecapData = any;

interface PacklinkShipmentFormProps {
  order: SalesOrder;
  onComplete: (data: ShipmentRecapData) => void;
  onBack: () => void;
}

interface ParcelFormData {
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
}

export function PacklinkShipmentForm({
  order,
  onComplete,
  onBack,
}: PacklinkShipmentFormProps) {
  const [parcels, setParcels] = useState<ParcelFormData[]>([
    { weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, items: [] },
  ]);
  const [costPaid, setCostPaid] = useState(0);
  const [costCharged, setCostCharged] = useState(0);
  const [notes, setNotes] = useState('');

  const addParcel = () => {
    setParcels([
      ...parcels,
      { weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, items: [] },
    ]);
  };

  const removeParcel = (index: number) => {
    if (parcels.length > 1) {
      setParcels(parcels.filter((_, i) => i !== index));
    }
  };

  const updateParcel = (
    index: number,
    field: keyof ParcelFormData,
    value: any
  ) => {
    const updated = [...parcels];
    updated[index] = { ...updated[index], [field]: value };
    setParcels(updated);
  };

  const canSubmit = (): boolean => {
    if (parcels.length === 0) return false;

    // Vérifier que chaque colis a au moins un poids
    return parcels.every(p => p.weight_kg > 0);
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    const recapData: ShipmentRecapData = {
      orderId: order.id,
      orderNumber: order.order_number || '',
      shippingMethod: 'packlink',
      carrierName: 'Packlink PRO',
      shipmentType: 'parcel',
      parcels: parcels.map((p, idx) => ({
        number: idx + 1,
        type: 'parcel',
        weight_kg: p.weight_kg,
        length_cm: p.length_cm,
        width_cm: p.width_cm,
        height_cm: p.height_cm,
      })),
      costPaid,
      costCharged,
      notes: notes || undefined,
    };

    onComplete(recapData);
  };

  return (
    <div className="space-y-6">
      {/* En-tête Packlink */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Packlink PRO - Agrégateur Multi-Transporteurs
              </h3>
              <p className="text-sm text-blue-700">
                L'API Packlink sélectionnera automatiquement le meilleur
                transporteur au meilleur prix
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des colis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Colis à expédier</h3>
          <ButtonV2 onClick={addParcel} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un colis
          </ButtonV2>
        </div>

        {parcels.map((parcel, idx) => (
          <Card key={idx} className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">Colis #{idx + 1}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {parcel.weight_kg > 0
                        ? `${parcel.weight_kg} kg`
                        : 'Poids non défini'}
                    </Badge>
                  </div>
                </div>

                {parcels.length > 1 && (
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParcel(idx)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ButtonV2>
                )}
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
                    max="30"
                    className="w-full px-3 py-2 border rounded-md"
                    value={parcel.weight_kg || ''}
                    onChange={e =>
                      updateParcel(
                        idx,
                        'weight_kg',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Ex: 5.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max 30 kg pour Packlink
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
                      value={parcel.length_cm || ''}
                      onChange={e =>
                        updateParcel(
                          idx,
                          'length_cm',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="L"
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
                      value={parcel.width_cm || ''}
                      onChange={e =>
                        updateParcel(
                          idx,
                          'width_cm',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="l"
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
                      value={parcel.height_cm || ''}
                      onChange={e =>
                        updateParcel(
                          idx,
                          'height_cm',
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="h"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Dimensions optionnelles mais recommandées
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
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
                Montant réel facturé par Packlink
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
          ⚠️ Veuillez renseigner le poids de tous les colis
        </p>
      )}
    </div>
  );
}
