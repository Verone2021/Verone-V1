import type { Dispatch, SetStateAction } from 'react';

import type { ShipmentItem } from '@verone/types';

import type { PackageInfo } from './types';

// Sync handlers for items & packages — extracted to keep useShipmentWizard under 400L

export function makeQuantityChangeHandler(
  setItems: Dispatch<SetStateAction<ShipmentItem[]>>
) {
  return (itemId: string, value: string) => {
    const num = parseInt(value) || 0;
    setItems(prev =>
      prev.map(i =>
        i.sales_order_item_id === itemId
          ? {
              ...i,
              quantity_to_ship: Math.max(
                0,
                Math.min(num, i.quantity_remaining)
              ),
            }
          : i
      )
    );
  };
}

export function makeShipAllHandler(
  setItems: Dispatch<SetStateAction<ShipmentItem[]>>
) {
  return () => {
    setItems(prev =>
      prev.map(i => ({
        ...i,
        quantity_to_ship: Math.min(i.quantity_remaining, i.stock_available),
      }))
    );
  };
}

export function makeAddPackageHandler(
  setPackages: Dispatch<SetStateAction<PackageInfo[]>>
) {
  return () => {
    setPackages(prev => [
      ...prev,
      { weight: 5, width: 30, height: 30, length: 30 },
    ]);
  };
}

export function makeRemovePackageHandler(
  setPackages: Dispatch<SetStateAction<PackageInfo[]>>
) {
  return (idx: number) => {
    setPackages(prev => prev.filter((_, i) => i !== idx));
  };
}

export function makePackageChangeHandler(
  setPackages: Dispatch<SetStateAction<PackageInfo[]>>
) {
  return (idx: number, field: keyof PackageInfo, value: string) => {
    setPackages(prev =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: parseFloat(value) || 0 } : p
      )
    );
  };
}
