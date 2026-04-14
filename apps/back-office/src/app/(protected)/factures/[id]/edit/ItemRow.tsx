'use client';

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Trash2 } from 'lucide-react';

import type { IEditableItem } from './types';

interface IItemRowProps {
  item: IEditableItem;
  onChange: (id: string, field: keyof IEditableItem, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  readOnly?: boolean;
}

export function ItemRow({
  item,
  onChange,
  onRemove,
  canRemove,
  readOnly,
}: IItemRowProps) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 rounded-lg">
      <div className="col-span-4 space-y-1">
        <Input
          placeholder="Titre *"
          value={item.title}
          onChange={e => onChange(item.id, 'title', e.target.value)}
          disabled={readOnly}
        />
        <Input
          placeholder="Description (optionnel)"
          value={item.description}
          onChange={e => onChange(item.id, 'description', e.target.value)}
          className="text-sm"
          disabled={readOnly}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qte"
          value={item.quantity}
          onChange={e => onChange(item.id, 'quantity', e.target.value)}
          disabled={readOnly}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Prix HT"
          value={item.unitPrice}
          onChange={e => onChange(item.id, 'unitPrice', e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <Select
          value={item.vatRate}
          onValueChange={value => onChange(item.id, 'vatRate', value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="TVA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="0.055">5.5%</SelectItem>
            <SelectItem value="0.10">10%</SelectItem>
            <SelectItem value="0.20">20%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 flex justify-end">
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            disabled={!canRemove}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
