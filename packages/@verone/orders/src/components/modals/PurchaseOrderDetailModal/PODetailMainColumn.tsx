'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Separator } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Package } from 'lucide-react';

import type { PurchaseOrder } from '@verone/orders/hooks';

import type { ProductImage, PurchaseOrderExtended } from './types';

interface PODetailMainColumnProps {
  order: PurchaseOrder;
  totalEcoTax: number;
}

export function PODetailMainColumn({
  order,
  totalEcoTax,
}: PODetailMainColumnProps) {
  return (
    <div className="flex-1 order-2 lg:order-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits ({order.purchase_order_items?.length ?? 0} article
            {(order.purchase_order_items?.length ?? 0) > 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* TABLE RESPONSIVE avec scroll horizontal mobile + hauteur limitée */}
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="w-20 text-right">Qté</TableHead>
                  <TableHead className="w-28 text-right">Prix HT</TableHead>
                  <TableHead className="w-28 text-right">Total HT</TableHead>
                  <TableHead className="w-28 text-right">Revient Net</TableHead>
                  <TableHead className="w-24 text-center">Réception</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.purchase_order_items?.map(item => {
                  // ✅ BR-TECH-002: Récupérer image via product_images
                  const productImages = (
                    item.products as unknown as {
                      product_images?: ProductImage[];
                    }
                  )?.product_images;
                  const primaryImageUrl =
                    productImages?.find(img => img.is_primary)?.public_url ??
                    productImages?.[0]?.public_url ??
                    null;

                  // Calcul total HT avec remise et éco-taxe
                  // L'écotaxe est par unité, donc on multiplie par la quantité
                  const totalHT =
                    item.quantity *
                      item.unit_price_ht *
                      (1 - (item.discount_percentage || 0) / 100) +
                    (item.eco_tax || 0) * item.quantity;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      {/* IMAGE PRODUIT */}
                      <TableCell>
                        {primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primaryImageUrl}
                            alt={item?.products?.name ?? 'Produit'}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>

                      {/* NOM + SKU + BADGES */}
                      <TableCell>
                        <p className="font-medium text-sm">
                          {item.products?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {item.products?.sku}
                        </p>
                        {/* Badges inline (remise) */}
                        {item.discount_percentage > 0 && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs bg-green-100 text-green-800 border-green-200"
                          >
                            -{item.discount_percentage.toFixed(1)}%
                          </Badge>
                        )}
                      </TableCell>

                      {/* QUANTITÉ */}
                      <TableCell className="text-right font-medium">
                        {item.quantity}
                      </TableCell>

                      {/* PRIX UNITAIRE HT */}
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price_ht)}
                        {item.eco_tax > 0 && (
                          <span className="block text-xs text-gray-500">
                            + éco-taxe {formatCurrency(item.eco_tax)}
                          </span>
                        )}
                      </TableCell>

                      {/* TOTAL HT */}
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalHT)}
                      </TableCell>

                      {/* PRIX DE REVIENT NET */}
                      <TableCell className="text-right text-sm">
                        {item.unit_cost_net ? (
                          formatCurrency(item.unit_cost_net)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      {/* RÉCEPTION */}
                      <TableCell className="text-center">
                        {item.quantity_received > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {item.quantity_received}/{item.quantity}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* TOTAUX (bas de table) */}
          <Separator className="my-4" />
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total HT produits :</span>
              <span className="font-semibold">
                {formatCurrency(order.total_ht || 0)}
              </span>
            </div>

            {/* Éco-taxe si > 0 */}
            {totalEcoTax > 0 && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>🌿 Dont éco-taxe :</span>
                <span>{formatCurrency(totalEcoTax)}</span>
              </div>
            )}

            {/* Frais additionnels fournisseurs */}
            {(((order as PurchaseOrderExtended).shipping_cost_ht ?? 0) > 0 ||
              ((order as PurchaseOrderExtended).customs_cost_ht ?? 0) > 0 ||
              ((order as PurchaseOrderExtended).insurance_cost_ht ?? 0) >
                0) && (
              <>
                {((order as PurchaseOrderExtended).shipping_cost_ht ?? 0) >
                  0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de livraison HT :</span>
                    <span>
                      {formatCurrency(
                        (order as PurchaseOrderExtended).shipping_cost_ht ?? 0
                      )}
                    </span>
                  </div>
                )}
                {((order as PurchaseOrderExtended).customs_cost_ht ?? 0) >
                  0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de douane HT :</span>
                    <span>
                      {formatCurrency(
                        (order as PurchaseOrderExtended).customs_cost_ht ?? 0
                      )}
                    </span>
                  </div>
                )}
                {((order as PurchaseOrderExtended).insurance_cost_ht ?? 0) >
                  0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais d'assurance HT :</span>
                    <span>
                      {formatCurrency(
                        (order as PurchaseOrderExtended).insurance_cost_ht ?? 0
                      )}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span>
                TVA ({((order as PurchaseOrderExtended).tax_rate ?? 0.2) * 100}
                %) :
              </span>
              <span>
                {formatCurrency(
                  (order.total_ht ?? 0) *
                    ((order as PurchaseOrderExtended).tax_rate ?? 0.2)
                )}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total TTC :</span>
              <span className="text-primary">
                {formatCurrency(
                  (order.total_ht ?? 0) *
                    (1 + ((order as PurchaseOrderExtended).tax_rate ?? 0.2))
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
