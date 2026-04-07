'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import {
  Truck,
  MapPin,
  HandMetal,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import type { DeliveryMethod } from './types';

interface StepDeliveryMethodProps {
  deliveryMethod: DeliveryMethod | null;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  manualCarrier: string;
  setManualCarrier: (v: string) => void;
  manualTracking: string;
  setManualTracking: (v: string) => void;
  manualShippingCost: number | null;
  setManualShippingCost: (v: number | null) => void;
  notes: string;
  setNotes: (v: string) => void;
  validating: boolean;
  onBack: () => void;
  onNext: () => void;
  onValidateSimple: () => void;
}

export function StepDeliveryMethod({
  deliveryMethod,
  setDeliveryMethod,
  manualCarrier,
  setManualCarrier,
  manualTracking,
  setManualTracking,
  manualShippingCost,
  setManualShippingCost,
  notes,
  setNotes,
  validating,
  onBack,
  onNext,
  onValidateSimple,
}: StepDeliveryMethodProps) {
  const deliveryOptions = [
    {
      id: 'pickup' as const,
      label: 'Retrait client',
      desc: "Le client vient chercher a l'entrepot",
      icon: MapPin,
    },
    {
      id: 'hand_delivery' as const,
      label: 'Main propre',
      desc: 'Remise en main propre au client',
      icon: HandMetal,
    },
    {
      id: 'manual' as const,
      label: 'Expedition manuelle',
      desc: 'Autre transporteur (saisie manuelle)',
      icon: Package,
    },
    {
      id: 'packlink' as const,
      label: 'Packlink PRO',
      desc: 'Multi-transporteurs, meilleur prix auto',
      icon: Truck,
      recommended: true,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Truck className="h-4 w-4" />
        Mode de livraison
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {deliveryOptions.map(opt => {
          const Icon = opt.icon;
          const isSelected = deliveryMethod === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDeliveryMethod(opt.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{opt.label}</span>
                {'recommended' in opt && opt.recommended && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Recommande
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Manual mode: extra fields */}
      {deliveryMethod === 'manual' && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <Label>Transporteur</Label>
            <Input
              value={manualCarrier}
              onChange={e => setManualCarrier(e.target.value)}
              placeholder="Ex: Colissimo, DHL..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Numero de suivi (optionnel)</Label>
            <Input
              value={manualTracking}
              onChange={e => setManualTracking(e.target.value)}
              placeholder="Ex: 1Z999AA10123456784"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Cout transport HT (achat Verone)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={manualShippingCost ?? ''}
              onChange={e =>
                setManualShippingCost(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="Ex: 12.50"
              className="mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Cout paye par Verone au transporteur (jamais visible par le
              client)
            </p>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <ButtonV2 variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </ButtonV2>
        <div className="flex gap-2">
          {(deliveryMethod === 'pickup' ||
            deliveryMethod === 'hand_delivery' ||
            deliveryMethod === 'manual') && (
            <ButtonV2
              onClick={onValidateSimple}
              disabled={!deliveryMethod || validating}
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Valider expedition
            </ButtonV2>
          )}
          {deliveryMethod === 'packlink' && (
            <ButtonV2 onClick={onNext}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-1" />
            </ButtonV2>
          )}
        </div>
      </div>
    </div>
  );
}
