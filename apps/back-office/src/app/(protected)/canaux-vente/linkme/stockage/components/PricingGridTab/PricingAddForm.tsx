'use client';

import { Button, Card, CardContent, Input } from '@verone/ui';
import { Loader2, Save, X } from 'lucide-react';

interface NewTierState {
  min: string;
  max: string;
  price: string;
  label: string;
}

interface PricingAddFormProps {
  newTier: NewTierState;
  onNewTierChange: (tier: NewTierState) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function PricingAddForm({
  newTier,
  onNewTierChange,
  onSave,
  onCancel,
  isPending,
}: PricingAddFormProps): React.ReactElement {
  return (
    <Card className="mb-4 border-dashed border-blue-300 bg-blue-50/30">
      <CardContent className="p-3">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[80px]">
            <label className="text-xs text-gray-500 mb-1 block">Min (m³)</label>
            <Input
              type="number"
              step="0.01"
              value={newTier.min}
              disabled
              className="h-8 text-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex-1 min-w-[80px]">
            <label className="text-xs text-gray-500 mb-1 block">Max (m³)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="∞"
              value={newTier.max}
              onChange={e =>
                onNewTierChange({ ...newTier, max: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[80px]">
            <label className="text-xs text-gray-500 mb-1 block">
              Prix/m³ (€)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="10.00"
              value={newTier.price}
              onChange={e =>
                onNewTierChange({ ...newTier, price: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="text-xs text-gray-500 mb-1 block">Label</label>
            <Input
              type="text"
              placeholder="0 à 5 m³"
              value={newTier.label}
              onChange={e =>
                onNewTierChange({ ...newTier, label: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={onSave}
              disabled={isPending}
              className="h-8 px-2"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
