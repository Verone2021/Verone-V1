'use client';

import { Card, CardContent } from '@verone/ui';

import { formatDateFr } from './shipping-tracking-helpers';

// ── Props ──────────────────────────────────────────────────────────────

export interface TrackingRecapCardProps {
  shipment: {
    tracking_number: string | null;
    tracking_url: string | null;
    carrier_name: string | null;
    shipped_at: string | null;
  };
  orderNumber: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function TrackingRecapCard({
  shipment,
  orderNumber,
}: TrackingRecapCardProps) {
  return (
    <Card className="bg-muted/40">
      <CardContent className="pt-3 pb-3 space-y-1 text-xs">
        <p className="font-semibold text-foreground">Commande {orderNumber}</p>
        {shipment.tracking_number ? (
          <>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Suivi :</span>{' '}
              <span className="font-mono">{shipment.tracking_number}</span>
              {shipment.carrier_name ? ` (${shipment.carrier_name})` : ''}
            </p>
            {(shipment.tracking_url ?? null) && (
              <p className="text-muted-foreground truncate">
                <span className="font-medium text-foreground">Lien :</span>{' '}
                <a
                  href={shipment.tracking_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {shipment.tracking_url}
                </a>
              </p>
            )}
          </>
        ) : (
          <p className="text-amber-600">Aucun numéro de suivi disponible</p>
        )}
        {shipment.shipped_at && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Expédié le :</span>{' '}
            {formatDateFr(shipment.shipped_at)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
