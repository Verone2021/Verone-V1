'use client';

import { Button, Card, CardContent, Input } from '@verone/ui';
import { Save, X, Trash2 } from 'lucide-react';

import {
  formatPrice,
  type StoragePricingTier,
} from '../../../hooks/use-linkme-storage';

interface PricingGridViewProps {
  tiers: StoragePricingTier[];
  editingId: string | null;
  editPrice: string;
  onEditStart: (tier: StoragePricingTier) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onEditPriceChange: (value: string) => void;
  onDelete: (id: string) => void;
  isUpdatePending: boolean;
}

export function PricingGridView({
  tiers,
  editingId,
  editPrice,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditPriceChange,
  onDelete,
  isUpdatePending,
}: PricingGridViewProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {tiers.map((tier, index) => (
        <Card key={tier.id} className="relative group">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-gray-600 mb-1 truncate">
              {tier.label ??
                `${tier.min_volume_m3} - ${tier.max_volume_m3 ?? '∞'} m³`}
            </p>
            <p className="text-[10px] text-gray-400 mb-2">
              {tier.min_volume_m3} à {tier.max_volume_m3 ?? '∞'} m³
            </p>
            {editingId === tier.id ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={e => onEditPriceChange(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditSave(tier.id)}
                  disabled={isUpdatePending}
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditCancel}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onEditStart(tier)}
                className="text-xl font-bold text-green-600 hover:text-green-700"
              >
                {formatPrice(tier.price_per_m3)}
              </button>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">par m³/mois</p>
          </CardContent>
          {/* Delete button - visible on hover, only for last tier */}
          {index === tiers.length - 1 && (
            <button
              onClick={() => onDelete(tier.id)}
              className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </Card>
      ))}
    </div>
  );
}
