'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatDate } from '@verone/utils';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

import type { Shipment } from '@verone/orders/hooks';

interface ShipmentCardProps {
  shipment: Shipment;
}

// Mapping statuts shipments avec couleurs
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
  }
> = {
  PENDING: { label: 'En attente', variant: 'secondary' },
  PROCESSING: { label: 'En traitement', variant: 'default' },
  READY_FOR_SHIPPING: { label: 'Prêt à expédier', variant: 'warning' },
  TRACKING: { label: 'Suivi actif', variant: 'default' },
  IN_TRANSIT: { label: 'En transit', variant: 'default' },
  OUT_FOR_DELIVERY: { label: 'En livraison', variant: 'warning' },
  DELIVERED: { label: 'Livré', variant: 'success' },
  INCIDENT: { label: 'Incident', variant: 'destructive' },
  RETURNED_TO_SENDER: { label: 'Retourné', variant: 'destructive' },
};

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  const statusConfig = shipment.status
    ? STATUS_CONFIG[shipment.status] || {
        label: shipment.status,
        variant: 'default' as const,
      }
    : { label: 'Inconnu', variant: 'secondary' as const };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {shipment.carrier_name || 'Packlink'} -{' '}
              {shipment.service_name || 'Standard'}
            </CardTitle>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations expédition */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Créé:</span>
            <span className="font-medium">
              {formatDate(shipment.created_at)}
            </span>
          </div>

          {shipment.shipped_at && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Expédié:</span>
              <span className="font-medium">
                {formatDate(shipment.shipped_at)}
              </span>
            </div>
          )}

          {shipment.delivered_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Livré:</span>
              <span className="font-medium">
                {formatDate(shipment.delivered_at)}
              </span>
            </div>
          )}

          {shipment.estimated_delivery_at && !shipment.delivered_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Livraison estimée:</span>
              <span className="font-medium">
                {formatDate(shipment.estimated_delivery_at)}
              </span>
            </div>
          )}
        </div>

        {/* Numéro de suivi */}
        {shipment.tracking_number && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Suivi:</span>
            {shipment.tracking_url ? (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono font-medium text-primary hover:underline flex items-center gap-1"
              >
                {shipment.tracking_number}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-sm font-mono font-medium">
                {shipment.tracking_number}
              </span>
            )}
          </div>
        )}

        {/* Lien étiquette Packlink */}
        {shipment.packlink_label_url && (
          <div className="flex justify-end">
            <a
              href={shipment.packlink_label_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Télécharger l'étiquette
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Timeline tracking events */}
        {shipment.tracking_events && shipment.tracking_events.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Historique de suivi</p>
            <div className="space-y-2">
              {shipment.tracking_events.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {event.description || event.event_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatDate(event.event_timestamp)}</span>
                      {event.city && (
                        <>
                          <span>•</span>
                          <span>{event.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {shipment.notes && (
          <div className="text-sm text-muted-foreground italic border-t pt-3">
            {shipment.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
