'use client';

import { useState } from 'react';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  History,
  CheckCircle2,
  ExternalLink,
  Mail,
  Download,
  Copy,
  Check,
} from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

import { resolveTrackingUrl } from '../carrier-tracking-url';

export interface ShipmentHistoryItem {
  /** UUID of the first sales_order_shipment row in this shipment group (same shipped_at). */
  id: string;
  shipped_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  delivery_method: string | null;
  carrier_name: string | null;
  carrier_service: string | null;
  shipping_cost: number | null;
  packlink_status: string | null;
  packlink_shipment_id: string | null;
  label_url: string | null;
  items: Array<{
    product_name: string;
    product_sku: string;
    quantity_shipped: number;
  }>;
}

export interface OrderShipmentHistoryCardProps {
  shipmentHistory: ShipmentHistoryItem[];
  order: SalesOrder;
  onSendTrackingEmail?: (shipment: ShipmentHistoryItem) => void;
}

/** Format a date string to French locale */
function formatDate(date: string | null): string {
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Notes auto-générées par les anciens flows wizard / scripts de sauvetage —
// polluantes pour l'utilisateur, doivent être masquées dans l'historique.
const LEGACY_NOTE_PATTERNS = [
  /Transport Packlink.+à payer par Verone/i,
  /Sauvetage manuel/i,
  /BO-BUG-SHIPMENT/i,
];

function isUserNote(notes: string | null): notes is string {
  if (!notes) return false;
  return !LEGACY_NOTE_PATTERNS.some(pattern => pattern.test(notes));
}

/**
 * Petit bouton "Copier" qui copie une valeur dans le presse-papier et affiche
 * une coche pendant 1.5s pour confirmer. Tombe en silence si l'API n'est pas
 * disponible (dev SSR par exemple).
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={`Copier ${label}`}
      onClick={() => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) return;
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(err => console.error('[CopyButton] failed', err));
      }}
      className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600" />
          Copié
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copier
        </>
      )}
    </button>
  );
}

export function OrderShipmentHistoryCard({
  shipmentHistory,
  order,
  onSendTrackingEmail,
}: OrderShipmentHistoryCardProps) {
  if (shipmentHistory.length === 0) return null;

  // Global shipping progress
  const totalOrdered =
    order.sales_order_items?.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0
    ) ?? 0;
  const totalShipped = shipmentHistory.reduce(
    (sum, h) =>
      sum + h.items.reduce((s, i) => s + (i.quantity_shipped ?? 0), 0),
    0
  );
  const percentShipped =
    totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-3 w-3" />
          Historique ({shipmentHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
        {totalOrdered > 0 && (
          <div className="mb-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-blue-900">
              <span>
                {shipmentHistory.length} expédition
                {shipmentHistory.length > 1 ? 's' : ''} · {totalShipped}/
                {totalOrdered} articles
              </span>
              <span>{percentShipped}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-blue-100">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${Math.min(percentShipped, 100)}%` }}
              />
            </div>
          </div>
        )}
        {shipmentHistory.map((h, idx) => (
          <div
            key={`shipment-${idx}`}
            className="border rounded p-2 bg-gray-50 text-xs"
          >
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-gray-800">
                Expédition #{idx + 1}
              </span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-600">{formatDate(h.shipped_at)}</span>
              {h.carrier_name && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                  {h.carrier_name}
                </Badge>
              )}
              {h.packlink_status && (
                <Badge
                  className={`text-[10px] px-1 py-0 ml-1 ${
                    h.packlink_status === 'a_payer'
                      ? 'bg-red-100 text-red-800'
                      : h.packlink_status === 'paye'
                        ? 'bg-green-100 text-green-800'
                        : h.packlink_status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : h.packlink_status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                  }`}
                >
                  {h.packlink_status === 'a_payer'
                    ? 'Transport à payer'
                    : h.packlink_status === 'paye'
                      ? 'Transport payé'
                      : h.packlink_status === 'in_transit'
                        ? 'En transit'
                        : h.packlink_status === 'delivered'
                          ? 'Livré'
                          : 'Incident'}
                </Badge>
              )}
              {h.delivery_method && !h.packlink_status && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                  {h.delivery_method === 'manual'
                    ? 'Manuel'
                    : h.delivery_method === 'pickup'
                      ? 'Retrait'
                      : h.delivery_method === 'hand_delivery'
                        ? 'Main propre'
                        : h.delivery_method}
                </Badge>
              )}
            </div>
            {h.packlink_status === 'a_payer' && (
              <p className="text-[10px] ml-4 mb-1">
                <a
                  href="https://pro.packlink.fr/private/shipments/ready-to-purchase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  Finaliser sur Packlink PRO
                </a>
              </p>
            )}
            {h.tracking_number && (
              <p className="text-[10px] text-gray-500 ml-4 mb-1 flex items-center flex-wrap gap-x-2">
                <span>Suivi :</span>
                {(() => {
                  const url = resolveTrackingUrl(
                    h.tracking_url,
                    h.carrier_name,
                    h.tracking_number
                  );
                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {h.tracking_number}
                    </a>
                  ) : (
                    <span>{h.tracking_number}</span>
                  );
                })()}
                <CopyButton value={h.tracking_number} label="le n° de suivi" />
                {onSendTrackingEmail && (
                  <button
                    className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline min-h-[44px] md:min-h-0 px-2 py-3 md:py-0.5"
                    onClick={() => onSendTrackingEmail(h)}
                  >
                    <Mail className="h-3 w-3" />
                    Envoyer au client
                  </button>
                )}
              </p>
            )}
            {h.shipping_cost != null && h.shipping_cost > 0 && (
              <p className="text-[10px] text-gray-500 ml-4 mb-1">
                Coût transport : {formatCurrency(h.shipping_cost)}
              </p>
            )}
            {h.label_url && (
              <div className="ml-4 mb-1">
                <a
                  href={h.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  title="Télécharger l'étiquette PDF du transporteur"
                >
                  <Download className="h-3 w-3" />
                  Télécharger le bordereau PDF
                </a>
              </div>
            )}
            <div className="ml-4 space-y-0.5">
              {h.items.map((item, itemIdx) => {
                const orderItem = order.sales_order_items?.find(
                  i => i.products?.sku === item.product_sku
                );
                const qtyOrdered = orderItem?.quantity ?? '?';
                return (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between gap-2"
                  >
                    <span
                      className="text-gray-600 flex-1 min-w-0 truncate"
                      title={item.product_name}
                    >
                      {item.product_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 shrink-0"
                    >
                      {item.quantity_shipped}/{qtyOrdered}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {isUserNote(h.notes) && (
              <p className="text-[10px] text-gray-500 ml-4 mt-1 italic">
                {h.notes}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
