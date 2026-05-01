'use client';

import {
  Badge,
  CloudflareImage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { LINKME_CONSTANTS } from '@verone/utils';
import { PackageIcon } from 'lucide-react';

import type { LinkMeOrder } from '../../../../hooks/use-linkme-orders';
import { formatPrice } from './order-detail.helpers';

interface OrderItemsTableProps {
  order: LinkMeOrder;
  canViewCommissions: boolean;
}

export function OrderItemsTable({
  order,
  canViewCommissions,
}: OrderItemsTableProps) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
        <PackageIcon className="h-4 w-4 text-[#5DBEBB]" />
        Articles ({order.items_count})
      </h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-[#183559]">Image</TableHead>
              <TableHead className="text-[#183559]">Produit</TableHead>
              <TableHead className="text-center text-[#183559]">Qte</TableHead>
              <TableHead className="text-right text-[#183559]">
                Prix unit. HT
              </TableHead>
              <TableHead className="text-right text-[#183559]">
                Total HT
              </TableHead>
              {canViewCommissions && (
                <TableHead className="text-center text-[#183559]">
                  Marge %
                </TableHead>
              )}
              {canViewCommissions && (
                <TableHead className="text-right text-[#183559]">
                  Commission TTC
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="w-16">
                  <div className="relative w-12 h-12">
                    <CloudflareImage
                      cloudflareId={item.product_cloudflare_image_id ?? null}
                      fallbackSrc={item.product_image_url}
                      alt={item.product_name}
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-[#183559]">
                      {item.product_name}
                    </p>
                    {item.product_sku && (
                      <p className="text-xs text-gray-500">
                        SKU: {item.product_sku}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatPrice(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(item.total_ht)}
                </TableCell>
                {canViewCommissions && (
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {item.margin_rate.toFixed(2)}%
                    </Badge>
                  </TableCell>
                )}
                {canViewCommissions && (
                  <TableCell className="text-right font-semibold text-emerald-600">
                    +
                    {formatPrice(
                      item.affiliate_margin *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
