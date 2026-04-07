'use client';

import { ProductThumbnail } from '@verone/products';
import { TableCell, TableRow } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

import type { PurchaseOrderWithSupplier } from './types';

type OrderItem = PurchaseOrderWithSupplier['purchase_order_items'][0];

interface OrderProductsExpandedRowProps {
  orderId: string;
  items: OrderItem[];
  colSpan: number;
}

export function OrderProductsExpandedRow({
  orderId,
  items,
  colSpan,
}: OrderProductsExpandedRowProps) {
  return (
    <TableRow key={`${orderId}-details`}>
      <TableCell colSpan={colSpan} className="bg-gray-50 p-0">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3 text-gray-700">
            Produits de la commande ({items.length})
          </h4>
          <div className="space-y-2">
            {items.map((item, itemIndex) => (
              <div
                key={item.id || `item-${orderId}-${itemIndex}`}
                className="flex items-center gap-4 p-2 bg-white rounded-lg border"
              >
                <ProductThumbnail
                  src={
                    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Fallback to first image if no primary found */
                    item.products?.product_images?.find(
                      (img: { public_url: string; is_primary: boolean }) =>
                        img.is_primary
                    )?.public_url ||
                    item.products?.product_images?.[0]?.public_url
                    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
                  }
                  alt={item.products?.name || 'Produit'}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.products?.name || 'Produit inconnu'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    SKU: {item.products?.sku ?? 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {item.quantity_received ?? 0} / {item.quantity} reçu(s)
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock actuel: {item.products?.stock_real ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency((item.unit_price_ht ?? 0) * item.quantity)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.unit_price_ht ?? 0)} /u
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
