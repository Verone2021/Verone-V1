'use client';

import {
  ButtonV2,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Trash2 } from 'lucide-react';

import type { QuoteItemLocal } from './types';

interface QuoteServiceRowProps {
  item: QuoteItemLocal;
  index: number;
  showDelete: boolean;
  onRemove: (id: string) => void;
  onChange: (
    id: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
}

export function QuoteServiceRow({
  item,
  index,
  showDelete,
  onRemove,
  onChange,
}: QuoteServiceRowProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Ligne {index + 1}
        </span>
        {showDelete && (
          <ButtonV2
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </ButtonV2>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label className="text-xs">Description</Label>
          <Input
            placeholder="Description de la prestation"
            value={item.description}
            onChange={e => onChange(item.id, 'description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Quantité</Label>
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={e =>
                onChange(item.id, 'quantity', Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label className="text-xs">Prix unitaire HT</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={item.unit_price_ht}
              onChange={e =>
                onChange(item.id, 'unit_price_ht', Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label className="text-xs">TVA %</Label>
            <Select
              value={String(item.tva_rate)}
              onValueChange={v => onChange(item.id, 'tva_rate', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5.5">5,5%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Total HT</Label>
            <div className="h-10 flex items-center text-sm font-medium">
              {formatCurrency(item.quantity * item.unit_price_ht)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
