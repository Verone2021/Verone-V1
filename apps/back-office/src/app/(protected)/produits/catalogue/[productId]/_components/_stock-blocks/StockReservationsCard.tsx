'use client';

/**
 * StockReservationsCard — réservations actives (col-span-4).
 * Sprint : BO-UI-PROD-STOCK-001
 */

import { Lock } from 'lucide-react';

import type { StockReservation } from '@verone/stock';

interface StockReservationsCardProps {
  reservations: StockReservation[];
  totalQty: number;
  onRelease: (reservationId: string) => void;
}

function formatExpiresIn(expiresAt: string | null): string {
  if (!expiresAt) return 'sans expiration';
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'expirée';
  if (days === 0) return "expire aujourd'hui";
  return `expire dans ${days} j`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function formatRef(refType: string, refId: string): string {
  const prefixMap: Record<string, string> = {
    sales_order: 'SO',
    production_order: 'PROD',
    manual: 'MAN',
  };
  const prefix = prefixMap[refType] ?? refType.toUpperCase();
  return `${prefix}-${refId.slice(0, 8)}`;
}

export function StockReservationsCard({
  reservations,
  totalQty,
  onRelease,
}: StockReservationsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Réservations actives
        </h3>
        {reservations.length > 0 && (
          <span className="rounded px-1.5 py-0.5 text-[10px] border bg-neutral-100 text-neutral-600 border-neutral-200">
            {reservations.length} réservation
            {reservations.length > 1 ? 's' : ''}
            &nbsp;·&nbsp;{totalQty}&nbsp;u
          </span>
        )}
      </div>

      {/* Liste */}
      {reservations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-sm text-neutral-400">
          Aucune réservation active
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
          {reservations.map(r => (
            <li
              key={r.id}
              className="group flex items-start gap-2 px-4 py-3 hover:bg-neutral-50 transition-colors"
            >
              <Lock className="h-3.5 w-3.5 text-neutral-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {formatRef(r.reference_type, r.reference_id)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Réservé&nbsp;
                  <span className="tabular-nums font-medium text-neutral-700">
                    {r.reserved_quantity}&nbsp;u
                  </span>
                  &nbsp;·&nbsp;{formatExpiresIn(r.expires_at)}
                  {r.expires_at && <>&nbsp;·&nbsp;{formatDate(r.expires_at)}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRelease(r.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[11px] text-red-600 hover:bg-red-50 px-2 py-0.5 rounded border border-transparent hover:border-red-200"
              >
                Libérer
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-neutral-100">
        <p className="text-[10px] italic text-neutral-400">
          Une réservation se libère automatiquement à son expiration si la
          commande n&apos;est pas validée.
        </p>
      </div>
    </div>
  );
}
