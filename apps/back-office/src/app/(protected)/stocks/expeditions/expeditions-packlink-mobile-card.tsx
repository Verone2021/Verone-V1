'use client';

import {
  Badge,
  ButtonV2,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ExternalLink } from 'lucide-react';

import type { PacklinkShipment } from './expeditions-types';

function getPacklinkStatusBadgeVariant(
  status: string | null
): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (status === 'a_payer' || status === 'incident') return 'destructive';
  if (status === 'paye') return 'default';
  if (status === 'in_transit') return 'secondary';
  return 'outline';
}

function getPacklinkStatusLabel(status: string | null): string {
  if (status === 'a_payer') return 'Transport à payer';
  if (status === 'paye') return 'Transport payé';
  if (status === 'in_transit') return 'En transit';
  if (status === 'incident') return 'Incident';
  return status ?? '-';
}

export interface PacklinkMobileCardProps {
  shipment: PacklinkShipment;
  onCancel: (id: string) => void;
}

export function PacklinkMobileCard({
  shipment,
  onCancel,
}: PacklinkMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium font-mono">{shipment.order_number}</span>
          <Badge
            variant={getPacklinkStatusBadgeVariant(shipment.packlink_status)}
          >
            {getPacklinkStatusLabel(shipment.packlink_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-2 space-y-1">
        <p className="text-sm text-gray-700">{shipment.customer_name}</p>

        {shipment.carrier_name && (
          <div>
            <p className="text-sm font-medium">{shipment.carrier_name}</p>
            {shipment.carrier_service && (
              <p className="text-xs text-muted-foreground">
                {shipment.carrier_service}
              </p>
            )}
          </div>
        )}

        {shipment.shipping_cost != null && (
          <p className="text-sm text-gray-600">
            Coût : {formatCurrency(shipment.shipping_cost)}
          </p>
        )}

        {shipment.tracking_number && (
          <div className="text-sm">
            <span className="text-gray-500 text-xs">Suivi : </span>
            {shipment.tracking_url ? (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-xs"
              >
                {shipment.tracking_number}
              </a>
            ) : (
              <span className="font-mono text-xs">
                {shipment.tracking_number}
              </span>
            )}
          </div>
        )}

        {shipment.items.length > 0 && (
          <div className="pt-1 space-y-0.5">
            {shipment.items.map((item, idx) => (
              <p key={idx} className="text-xs text-gray-600">
                {item.product_name}{' '}
                <span className="text-muted-foreground">x{item.quantity}</span>
              </p>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex flex-col gap-2">
        {shipment.packlink_status === 'a_payer' && (
          <>
            <a
              href={`https://pro.packlink.fr/private/shipments/${shipment.packlink_shipment_id}/create/address`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <ButtonV2 variant="outline" className="h-11 w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Finaliser sur Packlink
              </ButtonV2>
            </a>
            <ButtonV2
              variant="ghost"
              className="h-11 w-full text-red-600 hover:text-red-700"
              onClick={() => onCancel(shipment.packlink_shipment_id)}
            >
              Annuler
            </ButtonV2>
          </>
        )}
        {shipment.label_url && (
          <a
            href={shipment.label_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <ButtonV2 variant="ghost" className="h-11 w-full">
              Étiquette
            </ButtonV2>
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
