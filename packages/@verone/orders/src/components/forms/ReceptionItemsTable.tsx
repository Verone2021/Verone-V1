'use client';

import type { ReceptionItem } from '@verone/types';
import {
  Badge,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ProductThumbnail } from '@verone/products';

interface IReceptionItemsTableProps {
  items: ReceptionItem[];
  onQuantityChange: (itemId: string, value: string) => void;
}

export function ReceptionItemsTable({
  items,
  onQuantityChange,
}: IReceptionItemsTableProps): React.ReactNode {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Produit</TableHead>
            <TableHead className="text-center font-semibold text-blue-700">
              Commandée
            </TableHead>
            <TableHead className="text-center font-semibold text-green-700">
              Déjà reçue
            </TableHead>
            <TableHead className="text-center font-semibold text-amber-700">
              Restante
            </TableHead>
            <TableHead className="text-center font-semibold text-indigo-700">
              À recevoir
            </TableHead>
            <TableHead className="text-right font-semibold">
              Prix Unit.
            </TableHead>
            <TableHead className="text-right font-semibold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const progressPercent =
              item.quantity_ordered > 0
                ? Math.round(
                    (item.quantity_already_received / item.quantity_ordered) *
                      100
                  )
                : 0;

            return (
              <TableRow
                key={item.purchase_order_item_id}
                className="hover:bg-gray-50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      src={item.primary_image_url}
                      alt={item.product_name}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-gray-500">
                        {item.product_sku}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-blue-600 text-lg">
                    {item.quantity_ordered}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {item.quantity_already_received > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      ✓ {item.quantity_already_received}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.quantity_remaining > 0 ? (
                    <span className="font-semibold text-amber-600 text-lg">
                      {item.quantity_remaining}
                    </span>
                  ) : (
                    <Badge className="bg-green-500 text-white">Complet</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity_remaining}
                    value={item.quantity_to_receive}
                    onChange={e =>
                      onQuantityChange(
                        item.purchase_order_item_id,
                        e.target.value
                      )
                    }
                    className="w-20 text-center border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(
                      item.quantity_to_receive * item.unit_price_ht
                    )}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
