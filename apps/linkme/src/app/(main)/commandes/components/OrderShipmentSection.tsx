'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TruckIcon } from 'lucide-react';

import { Badge } from '@verone/ui';

interface ShipmentRow {
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  packlink_status: string | null;
  shipped_at: string | null;
}

interface OrderShipmentSectionProps {
  shipmentTracking: ShipmentRow[];
}

export function OrderShipmentSection({
  shipmentTracking,
}: OrderShipmentSectionProps) {
  const visibleRows = shipmentTracking.filter(
    s => s.tracking_number ?? s.carrier_name
  );

  if (visibleRows.length === 0) return null;

  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
        <TruckIcon className="h-4 w-4 text-[#5DBEBB]" />
        Suivi expedition
      </h3>
      <div className="space-y-2">
        {visibleRows.map((s, idx) => (
          <div
            key={idx}
            className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              {s.carrier_name && (
                <p className="text-sm font-medium text-[#183559]">
                  {s.carrier_name}
                </p>
              )}
              {s.tracking_number && (
                <p className="text-xs text-gray-600">
                  Suivi :{' '}
                  {s.tracking_url ? (
                    <a
                      href={s.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5DBEBB] underline hover:no-underline"
                    >
                      {s.tracking_number}
                    </a>
                  ) : (
                    s.tracking_number
                  )}
                </p>
              )}
              {s.shipped_at && (
                <p className="text-xs text-gray-500">
                  Expedie le{' '}
                  {format(new Date(s.shipped_at), 'dd MMM yyyy', {
                    locale: fr,
                  })}
                </p>
              )}
            </div>
            {s.packlink_status && (
              <Badge
                className={`text-xs ${
                  s.packlink_status === 'in_transit'
                    ? 'bg-blue-100 text-blue-800'
                    : s.packlink_status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : s.packlink_status === 'paye'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                }`}
              >
                {s.packlink_status === 'in_transit'
                  ? 'En transit'
                  : s.packlink_status === 'delivered'
                    ? 'Livre'
                    : s.packlink_status === 'paye'
                      ? 'Expedie'
                      : s.packlink_status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
