'use client';

/**
 * Formulaire Expédition Sales Order
 * Pattern miroir de PurchaseOrderReceptionForm
 */

import { useState, useEffect, useMemo } from 'react';

import { ProductThumbnail } from '@verone/products';
import type { ShipmentItem } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { formatDate, formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Package, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

interface SalesOrderShipmentFormProps {
  salesOrder: SalesOrderForShipment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SalesOrderShipmentForm({
  salesOrder,
  onSuccess,
  onCancel,
}: SalesOrderShipmentFormProps) {
  const supabase = createClient();
  const {
    prepareShipmentItems,
    validateShipment,
    validating,
    loadShipmentHistory,
  } = useSalesShipments();

  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [shippedAt, setShippedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // Initialiser items
  useEffect(() => {
    const shipmentItems = prepareShipmentItems(salesOrder);
    setItems(shipmentItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  // Charger historique expéditions
  useEffect(() => {
    loadShipmentHistory(salesOrder.id).then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder.id]);

  // Calculer totaux
  const totals = useMemo(() => {
    const totalQuantityToShip = items.reduce(
      (sum, item) => sum + (item.quantity_to_ship || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity_to_ship * item.unit_price_ht,
      0
    );
    const allFullyShipped = items.every(
      item =>
        item.quantity_already_shipped + item.quantity_to_ship >=
        item.quantity_ordered
    );

    // Vérifier si tous les items ont assez de stock
    const hasStockIssue = items.some(
      item => item.quantity_to_ship > item.stock_available
    );

    return { totalQuantityToShip, totalValue, allFullyShipped, hasStockIssue };
  }, [items]);

  // Update quantité item
  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setItems(prev =>
      prev.map(item =>
        item.sales_order_item_id === itemId
          ? {
              ...item,
              quantity_to_ship: Math.max(
                0,
                Math.min(numValue, item.quantity_remaining)
              ),
            }
          : item
      )
    );
  };

  // Expédier tout (auto-fill quantités restantes limitées par stock)
  const handleShipAll = () => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        quantity_to_ship: Math.min(
          item.quantity_remaining,
          item.stock_available
        ),
      }))
    );
  };

  // Validation
  const handleValidate = async () => {
    // Obtenir l'utilisateur courant
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      alert('Erreur: utilisateur non authentifié');
      return;
    }

    const itemsToShip = items
      .filter(item => item.quantity_to_ship > 0)
      .map(item => ({
        sales_order_item_id: item.sales_order_item_id,
        product_id: item.product_id,
        quantity_to_ship: item.quantity_to_ship,
      }));

    if (itemsToShip.length === 0) {
      alert('Veuillez saisir au moins une quantité à expédier');
      return;
    }

    // Vérifier stock
    const stockIssues = items.filter(
      item => item.quantity_to_ship > item.stock_available
    );
    if (stockIssues.length > 0) {
      alert(
        `Stock insuffisant pour: ${stockIssues.map(i => i.product_name).join(', ')}`
      );
      return;
    }

    const result = await validateShipment({
      sales_order_id: salesOrder.id,
      items: itemsToShip,
      shipped_at: new Date(
        `${shippedAt}T${new Date().toTimeString().split(' ')[0]}`
      ).toISOString(),
      tracking_number: trackingNumber || undefined,
      notes: notes || undefined,
      shipped_by: user.id,
    });

    if (result.success) {
      onSuccess();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-verone-primary" />
            Expédition Marchandise
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Commande {salesOrder.order_number} • {salesOrder.customer_name}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonV2 variant="outline" onClick={handleShipAll}>
            Tout expédier
          </ButtonV2>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-sm font-medium text-gray-600">À expédier</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {totals.totalQuantityToShip}
          </div>
          <div className="text-xs text-gray-500 mt-1">unités</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-sm font-medium text-gray-600">Valeur</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {formatCurrency(totals.totalValue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">HT</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-sm font-medium text-gray-600">
            Statut expédition
          </div>
          {totals.hasStockIssue ? (
            <Badge className="mt-2 bg-red-500 text-white">
              Stock insuffisant
            </Badge>
          ) : (
            <Badge
              className={`mt-2 ${totals.allFullyShipped ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
            >
              {totals.allFullyShipped ? '✓ Complète' : '⏳ Partielle'}
            </Badge>
          )}
        </Card>
      </div>

      {/* Table Items */}
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
                        {/* Mini barre de progression */}
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
                        handleQuantityChange(
                          item.sales_order_item_id,
                          e.target.value
                        )
                      }
                      className={`w-20 text-center ${hasStockProblem ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
                    />
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {formatCurrency(item.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(
                        item.quantity_to_ship * item.unit_price_ht
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Date expédition</Label>
          <Input
            type="date"
            value={shippedAt}
            onChange={e => setShippedAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>N° Tracking (optionnel)</Label>
          <Input
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="Ex: 1Z999AA10123456784"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Notes expédition (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      {/* Historique enrichi */}
      {history.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-verone-primary" />
            Historique des expéditions ({history.length})
          </h4>
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div
                key={`shipment-${idx}`}
                className="border rounded-lg p-3 bg-gray-50"
              >
                {/* Header expédition */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-800">
                      Expédition #{idx + 1}
                    </span>
                    <span className="text-gray-500">—</span>
                    <span className="text-gray-600">
                      {formatDate(h.shipped_at)}
                    </span>
                    {h.tracking_number && (
                      <>
                        <span className="text-gray-500">•</span>
                        <span className="text-xs text-blue-600 font-mono">
                          {h.tracking_number}
                        </span>
                      </>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border border-green-300">
                    {h.total_quantity} unité{h.total_quantity > 1 ? 's' : ''}{' '}
                    expédiée{h.total_quantity > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Détails par produit */}
                <div className="space-y-1 ml-6">
                  {h.items?.map((item: any, itemIdx: number) => {
                    const orderItem = items.find(
                      i => i.product_sku === item.product_sku
                    );
                    const qtyOrdered = orderItem?.quantity_ordered || '?';

                    return (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">├─</span>
                          <span className="font-medium text-gray-700">
                            {item.product_name || item.product_sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">
                            {item.quantity_shipped}/{qtyOrdered} expédié
                            {item.quantity_shipped > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
          Annuler
        </ButtonV2>
        <ButtonV2
          onClick={handleValidate}
          disabled={
            validating ||
            totals.totalQuantityToShip === 0 ||
            totals.hasStockIssue
          }
          className="bg-verone-success hover:bg-verone-success/90"
        >
          {validating
            ? 'Validation...'
            : totals.allFullyShipped
              ? 'Valider Expédition Complète'
              : 'Valider Expédition Partielle'}
        </ButtonV2>
      </div>
    </div>
  );
}
