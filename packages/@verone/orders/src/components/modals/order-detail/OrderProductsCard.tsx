'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
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
import { Package, X, Pencil } from 'lucide-react';

import type { SalesOrder, OrderItem } from '@verone/orders/hooks';
import { EditableOrderItemRow } from '../../tables/EditableOrderItemRow';

export interface OrderProductsCardProps {
  order: SalesOrder;
  isEditing: boolean;
  isLocked: boolean;
  hasActiveInvoice: boolean;
  shippingCostHt: number;
  insuranceCostHt: number;
  handlingCostHt: number;
  feesVatRate: number;
  feesSaving: boolean;
  onSetIsEditing: (editing: boolean) => void;
  onSetShippingCostHt: (v: number) => void;
  onSetInsuranceCostHt: (v: number) => void;
  onSetHandlingCostHt: (v: number) => void;
  onSetFeesVatRate: (v: number) => void;
  onSaveFees: () => void;
  onShowAddProductModal: () => void;
  onUpdateItem: (itemId: string, data: Record<string, unknown>) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdate?: () => void;
}

export function OrderProductsCard({
  order,
  isEditing,
  isLocked,
  hasActiveInvoice,
  shippingCostHt,
  insuranceCostHt,
  handlingCostHt,
  feesVatRate,
  feesSaving,
  onSetIsEditing,
  onSetShippingCostHt,
  onSetInsuranceCostHt,
  onSetHandlingCostHt,
  onSetFeesVatRate,
  onSaveFees,
  onShowAddProductModal,
  onUpdateItem,
  onRemoveItem,
}: OrderProductsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits ({order.sales_order_items?.length ?? 0} article
            {(order.sales_order_items?.length ?? 0) > 1 ? 's' : ''})
          </CardTitle>
          {isLocked ? (
            <Badge variant="secondary" className="text-xs">
              {order.status === 'shipped'
                ? '\uD83D\uDD12 Expédiée — lecture seule'
                : hasActiveInvoice
                  ? '\uD83D\uDD12 Facture émise — lecture seule'
                  : '\uD83D\uDD12 Lecture seule'}
            </Badge>
          ) : isEditing ? (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => onSetIsEditing(false)}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Terminer l&apos;édition
            </ButtonV2>
          ) : (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => onSetIsEditing(true)}
              className="h-7 text-xs"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Modifier
            </ButtonV2>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* TABLE RESPONSIVE avec scroll horizontal mobile + hauteur limitee */}
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="w-20 text-right">Qte</TableHead>
                <TableHead className="w-28 text-right">Prix HT</TableHead>
                <TableHead className="w-28 text-right">Total HT</TableHead>
                <TableHead className="w-24 text-center">Expedie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEditing
                ? order.sales_order_items?.map(item => (
                    <EditableOrderItemRow
                      key={item.id}
                      item={item as unknown as OrderItem}
                      orderType="sales"
                      readonly={false}
                      onUpdate={(itemId, data) => onUpdateItem(itemId, data)}
                      onDelete={itemId => onRemoveItem(itemId)}
                    />
                  ))
                : order.sales_order_items?.map(item => {
                    const primaryImage =
                      item.products?.primary_image_url ?? null;
                    const lineHT =
                      item.quantity *
                      item.unit_price_ht *
                      (1 - (item.discount_percentage || 0) / 100);
                    const shippedQty =
                      (
                        item as unknown as {
                          quantity_shipped?: number;
                        }
                      ).quantity_shipped ?? 0;

                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>
                          {primaryImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryImage}
                              alt={item.products?.name ?? 'Produit'}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {item.products?.name ?? 'Produit'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.products?.sku ?? '—'}
                            </p>
                            {(item.discount_percentage || 0) > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] mt-0.5 text-orange-600 border-orange-200"
                              >
                                -{item.discount_percentage}%
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price_ht)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(lineHT)}
                        </TableCell>
                        <TableCell className="text-center">
                          {shippedQty > 0 ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${shippedQty >= item.quantity ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                            >
                              {shippedQty}/{item.quantity}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>

        {/* BOUTON AJOUTER PRODUIT */}
        {isEditing && (
          <div className="mt-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onShowAddProductModal}
              className="w-full border-dashed"
            >
              <Package className="h-3 w-3 mr-1" />+ Ajouter un produit
            </ButtonV2>
          </div>
        )}

        {/* TOTAUX (bas de table) */}
        <Separator className="my-4" />
        {(() => {
          // === CALCUL TVA PAR LIGNE DE PRODUIT ===
          const tvaByRate: Record<number, { ht: number; tva: number }> = {};
          let productsHT = 0;

          order.sales_order_items?.forEach(item => {
            const lineHT =
              item.quantity *
              item.unit_price_ht *
              (1 - (item.discount_percentage || 0) / 100);
            const lineTaxRate = item.tax_rate || 0.2;
            const lineTVA = lineHT * lineTaxRate;

            productsHT += lineHT;

            if (!tvaByRate[lineTaxRate]) {
              tvaByRate[lineTaxRate] = { ht: 0, tva: 0 };
            }
            tvaByRate[lineTaxRate].ht += lineHT;
            tvaByRate[lineTaxRate].tva += lineTVA;
          });

          const sortedRates = Object.keys(tvaByRate)
            .map(Number)
            .sort((a, b) => b - a);

          const totalProductsTVA = Object.values(tvaByRate).reduce(
            (sum, v) => sum + v.tva,
            0
          );

          // === FRAIS ===
          const displayShippingHt = isEditing
            ? shippingCostHt
            : (order.shipping_cost_ht ?? 0);
          const displayInsuranceHt = isEditing
            ? insuranceCostHt
            : (order.insurance_cost_ht ?? 0);
          const displayHandlingHt = isEditing
            ? handlingCostHt
            : (order.handling_cost_ht ?? 0);
          const displayFeesVatRate = isEditing
            ? feesVatRate
            : (order.fees_vat_rate ?? 0.2);
          const totalFeesHT =
            displayShippingHt + displayInsuranceHt + displayHandlingHt;

          const feesTVA = totalFeesHT * displayFeesVatRate;

          // === TOTAUX GLOBAUX ===
          const totalHT = productsHT + totalFeesHT;
          const totalTVA = totalProductsTVA + feesTVA;
          const totalTTC = totalHT + totalTVA;

          return (
            <div className="space-y-2 text-right">
              {/* Total HT Produits */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT produits :</span>
                <span className="font-semibold">
                  {formatCurrency(productsHT)}
                </span>
              </div>

              {/* Frais additionnels */}
              <div className="pt-2 mt-2 border-t border-dashed space-y-2">
                {/* Livraison */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex-shrink-0">Frais de livraison HT :</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingCostHt}
                      onChange={e =>
                        onSetShippingCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="w-24 h-6 text-xs text-right"
                    />
                  ) : (
                    <span>{formatCurrency(displayShippingHt)}</span>
                  )}
                </div>
                {/* Assurance */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex-shrink-0">
                    Frais d&apos;assurance HT :
                  </span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={insuranceCostHt}
                      onChange={e =>
                        onSetInsuranceCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="w-24 h-6 text-xs text-right"
                    />
                  ) : (
                    <span>{formatCurrency(displayInsuranceHt)}</span>
                  )}
                </div>
                {/* Manutention */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex-shrink-0">
                    Frais de manutention HT :
                  </span>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={handlingCostHt}
                      onChange={e =>
                        onSetHandlingCostHt(parseFloat(e.target.value) || 0)
                      }
                      className="w-24 h-6 text-xs text-right"
                    />
                  ) : (
                    <span>{formatCurrency(displayHandlingHt)}</span>
                  )}
                </div>
                {/* Selecteur TVA frais + bouton save */}
                {isEditing && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex gap-1">
                      {[0, 0.055, 0.1, 0.2].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => onSetFeesVatRate(rate)}
                          className={`text-xs py-0.5 px-1.5 rounded border ${feesVatRate === rate ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-gray-50'}`}
                        >
                          {(rate * 100).toFixed(1).replace('.0', '')}%
                        </button>
                      ))}
                    </div>
                    <ButtonV2
                      size="sm"
                      variant="outline"
                      onClick={onSaveFees}
                      disabled={feesSaving}
                      className="h-6 text-xs px-2"
                    >
                      {feesSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </ButtonV2>
                  </div>
                )}
              </div>

              {/* Total HT global */}
              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                <span className="text-gray-700">Total HT :</span>
                <span>{formatCurrency(totalHT)}</span>
              </div>

              {/* TVA par taux (produits) */}
              <div className="pt-2 border-t border-dashed space-y-1">
                {sortedRates.map(rate => (
                  <div
                    key={rate}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span>
                      TVA {(rate * 100).toFixed(rate === 0.055 ? 1 : 0)}%
                      (produits) :
                    </span>
                    <span>{formatCurrency(tvaByRate[rate].tva)}</span>
                  </div>
                ))}
                {/* TVA frais (si frais > 0) */}
                {totalFeesHT > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      TVA {(displayFeesVatRate * 100).toFixed(0)}% (frais) :
                    </span>
                    <span>{formatCurrency(feesTVA)}</span>
                  </div>
                )}
              </div>

              {/* Total TTC */}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total TTC :</span>
                <span className="text-primary">{formatCurrency(totalTTC)}</span>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
