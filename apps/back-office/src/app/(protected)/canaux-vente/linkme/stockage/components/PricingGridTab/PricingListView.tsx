'use client';

import { Input } from '@verone/ui';
import { Loader2, Save, X, Pencil, Trash2 } from 'lucide-react';

import {
  formatPrice,
  type StoragePricingTier,
} from '../../../hooks/use-linkme-storage';

interface PricingListViewProps {
  tiers: StoragePricingTier[];
  editingId: string | null;
  editPrice: string;
  isUpdatePending: boolean;
  onEditStart: (tier: StoragePricingTier) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onEditPriceChange: (value: string) => void;
  onDelete: (id: string) => void;
}

export function PricingListView({
  tiers,
  editingId,
  editPrice,
  isUpdatePending,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditPriceChange,
  onDelete,
}: PricingListViewProps): React.ReactElement {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-gray-600">
              Tranche
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-600">
              Volume
            </th>
            <th className="text-right px-3 py-2 font-medium text-gray-600">
              Prix/m³
            </th>
            <th className="text-right px-3 py-2 font-medium text-gray-600 w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tiers.map((tier, index) => (
            <tr key={tier.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">
                {tier.label ??
                  `${tier.min_volume_m3} - ${tier.max_volume_m3 ?? '∞'} m³`}
              </td>
              <td className="px-3 py-2 text-gray-500">
                {tier.min_volume_m3} à {tier.max_volume_m3 ?? '∞'} m³
              </td>
              <td className="px-3 py-2 text-right">
                {editingId === tier.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={e => onEditPriceChange(e.target.value)}
                      className="w-20 h-7 text-sm text-right"
                      autoFocus
                    />
                    <button
                      onClick={() => onEditSave(tier.id)}
                      disabled={isUpdatePending}
                      className="p-1.5 rounded hover:bg-green-50 disabled:opacity-50"
                      title="Sauvegarder"
                    >
                      {isUpdatePending ? (
                        <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={onEditCancel}
                      className="p-1.5 rounded hover:bg-red-50"
                      title="Annuler"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-green-600">
                    {formatPrice(tier.price_per_m3)}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {editingId !== tier.id && (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditStart(tier)}
                      className="p-1.5 rounded hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </button>
                    {index === tiers.length - 1 && (
                      <button
                        onClick={() => onDelete(tier.id)}
                        className="p-1.5 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
