'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Separator } from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Package } from 'lucide-react';

import type { OrderItem } from '@verone/orders/hooks';
import { EditableOrderItemRow } from '@verone/orders/components/tables/EditableOrderItemRow';

interface UniversalOrderItemsCardProps {
  items: OrderItem[];
  orderType: 'sales' | 'purchase';
  isEditMode: boolean;
  isDraft: boolean;
  onAddProduct: () => void;
  onUpdateItem: (id: string, data: Partial<OrderItem>) => void;
  onRemoveItem: (id: string) => void;
}

export function UniversalOrderItemsCard({
  items,
  orderType,
  isEditMode,
  isDraft,
  onAddProduct,
  onUpdateItem,
  onRemoveItem,
}: UniversalOrderItemsCardProps) {
  const calculateTotal = () =>
    items.reduce((sum, item) => {
      const subtotal =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage ?? 0) / 100);
      return sum + subtotal + (item.eco_tax ?? 0) * item.quantity;
    }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles ({items.length})
          </CardTitle>
          {isEditMode && isDraft && (
            <ButtonV2 variant="outline" size="sm" onClick={onAddProduct}>
              <Package className="h-4 w-4 mr-2" />
              Ajouter un produit
            </ButtonV2>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Qté</TableHead>
              <TableHead>Prix HT</TableHead>
              <TableHead>Remise</TableHead>
              <TableHead>Éco-taxe</TableHead>
              {orderType === 'sales' && <TableHead>TVA</TableHead>}
              <TableHead>Total HT</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <EditableOrderItemRow
                key={item.id}
                item={item}
                orderType={orderType}
                readonly={!isEditMode}
                onUpdate={(id, data) => onUpdateItem(id, data)}
                onDelete={id => onRemoveItem(id)}
              />
            ))}
          </TableBody>
        </Table>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total HT</span>
          <span className="text-2xl font-bold">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
