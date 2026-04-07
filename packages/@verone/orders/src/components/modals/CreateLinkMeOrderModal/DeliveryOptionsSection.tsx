'use client';

import { Truck, CalendarDays } from 'lucide-react';

import { cn } from '@verone/utils';

interface DeliveryOptionsSectionProps {
  expectedDeliveryDate: string;
  onExpectedDeliveryDateChange: (v: string) => void;
  isShoppingCenterDelivery: boolean;
  onIsShoppingCenterDeliveryChange: (v: boolean) => void;
  acceptsSemiTruck: boolean;
  onAcceptsSemiTruckChange: (v: boolean) => void;
}

export function DeliveryOptionsSection({
  expectedDeliveryDate,
  onExpectedDeliveryDateChange,
  isShoppingCenterDelivery,
  onIsShoppingCenterDeliveryChange,
  acceptsSemiTruck,
  onAcceptsSemiTruckChange,
}: DeliveryOptionsSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Truck className="h-4 w-4 inline mr-1" />
        Options de livraison
      </label>
      <div className="space-y-4">
        {/* Date de livraison souhaitée */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            <CalendarDays className="h-3 w-3 inline mr-1" />
            Date souhaitée
          </label>
          <input
            type="date"
            value={expectedDeliveryDate}
            onChange={e => onExpectedDeliveryDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Centre commercial */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onIsShoppingCenterDeliveryChange(!isShoppingCenterDelivery)
            }
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isShoppingCenterDelivery ? 'bg-purple-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isShoppingCenterDelivery ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Centre commercial
            </p>
            <p className="text-xs text-gray-500">Logistique spéciale requise</p>
          </div>
        </div>

        {/* Semi-remorque */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAcceptsSemiTruckChange(!acceptsSemiTruck)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              acceptsSemiTruck ? 'bg-purple-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                acceptsSemiTruck ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Semi-remorque accepté
            </p>
            <p className="text-xs text-gray-500">
              Le site accepte les semi-remorques
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
