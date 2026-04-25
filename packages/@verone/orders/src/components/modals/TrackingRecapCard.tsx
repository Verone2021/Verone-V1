'use client';

import { Card, CardContent } from '@verone/ui';

import {
  formatDateFr,
  type ShipmentForEmail,
} from './shipping-tracking-helpers';

// ── Props ──────────────────────────────────────────────────────────────

export interface TrackingRecapCardProps {
  /** Toutes les expéditions à inclure dans l'email. Vide → message d'alerte. */
  shipments: ShipmentForEmail[];
  orderNumber: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function TrackingRecapCard({
  shipments,
  orderNumber,
}: TrackingRecapCardProps) {
  return (
    <Card className="bg-muted/40">
      <CardContent className="pt-3 pb-3 space-y-2 text-xs">
        <p className="font-semibold text-foreground">
          Commande {orderNumber}
          {shipments.length > 1 && (
            <span className="ml-1 text-muted-foreground font-normal">
              ({shipments.length} colis)
            </span>
          )}
        </p>
        {shipments.length === 0 ? (
          <p className="text-amber-600">
            Aucune expédition sélectionnée — l'email ne peut pas être envoyé.
          </p>
        ) : (
          shipments.map((s, idx) => (
            <div
              key={s.id}
              className={
                idx > 0
                  ? 'pt-2 border-t border-border space-y-0.5'
                  : 'space-y-0.5'
              }
            >
              {shipments.length > 1 && (
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide font-semibold">
                  Colis {idx + 1} / {shipments.length}
                </p>
              )}
              {s.tracking_number ? (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Suivi :</span>{' '}
                  <span className="font-mono">{s.tracking_number}</span>
                  {s.carrier_name ? ` (${s.carrier_name})` : ''}
                </p>
              ) : (
                <p className="text-amber-600">
                  Aucun numéro de suivi disponible
                </p>
              )}
              {s.tracking_url && (
                <p className="text-muted-foreground truncate">
                  <span className="font-medium text-foreground">Lien :</span>{' '}
                  <a
                    href={s.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {s.tracking_url}
                  </a>
                </p>
              )}
              {s.shipped_at && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Expédié le :
                  </span>{' '}
                  {formatDateFr(s.shipped_at)}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
