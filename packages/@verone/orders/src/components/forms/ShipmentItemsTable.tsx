'use client';

import type { ShipmentItem } from '@verone/types';
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
import { AlertTriangle } from 'lucide-react';

interface IShipmentItemsTableProps {
  items: ShipmentItem[];
  onQuantityChange: (itemId: string, value: string) => void;
}

export function ShipmentItemsTable({
  items,
  onQuantityChange,
}: IShipmentItemsTableProps): React.ReactNode {
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
              Déjà expédiée
            </TableHead>
            <TableHead className="text-center font-semibold text-amber-700">
              Restante
            </TableHead>
            <TableHead className="text-center font-semibold text-purple-700">
              Stock dispo
            </TableHead>
            <TableHead className="text-center font-semibold text-indigo-700">
              À expédier
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
                    (item.quantity_already_shipped / item.quantity_ordered) *
                      100
                  )
                : 0;
            const hasStockProblem =
              item.quantity_to_ship > item.stock_available;

            return (
              <TableRow
                key={item.sales_order_item_id}
                className={`hover:bg-gray-50 ${hasStockProblem ? 'bg-red-50' : ''}`}
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
                  {item.quantity_already_shipped > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border border-green-300">
                      ✓ {item.quantity_already_shipped}
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
                  <span
                    className={`font-semibold ${item.stock_available < item.quantity_remaining ? 'text-red-600' : 'text-purple-600'}`}
                  >
                    {item.stock_available}
                  </span>
                  {item.stock_available < item.quantity_remaining && (
                    <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={Math.min(
                      item.quantity_remaining,
                      item.stock_available
                    )}
                    value={item.quantity_to_ship}
                    onChange={e =>
                      onQuantityChange(item.sales_order_item_id, e.target.value)
                    }
                    className={`w-20 text-center ${hasStockProblem ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
                  />
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(item.quantity_to_ship * item.unit_price_ht)}
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
