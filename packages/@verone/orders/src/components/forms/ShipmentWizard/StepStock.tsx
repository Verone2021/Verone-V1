'use client';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products';
import type { ShipmentItem } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  Package,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Settings,
} from 'lucide-react';

import type { PreviousShipmentGroup } from './types';

interface StepStockProps {
  items: ShipmentItem[];
  totals: { totalQty: number; totalValue: number; hasStockIssue: boolean };
  previousShipments: PreviousShipmentGroup[];
  showPreviousShipments: boolean;
  setShowPreviousShipments: (v: boolean) => void;
  handleQuantityChange: (itemId: string, value: string) => void;
  handleShipAll: () => void;
  onOpenAdjustment: (item: ShipmentItem) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function StepStock({
  items,
  totals,
  previousShipments,
  showPreviousShipments,
  setShowPreviousShipments,
  handleQuantityChange,
  handleShipAll,
  onOpenAdjustment,
  onNext,
  onCancel,
}: StepStockProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-verone-primary" />
            Articles a expedier
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selectionnez les quantites a expedier
          </p>
        </div>
        <ButtonV2 variant="outline" size="sm" onClick={handleShipAll}>
          Tout expedier
        </ButtonV2>
      </div>

      {/* Previous Shipments (for partially_shipped orders) */}
      {previousShipments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <button
            type="button"
            className="w-full p-3 flex items-center justify-between text-left"
            onClick={() => setShowPreviousShipments(!showPreviousShipments)}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {previousShipments.length} expedition
                {previousShipments.length > 1 ? 's' : ''} precedente
                {previousShipments.length > 1 ? 's' : ''}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-amber-600 transition-transform ${showPreviousShipments ? 'rotate-180' : ''}`}
            />
          </button>
          {showPreviousShipments && (
            <div className="px-3 pb-3 space-y-3">
              {previousShipments.map((shipment, idx) => (
                <div
                  key={shipment.shipped_at}
                  className="rounded-md border border-amber-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Expedition #{idx + 1} —{' '}
                      {new Date(shipment.shipped_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {shipment.carrier_name && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {shipment.carrier_name}
                        </Badge>
                      )}
                      {shipment.packlink_status === 'a_payer' && (
                        <Badge className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0">
                          Transport a payer
                        </Badge>
                      )}
                      {shipment.packlink_status === 'paye' && (
                        <Badge className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0">
                          Transport paye
                        </Badge>
                      )}
                      {shipment.packlink_status === 'in_transit' && (
                        <Badge className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0">
                          En transit
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {shipment.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="text-xs text-gray-600 flex justify-between"
                      >
                        <span>{item.product_name}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {(shipment.tracking_number ?? shipment.shipping_cost) && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-amber-100 text-[10px] text-gray-500">
                      {shipment.tracking_number && (
                        <span>
                          Suivi :{' '}
                          {shipment.tracking_url ? (
                            <a
                              href={shipment.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {shipment.tracking_number}
                            </a>
                          ) : (
                            shipment.tracking_number
                          )}
                        </span>
                      )}
                      {shipment.shipping_cost != null &&
                        shipment.shipping_cost > 0 && (
                          <span>
                            Transport : {formatCurrency(shipment.shipping_cost)}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-l-4 border-l-blue-500">
          <div className="text-xs font-medium text-gray-500">A expedier</div>
          <div className="text-xl font-bold mt-1 text-blue-600">
            {totals.totalQty}
          </div>
          <div className="text-xs text-gray-400">unites</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-emerald-500">
          <div className="text-xs font-medium text-gray-500">Valeur</div>
          <div className="text-xl font-bold mt-1 text-emerald-600">
            {formatCurrency(totals.totalValue)}
          </div>
          <div className="text-xs text-gray-400">HT</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-amber-500">
          <div className="text-xs font-medium text-gray-500">Stock</div>
          <Badge
            className={`mt-1 ${totals.hasStockIssue ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          >
            {totals.hasStockIssue ? 'Insuffisant' : 'Disponible'}
          </Badge>
        </Card>
      </div>

      {/* Table Items */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Produit</TableHead>
              <TableHead className="text-center font-semibold text-blue-700">
                Commandee
              </TableHead>
              <TableHead className="text-center font-semibold text-green-700">
                Deja exp.
              </TableHead>
              <TableHead className="text-center font-semibold text-amber-700">
                Stock
              </TableHead>
              <TableHead className="text-center font-semibold text-indigo-700">
                A expedier
              </TableHead>
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

              return (
                <TableRow
                  key={item.sales_order_item_id}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/produits/catalogue/${item.product_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ouvrir la fiche produit ${item.product_name}`}
                      >
                        <ProductThumbnail
                          src={item.primary_image_url}
                          alt={item.product_name}
                          size="sm"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/produits/catalogue/${item.product_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:text-verone-primary hover:underline"
                          >
                            {item.product_name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => onOpenAdjustment(item)}
                            aria-label="Ajuster le stock"
                            title="Ajuster le stock"
                            className="text-gray-400 hover:text-verone-primary transition-colors"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.product_sku}
                        </p>
                        {progressPercent > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {progressPercent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.quantity_ordered}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        item.quantity_already_shipped > 0
                          ? 'text-green-600 font-medium'
                          : 'text-gray-400'
                      }
                    >
                      {item.quantity_already_shipped}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        item.stock_available < item.quantity_remaining
                          ? 'text-red-600 font-bold'
                          : 'text-emerald-600 font-medium'
                      }
                    >
                      {item.stock_available}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity_remaining}
                      value={item.quantity_to_ship ?? 0}
                      onChange={e =>
                        handleQuantityChange(
                          item.sales_order_item_id,
                          e.target.value
                        )
                      }
                      className="w-20 h-8 text-center mx-auto border-indigo-200 focus:border-indigo-500"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {totals.hasStockIssue && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Stock insuffisant pour certains articles. Les quantites seront
          ajustees automatiquement.
        </div>
      )}

      <div className="flex justify-between">
        <ButtonV2 variant="outline" onClick={onCancel}>
          Annuler
        </ButtonV2>
        <ButtonV2 onClick={onNext} disabled={totals.totalQty === 0}>
          Suivant
          <ArrowRight className="h-4 w-4 ml-1" />
        </ButtonV2>
      </div>
    </div>
  );
}
