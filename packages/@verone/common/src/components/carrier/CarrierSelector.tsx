'use client';

import { Truck, MapPin, Package, FileText, CheckCircle2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';

export type ShippingMethod =
  | 'packlink'
  | 'mondial_relay'
  | 'chronotruck'
  | 'manual';
export type ShipmentType = 'parcel' | 'pallet';

interface CarrierOption {
  method: ShippingMethod;
  name: string;
  description: string;
  icon: typeof Truck;
  supportedTypes: ShipmentType[];
  integrationType: 'api' | 'manual';
  recommended?: boolean;
}

const CARRIER_OPTIONS: CarrierOption[] = [
  {
    method: 'packlink',
    name: 'Packlink PRO',
    description:
      'Agrégateur multi-transporteurs avec meilleur prix automatique',
    icon: Truck,
    supportedTypes: ['parcel'],
    integrationType: 'api',
    recommended: true,
  },
  {
    method: 'mondial_relay',
    name: 'Mondial Relay',
    description: 'Livraison en points relais économique',
    icon: MapPin,
    supportedTypes: ['parcel'],
    integrationType: 'manual', // ou 'api' selon configuration
  },
  {
    method: 'chronotruck',
    name: 'Chronotruck',
    description: 'Transport de palettes professionnel',
    icon: Package,
    supportedTypes: ['pallet'],
    integrationType: 'manual',
  },
  {
    method: 'manual',
    name: 'Autre transporteur',
    description: 'Saisie manuelle libre (tous types)',
    icon: FileText,
    supportedTypes: ['parcel', 'pallet'],
    integrationType: 'manual',
  },
];

interface CarrierSelectorProps {
  selected: ShippingMethod | null;
  onSelect: (method: ShippingMethod) => void;
  disabled?: boolean;
}

export function CarrierSelector({
  selected,
  onSelect,
  disabled,
}: CarrierSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Choisir un transporteur</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            <Truck className="h-3 w-3 mr-1" />
            API
          </Badge>
          <span className="text-xs text-gray-500">= Automatique</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARRIER_OPTIONS.map(carrier => {
          const Icon = carrier.icon;
          const isSelected = selected === carrier.method;
          const isApi = carrier.integrationType === 'api';

          return (
            <Card
              key={carrier.method}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-black' : 'hover:border-gray-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelect(carrier.method)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-gray-100'}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{carrier.name}</h4>
                        {carrier.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommandé
                          </Badge>
                        )}
                      </div>
                      {isApi && (
                        <Badge variant="outline" className="text-xs mt-1">
                          <Truck className="h-3 w-3 mr-1" />
                          API
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {carrier.description}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Types supportés:
                  </span>
                  <div className="flex gap-1">
                    {carrier.supportedTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type === 'parcel' ? 'Colis' : 'Palettes'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                {CARRIER_OPTIONS.find(c => c.method === selected)?.name}{' '}
                sélectionné
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Remplissez le formulaire ci-dessous pour créer l'expédition
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
