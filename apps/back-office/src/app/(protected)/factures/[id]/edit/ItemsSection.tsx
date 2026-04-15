'use client';

import { Button, Separator } from '@verone/ui';
import { Plus, AlertTriangle } from 'lucide-react';

import type { IEditableItem } from './types';
import { ItemRow } from './ItemRow';

interface ItemsSectionProps {
  items: IEditableItem[];
  isLinkedToOrder: boolean;
  linkedOrderNumber: string | null;
  onItemChange: (id: string, field: keyof IEditableItem, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
}

interface Totals {
  subtotal: number;
  totalVat: number;
  total: number;
}

function computeTotals(items: IEditableItem[]): Totals {
  let subtotal = 0;
  let totalVat = 0;
  items.forEach(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const vatRate = parseFloat(item.vatRate) || 0;
    const itemTotal = qty * price;
    subtotal += itemTotal;
    totalVat += itemTotal * vatRate;
  });
  return { subtotal, totalVat, total: subtotal + totalVat };
}

export function ItemsSection({
  items,
  isLinkedToOrder,
  linkedOrderNumber,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: ItemsSectionProps) {
  const totals = computeTotals(items);

  return (
    <div className="space-y-3">
      {isLinkedToOrder && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Facture liee a une commande {linkedOrderNumber ?? ''} — seuls les
            prix HT sont modifiables.
          </span>
        </div>
      )}
      <div className="grid grid-cols-12 gap-2 px-3 text-sm font-medium text-muted-foreground">
        <div className="col-span-4">Designation</div>
        <div className="col-span-2">Quantite</div>
        <div className="col-span-2">Prix HT</div>
        <div className="col-span-2">TVA</div>
        <div className="col-span-2" />
      </div>
      {items.map(item => (
        <ItemRow
          key={item.id}
          item={item}
          onChange={onItemChange}
          onRemove={onRemoveItem}
          canRemove={items.length > 1}
          readOnly={isLinkedToOrder}
        />
      ))}
      {!isLinkedToOrder && (
        <Button variant="outline" onClick={onAddItem} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une ligne
        </Button>
      )}
      <Separator className="my-4" />
      <div className="space-y-2 text-right">
        <div className="flex justify-end gap-8">
          <span className="text-muted-foreground">Sous-total HT</span>
          <span className="font-medium w-24">
            {totals.subtotal.toFixed(2)} €
          </span>
        </div>
        <div className="flex justify-end gap-8">
          <span className="text-muted-foreground">TVA</span>
          <span className="font-medium w-24">
            {totals.totalVat.toFixed(2)} €
          </span>
        </div>
        <div className="flex justify-end gap-8 text-lg">
          <span className="font-medium">Total TTC</span>
          <span className="font-bold w-24">{totals.total.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
}
