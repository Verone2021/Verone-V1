'use client';

import {
  ButtonV2,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { X } from 'lucide-react';

import type { QuoteItemLocal } from './types';

interface QuoteProductRowProps {
  item: QuoteItemLocal;
  onRemove: (id: string) => void;
  onChange: (
    id: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
}

export function QuoteProductRow({
  item,
  onRemove,
  onChange,
}: QuoteProductRowProps) {
  const discountMultiplier = 1 - (item.discount_percentage ?? 0) / 100;
  const lineHt =
    item.quantity * item.unit_price_ht * discountMultiplier +
    (item.eco_tax ?? 0) * item.quantity;

  return (
    <TableRow>
      <TableCell>
        <div className="text-sm font-medium">
          {item.product?.name ?? item.description}
        </div>
        {item.product?.sku && (
          <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={1}
          className="w-20 text-right"
          value={item.quantity}
          onChange={e => onChange(item.id, 'quantity', Number(e.target.value))}
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          step="0.01"
          className="w-28 text-right"
          value={item.unit_price_ht}
          onChange={e =>
            onChange(item.id, 'unit_price_ht', Number(e.target.value))
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          max={100}
          className="w-20 text-right"
          value={item.discount_percentage}
          onChange={e =>
            onChange(item.id, 'discount_percentage', Number(e.target.value))
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <Select
          value={String(item.tva_rate)}
          onValueChange={v => onChange(item.id, 'tva_rate', Number(v))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="5.5">5,5%</SelectItem>
            <SelectItem value="10">10%</SelectItem>
            <SelectItem value="20">20%</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(lineHt)}
      </TableCell>
      <TableCell>
        <ButtonV2
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </ButtonV2>
      </TableCell>
    </TableRow>
  );
}
