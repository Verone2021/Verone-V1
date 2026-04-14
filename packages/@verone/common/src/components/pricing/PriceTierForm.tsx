'use client';

/**
 * PriceTierForm - Formulaire de configuration d'un palier de prix
 * Sub-component of PriceListItemFormModal
 */

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Trash2 } from 'lucide-react';

export interface TierForm {
  min_quantity: number;
  max_quantity: number | null;
  price_ht: number;
  discount_rate: number;
  margin_rate: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  notes: string;
}

interface PriceTierFormProps {
  tier: TierForm;
  index: number;
  currency?: string;
  isEditMode: boolean;
  tiersCount: number;
  onChange: (
    index: number,
    field: keyof TierForm,
    value: TierForm[keyof TierForm]
  ) => void;
  onRemove: (index: number) => void;
}

export function PriceTierForm({
  tier,
  index,
  currency,
  isEditMode,
  tiersCount,
  onChange,
  onRemove,
}: PriceTierFormProps) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Palier {index + 1}</Badge>
        {!isEditMode && tiersCount > 1 && (
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </ButtonV2>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quantités */}
        <div className="space-y-2">
          <Label htmlFor={`min_qty_${index}`}>
            Quantité Minimum <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`min_qty_${index}`}
            type="number"
            min="1"
            value={tier.min_quantity}
            onChange={e =>
              onChange(index, 'min_quantity', parseInt(e.target.value) || 1)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`max_qty_${index}`}>Quantité Maximum</Label>
          <Input
            id={`max_qty_${index}`}
            type="number"
            min={tier.min_quantity}
            value={tier.max_quantity ?? ''}
            onChange={e =>
              onChange(
                index,
                'max_quantity',
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="(illimite)"
          />
        </div>

        {/* Prix et Remises */}
        <div className="space-y-2">
          <Label htmlFor={`price_${index}`}>
            Prix HT {currency ? `(${currency})` : ''}{' '}
            <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`price_${index}`}
            type="number"
            step="0.01"
            min="0"
            value={tier.price_ht}
            onChange={e =>
              onChange(index, 'price_ht', parseFloat(e.target.value) || 0)
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`discount_${index}`}>Remise (%)</Label>
          <Input
            id={`discount_${index}`}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={tier.discount_rate}
            onChange={e =>
              onChange(index, 'discount_rate', parseFloat(e.target.value) || 0)
            }
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`margin_${index}`}>Marge (%)</Label>
          <Input
            id={`margin_${index}`}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={tier.margin_rate}
            onChange={e =>
              onChange(index, 'margin_rate', parseFloat(e.target.value) || 0)
            }
            placeholder="0"
          />
        </div>

        {/* Validité */}
        <div className="space-y-2">
          <Label htmlFor={`valid_from_${index}`}>Date Debut Validite</Label>
          <Input
            id={`valid_from_${index}`}
            type="date"
            value={tier.valid_from}
            onChange={e => onChange(index, 'valid_from', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`valid_until_${index}`}>Date Fin Validite</Label>
          <Input
            id={`valid_until_${index}`}
            type="date"
            value={tier.valid_until}
            onChange={e => onChange(index, 'valid_until', e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor={`notes_${index}`}>Notes</Label>
        <Textarea
          id={`notes_${index}`}
          value={tier.notes}
          onChange={e => onChange(index, 'notes', e.target.value)}
          placeholder="Notes optionnelles sur ce palier"
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <Label htmlFor={`active_${index}`}>Palier actif</Label>
        <Switch
          id={`active_${index}`}
          checked={tier.is_active}
          onCheckedChange={checked => onChange(index, 'is_active', checked)}
        />
      </div>
    </div>
  );
}
