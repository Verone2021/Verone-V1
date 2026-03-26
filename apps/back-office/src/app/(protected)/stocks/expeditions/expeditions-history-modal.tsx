'use client';

import { ProductThumbnail } from '@verone/products';
import { Badge, ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { Truck } from 'lucide-react';

import type { SalesOrder, ShipmentHistoryItem } from './expeditions-types';

function ShipmentItemsTable({ shipment }: { shipment: ShipmentHistoryItem }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]" />
          <TableHead>Produit</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Quantité</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipment.items?.map((item, idx: number) => (
          <TableRow key={idx}>
            <TableCell className="w-[50px] p-1">
              <ProductThumbnail
                src={item.product_image_url}
                alt={item.product_name}
                size="xs"
              />
            </TableCell>
            <TableCell>{item.product_name}</TableCell>
            <TableCell className="font-mono text-sm">
              {item.product_sku}
            </TableCell>
            <TableCell className="text-right font-medium text-green-600">
              +{item.quantity_shipped}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ShipmentCostsInfo({ shipment }: { shipment: ShipmentHistoryItem }) {
  if (!shipment.cost_paid_eur && !shipment.cost_charged_eur) return null;
  return (
    <div className="mt-4 pt-4 border-t space-y-1">
      {shipment.cost_paid_eur && (
        <p className="text-sm text-gray-600">
          Coût réel: {formatCurrency(shipment.cost_paid_eur)}
        </p>
      )}
      {shipment.cost_charged_eur && (
        <p className="text-sm text-gray-600">
          Coût facturé: {formatCurrency(shipment.cost_charged_eur)}
        </p>
      )}
    </div>
  );
}

function ShipmentDetailCard({
  shipment,
  index,
}: {
  shipment: ShipmentHistoryItem;
  index: number;
}) {
  return (
    <Card className="border-l-4 border-verone-success">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Expédition #{index + 1}</CardTitle>
            <CardDescription>
              {shipment.shipped_at
                ? `Expédiée le ${formatDate(shipment.shipped_at)}`
                : 'Date non disponible'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {shipment.shipped_by_name && (
              <Badge variant="outline">Par: {shipment.shipped_by_name}</Badge>
            )}
            {shipment.tracking_number && (
              <Badge variant="outline">Suivi: {shipment.tracking_number}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {shipment.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-700">Notes:</p>
            <p className="text-sm text-gray-600">{shipment.notes}</p>
          </div>
        )}
        {shipment.carrier_name && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm font-medium text-gray-700">
              Transporteur: {shipment.carrier_name}
            </p>
            {shipment.service_name && (
              <p className="text-sm text-gray-600">
                Service: {shipment.service_name}
              </p>
            )}
            {shipment.tracking_url && (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-verone-primary hover:underline"
              >
                Suivre le colis →
              </a>
            )}
          </div>
        )}
        <ShipmentItemsTable shipment={shipment} />
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-gray-700">
            Total expédié:{' '}
            <span className="text-verone-success font-bold">
              {shipment.total_quantity ?? 0} unités
            </span>
          </p>
        </div>
        <ShipmentCostsInfo shipment={shipment} />
      </CardContent>
    </Card>
  );
}

interface HistoryDetailModalProps {
  selectedOrder: SalesOrder | null;
  showHistoryModal: boolean;
  shipmentHistory: ShipmentHistoryItem[];
  onClose: () => void;
}

export function HistoryDetailModal({
  selectedOrder,
  showHistoryModal,
  shipmentHistory,
  onClose,
}: HistoryDetailModalProps) {
  if (!selectedOrder || !showHistoryModal) return null;
  return (
    <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Détails expédition - {selectedOrder.order_number}
            </CardTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              ✕
            </ButtonV2>
          </div>
          <CardDescription>
            Client: {selectedOrder.customer_name ?? 'Non renseigné'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shipmentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun détail d&apos;expédition disponible
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                Expéditions ({shipmentHistory.length})
              </h3>
              {shipmentHistory.map(
                (shipment: ShipmentHistoryItem, index: number) => (
                  <ShipmentDetailCard
                    key={index}
                    shipment={shipment}
                    index={index}
                  />
                )
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
