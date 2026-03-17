'use client';

import { useState } from 'react';

import { Truck, ExternalLink, AlertCircle } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import type { SalesOrder } from '@verone/orders/hooks';
// import { ShipmentRecapData } from './shipment-recap-modal'

// Temporary type until shipment-recap-modal is implemented
type ShipmentRecapData = unknown;

interface ChronotruckShipmentFormProps {
  order: SalesOrder;
  onComplete: (data: ShipmentRecapData) => void;
  onBack: () => void;
}

export function ChronotruckShipmentForm({
  order,
  onComplete,
  onBack,
}: ChronotruckShipmentFormProps) {
  // Données palettes (1 palette par défaut)
  const [paletteCount, setPaletteCount] = useState(1);
  const [weightPerPallet, setWeightPerPallet] = useState(0);
  const [heightCm, setHeightCm] = useState(150); // Hauteur standard palette chargée

  // Données Chronotruck
  const [chronotruckRef, setChronotruckRef] = useState('');
  const [chronotruckUrl, setChronotruckUrl] = useState('');

  // Coûts
  const [costPaid, setCostPaid] = useState(0);
  const [costCharged, setCostCharged] = useState(0);
  const [notes, setNotes] = useState('');

  const canSubmit = (): boolean => {
    return (
      paletteCount > 0 &&
      weightPerPallet > 0 &&
      weightPerPallet <= 240 && // Limite poids palette
      chronotruckRef.trim() !== '' // Référence obligatoire
    );
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    // Créer tableau de palettes (toutes identiques pour simplification)
    const parcels = Array.from({ length: paletteCount }, (_, idx) => ({
      number: idx + 1,
      type: 'pallet' as const,
      weight_kg: weightPerPallet,
      length_cm: 120, // Palette EUR standard
      width_cm: 80,
      height_cm: heightCm,
    }));

    const recapData: ShipmentRecapData = {
      orderId: order.id,
      orderNumber: order.order_number || '',
      shippingMethod: 'chronotruck',
      carrierName: 'Chronotruck',
      shipmentType: 'pallet',
      parcels,
      costPaid,
      costCharged,
      notes: notes || undefined,
      metadata: {
        chronotruck_reference: chronotruckRef,
        chronotruck_palette_count: paletteCount,
        chronotruck_url: chronotruckUrl || undefined,
      },
    };

    onComplete(recapData);
  };

  const totalWeight = paletteCount * weightPerPallet;

  return (
    <div className="space-y-6">
      {/* En-tête Chronotruck avec lien externe */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  Chronotruck - Transport de Palettes
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Créez d'abord votre réservation sur l'application Chronotruck
                </p>
              </div>
            </div>

            <a
              href="https://app.chronotruck.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir Chronotruck
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">📝 Instructions :</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Créez votre réservation sur app.chronotruck.com</li>
                <li>Notez la référence fournie par Chronotruck</li>
                <li>Renseignez cette référence ci-dessous</li>
                <li>Complétez les informations de poids et dimensions</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Référence Chronotruck */}
      <Card className="border-2 border-orange-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">
            Référence Chronotruck *
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Référence de réservation Chronotruck *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md font-mono"
                value={chronotruckRef}
                onChange={e => setChronotruckRef(e.target.value)}
                placeholder="Ex: CHT-2025-XXXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                Référence fournie par Chronotruck après création de la
                réservation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Lien de suivi Chronotruck (optionnel)
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border rounded-md"
                value={chronotruckUrl}
                onChange={e => setChronotruckUrl(e.target.value)}
                placeholder="https://app.chronotruck.com/tracking/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                URL de suivi fournie par Chronotruck (si disponible)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Palettes */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">
            Configuration des palettes
          </h3>

          <div className="space-y-4">
            {/* Nombre de palettes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre de palettes *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full px-3 py-2 border rounded-md"
                value={paletteCount || ''}
                onChange={e => setPaletteCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500 mt-1">
                De 1 à 10 palettes par expédition
              </p>
            </div>

            {/* Poids par palette */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Poids par palette (kg) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="240"
                className="w-full px-3 py-2 border rounded-md"
                value={weightPerPallet || ''}
                onChange={e =>
                  setWeightPerPallet(parseFloat(e.target.value) || 0)
                }
                placeholder="Ex: 180"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 240 kg par palette • Poids total :{' '}
                <strong>{totalWeight} kg</strong>
              </p>
            </div>

            {/* Hauteur chargée */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Hauteur chargée (cm)
              </label>
              <input
                type="number"
                min="10"
                max="180"
                className="w-full px-3 py-2 border rounded-md"
                value={heightCm || ''}
                onChange={e => setHeightCm(parseInt(e.target.value) || 150)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Hauteur totale palette + marchandise (recommandé : 150-180 cm)
              </p>
            </div>

            {/* Dimensions fixes palette EUR */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Dimensions palette EUR standard :
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="outline">Longueur : 120 cm</Badge>
                <Badge variant="outline">Largeur : 80 cm</Badge>
                <Badge variant="outline">Hauteur base : 10 cm</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coûts */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Coûts de livraison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Coût payé à Chronotruck (€)
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
                Montant facturé par Chronotruck
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
          placeholder="Informations complémentaires sur l'expédition par palette..."
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
          ⚠️ Veuillez renseigner la référence Chronotruck, le poids et le nombre
          de palettes
        </p>
      )}
    </div>
  );
}
