/**
 * Shipment Card
 * Carte affichant un résumé d'expédition avec actions
 */

'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Package,
  Truck,
  Download,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

import { ShipmentStatusBadge } from './ShipmentStatusBadge';

interface ShipmentCardProps {
  shipment: {
    id: string;
    shipping_method: string;
    carrier_name: string | null;
    tracking_number: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    packlink_label_url: string | null;
    metadata?: {
      status?: string;
    } | null;
  };
  onPay?: (shipmentId: string) => void;
  onDownloadPDF?: (labelUrl: string) => void;
  onViewTracking?: (trackingNumber: string) => void;
}

export function ShipmentCard({
  shipment,
  onPay,
  onDownloadPDF,
  onViewTracking,
}: ShipmentCardProps) {
  const isPacklink = shipment.shipping_method === 'packlink';
  const isDraft = shipment.metadata?.status === 'DRAFT';
  const isPaid = shipment.shipped_at !== null;
  const hasLabel = shipment.packlink_label_url !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isPacklink ? (
              <Package className="h-4 w-4" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {shipment.carrier_name || 'Packlink'}
          </CardTitle>
          <ShipmentStatusBadge shipment={shipment} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {shipment.tracking_number && (
          <div className="text-sm">
            <span className="text-muted-foreground">Suivi :</span>{' '}
            <span className="font-mono">{shipment.tracking_number}</span>
          </div>
        )}

        {shipment.shipped_at && (
          <div className="text-sm text-muted-foreground">
            Expédiée le{' '}
            {new Date(shipment.shipped_at).toLocaleDateString('fr-FR')}
          </div>
        )}

        {shipment.delivered_at && (
          <div className="text-sm text-muted-foreground">
            Livrée le{' '}
            {new Date(shipment.delivered_at).toLocaleDateString('fr-FR')}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {/* Bouton Payer (si draft Packlink) */}
          {isPacklink && isDraft && onPay && (
            <Button size="sm" onClick={() => onPay(shipment.id)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer
            </Button>
          )}

          {/* Bouton Télécharger PDF (si payé avec label) */}
          {isPacklink && isPaid && hasLabel && onDownloadPDF && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadPDF(shipment.packlink_label_url!)}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
          )}

          {/* Bouton Voir tracking (si tracking number) */}
          {shipment.tracking_number && onViewTracking && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewTracking(shipment.tracking_number!)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir suivi
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
