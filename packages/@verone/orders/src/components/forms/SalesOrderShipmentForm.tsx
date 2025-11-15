'use client';

/**
 * 📦 Formulaire Expédition Sales Order
 * Workflow Odoo-inspired avec validation inline - identique à PurchaseOrderReceptionForm
 */

import { useState, useEffect, useMemo } from 'react';

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
import { Package, CheckCircle2, Truck } from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

interface ShipmentItem {
  sales_order_item_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_ordered: number;
  quantity_already_shipped: number;
  quantity_remaining: number;
  quantity_to_ship: number;
  unit_price_ht: number;
}

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
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // Initialiser items
  useEffect(() => {
    const shipmentItems = prepareShipmentItems(salesOrder);
    setItems(shipmentItems);
  }, [salesOrder, prepareShipmentItems]);

  // Charger historique
  useEffect(() => {
    loadShipmentHistory(salesOrder.id).then(setHistory);
  }, [salesOrder.id, loadShipmentHistory]);

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

    return { totalQuantityToShip, totalValue, allFullyShipped };
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

  // Expédier tout (auto-fill quantités restantes)
  const handleShipAll = () => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        quantity_to_ship: item.quantity_remaining,
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

    // Parser l'adresse shipping depuis salesOrder
    const shippingAddr = salesOrder.shipping_address || {};
    const parsedAddress =
      typeof shippingAddr === 'string'
        ? { address_line1: shippingAddr }
        : shippingAddr;

    const result = await validateShipment({
      sales_order_id: salesOrder.id,
      items: itemsToShip,
      shipped_at: shippedAt + 'T' + new Date().toTimeString().split(' ')[0],
      notes: notes || undefined,
      shipped_by: user.id,
      carrier_info: {
        carrier_type: 'other' as const,
        carrier_name: 'Manuel',
      },
      shipping_address: {
        recipient_name: salesOrder.customer_name || 'Client',
        address_line1:
          parsedAddress.address_line1 ||
          parsedAddress.street1 ||
          'Adresse non renseignée',
        address_line2: parsedAddress.address_line2 || parsedAddress.street2,
        postal_code:
          parsedAddress.postal_code || parsedAddress.zip_code || '00000',
        city: parsedAddress.city || 'Ville',
        country: parsedAddress.country || 'FR',
        phone: parsedAddress.phone || salesOrder.organisations?.phone,
        email: parsedAddress.email || salesOrder.organisations?.email,
      },
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
            Commande {salesOrder.order_number} •{' '}
            {salesOrder.organisations?.trade_name ||
              salesOrder.organisations?.legal_name}
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
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            À expédier
          </div>
          <div className="text-2xl font-bold mt-1">
            {totals.totalQuantityToShip}
          </div>
          <div className="text-xs text-muted-foreground mt-1">unités</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Valeur
          </div>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(totals.totalValue)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">HT</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Statut
          </div>
          <Badge
            className="mt-1"
            variant={totals.allFullyShipped ? 'secondary' : 'secondary'}
          >
            {totals.allFullyShipped ? 'Complète' : 'Partielle'}
          </Badge>
        </Card>
      </div>

      {/* Table Items */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-center">Commandée</TableHead>
              <TableHead className="text-center">Déjà expédiée</TableHead>
              <TableHead className="text-center">Restante</TableHead>
              <TableHead className="text-center">À expédier</TableHead>
              <TableHead className="text-right">Prix Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.sales_order_item_id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.product_sku}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {item.quantity_ordered}
                </TableCell>
                <TableCell className="text-center">
                  {item.quantity_already_shipped > 0 && (
                    <Badge variant="secondary">
                      {item.quantity_already_shipped}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{item.quantity_remaining}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={item.quantity_remaining}
                    value={item.quantity_to_ship}
                    onChange={e =>
                      handleQuantityChange(
                        item.sales_order_item_id,
                        e.target.value
                      )
                    }
                    className="w-20 text-center"
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.quantity_to_ship * item.unit_price_ht)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
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
          <Label>Notes expédition (optionnel)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Historique expéditions ({history.length})
          </h4>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div
                key={idx}
                className="text-sm border-l-2 border-verone-success pl-3 py-1"
              >
                <div className="font-medium">
                  {formatDate(h.shipped_at)} • {h.total_quantity} unités
                </div>
                <div className="text-muted-foreground text-xs">
                  {h.items
                    .map((i: any) => `${i.product_sku}: ${i.quantity_shipped}`)
                    .join(', ')}
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
          disabled={validating || totals.totalQuantityToShip === 0}
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
