'use client';

import { Package, Ruler, Scale, Truck } from 'lucide-react';

import { Badge, Button, Card } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

import type { PackageInfo, PreviousShipmentGroup } from './types';

interface PreviousShipmentCardProps {
  group: PreviousShipmentGroup;
  index: number;
  onReusePackages?: (packages: PackageInfo[]) => void;
}

const PACKLINK_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  a_payer: {
    label: 'À payer',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
  paye: {
    label: 'Payé',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  in_transit: {
    label: 'En transit',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  delivered: {
    label: 'Livré',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  incident: {
    label: 'Incident',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
};

export function PreviousShipmentCard({
  group,
  index,
  onReusePackages,
}: PreviousShipmentCardProps) {
  const statusStyle = group.packlink_status
    ? PACKLINK_STATUS_LABELS[group.packlink_status]
    : null;

  const totalQty = group.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = group.packages_info.reduce(
    (sum, pkg) => sum + pkg.weight,
    0
  );
  const nbPackages = group.packages_info.length;

  return (
    <Card
      variant="flat"
      padding="sm"
      className="border-orange-200 bg-orange-50/40 space-y-3"
    >
      {/* Header : titre + badge statut */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="font-semibold text-sm truncate">
            Expédition #{index + 1} —{' '}
            {new Date(group.shipped_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {statusStyle && (
          <Badge className={`text-xs shrink-0 ${statusStyle.className}`}>
            {statusStyle.label}
          </Badge>
        )}
      </div>

      {/* Transporteur + coût */}
      {group.carrier_name && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
          <Truck className="h-3 w-3 shrink-0" />
          <span className="font-medium">{group.carrier_name}</span>
          {group.shipping_cost != null && (
            <span className="text-slate-500">
              · {formatCurrency(group.shipping_cost)}
            </span>
          )}
        </div>
      )}

      {/* Colis — dimensions + poids */}
      {nbPackages > 0 && (
        <div className="border-t border-orange-200 pt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-600">
              {nbPackages} colis · {totalWeight.toFixed(1)} kg total
            </p>
            {onReusePackages && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                onClick={() => onReusePackages(group.packages_info)}
              >
                Reproduire ces dimensions
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {group.packages_info.map((pkg, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700"
              >
                <span className="font-medium w-16 shrink-0">Colis {i + 1}</span>
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {pkg.width} × {pkg.length} × {pkg.height} cm
                </span>
                <span className="inline-flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {pkg.weight} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles envoyés */}
      <div className="border-t border-orange-200 pt-2">
        <p className="text-xs font-medium text-slate-600 mb-1">
          {totalQty} article{totalQty > 1 ? 's' : ''} envoyé
          {totalQty > 1 ? 's' : ''}
        </p>
        <div className="space-y-0.5">
          {group.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 text-xs text-slate-700"
            >
              <span className="truncate">{item.product_name}</span>
              <span className="font-medium shrink-0">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suivi tracking */}
      {group.tracking_url && (
        <a
          href={group.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-blue-600 hover:underline"
        >
          Suivi → {group.tracking_number ?? 'lien transporteur'}
        </a>
      )}

      {/* Fallback : pas de packages_info (shipments antérieurs à la migration) */}
      {nbPackages === 0 && group.delivery_method === 'packlink' && (
        <p className="text-[11px] italic text-slate-500 border-t border-orange-200 pt-2">
          Dimensions non enregistrées (expédition créée avant l'enrichissement).
        </p>
      )}
    </Card>
  );
}
