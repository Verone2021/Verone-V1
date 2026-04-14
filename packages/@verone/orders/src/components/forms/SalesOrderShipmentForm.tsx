'use client';

/**
 * Formulaire Expédition Sales Order
 * Pattern miroir de PurchaseOrderReceptionForm
 */

import { useState, useEffect, useMemo } from 'react';

import type { ShipmentItem } from '@verone/types';
import {
  Badge,
  ButtonV2,
  Card,
  Input,
  Label,
  SuccessDialog,
  Textarea,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { Truck } from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

import { ShipmentHistorySection } from './ShipmentHistorySection';
import { ShipmentItemsTable } from './ShipmentItemsTable';

interface IShipmentResultSummary {
  isComplete: boolean;
  orderNumber: string;
  customerName: string;
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity_shipped: number;
  }>;
  totalValue: number;
  trackingNumber?: string;
}

interface ISalesOrderShipmentFormProps {
  salesOrder: SalesOrderForShipment;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SalesOrderShipmentForm({
  salesOrder,
  onSuccess,
  onCancel,
}: ISalesOrderShipmentFormProps): React.ReactNode {
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
  const [history, setHistory] = useState<
    Array<{
      shipped_at: string;
      tracking_number?: string;
      total_quantity: number;
      items?: Array<{
        product_sku: string;
        product_name: string;
        quantity_shipped: number;
      }>;
    }>
  >([]);
  const [shipmentResult, setShipmentResult] =
    useState<IShipmentResultSummary | null>(null);

  useEffect(() => {
    const shipmentItems = prepareShipmentItems(salesOrder);
    setItems(shipmentItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  useEffect(() => {
    void loadShipmentHistory(salesOrder.id).then(setHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder.id]);

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
    const hasStockIssue = items.some(
      item => item.quantity_to_ship > item.stock_available
    );
    return { totalQuantityToShip, totalValue, allFullyShipped, hasStockIssue };
  }, [items]);

  const handleQuantityChange = (itemId: string, value: string): void => {
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

  const handleShipAll = (): void => {
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

  const handleValidate = async (): Promise<void> => {
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
      const shippedItems = items
        .filter(item => item.quantity_to_ship > 0)
        .map(item => ({
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity_shipped: item.quantity_to_ship,
        }));
      setShipmentResult({
        isComplete: totals.allFullyShipped,
        orderNumber: salesOrder.order_number,
        customerName: salesOrder.customer_name ?? 'Client',
        items: shippedItems,
        totalValue: totals.totalValue,
        trackingNumber: trackingNumber || undefined,
      });
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
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
        <ButtonV2 variant="outline" onClick={handleShipAll}>
          Tout expédier
        </ButtonV2>
      </div>

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

      <ShipmentItemsTable
        items={items}
        onQuantityChange={handleQuantityChange}
      />

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

      <ShipmentHistorySection history={history} items={items} />

      <div className="flex justify-end gap-3">
        <ButtonV2 variant="outline" onClick={onCancel} disabled={validating}>
          Annuler
        </ButtonV2>
        <ButtonV2
          onClick={() => {
            void handleValidate();
          }}
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

      <SuccessDialog
        open={shipmentResult !== null}
        onOpenChange={open => {
          if (!open) {
            setShipmentResult(null);
            onSuccess();
          }
        }}
        title={
          shipmentResult?.isComplete
            ? 'Expédition complète validée'
            : 'Expédition partielle validée'
        }
        description={`L'expédition de la commande ${shipmentResult?.orderNumber ?? ''} pour ${shipmentResult?.customerName ?? ''} a été enregistrée.`}
      >
        {shipmentResult && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Produits expédiés
              </div>
              <div className="space-y-1.5">
                {shipmentResult.items.map(item => (
                  <div
                    key={item.product_sku}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.product_name}
                      </span>
                      <span className="text-gray-400 ml-1.5 text-xs">
                        {item.product_sku}
                      </span>
                    </div>
                    <span className="font-semibold text-blue-700">
                      ×{item.quantity_shipped}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {shipmentResult.trackingNumber && (
              <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Tracking :
                </span>
                <span className="text-sm font-mono text-blue-600">
                  {shipmentResult.trackingNumber}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border bg-emerald-50 p-3">
              <span className="text-sm font-medium text-emerald-700">
                Valeur expédiée HT
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(shipmentResult.totalValue)}
              </span>
            </div>
          </div>
        )}
      </SuccessDialog>
    </div>
  );
}
