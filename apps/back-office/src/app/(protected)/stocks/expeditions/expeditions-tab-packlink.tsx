'use client';

import { Badge, ButtonV2, ResponsiveDataView } from '@verone/ui';
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
import { TabsContent } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Truck } from 'lucide-react';

import { PacklinkMobileCard } from './expeditions-packlink-mobile-card';
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

interface PacklinkRowActionsProps {
  shipment: PacklinkShipment;
  onCancel: (id: string) => void;
}

function PacklinkRowActions({ shipment, onCancel }: PacklinkRowActionsProps) {
  return (
    <div className="flex gap-1">
      {shipment.packlink_status === 'a_payer' && (
        <>
          <a
            href={`https://pro.packlink.fr/private/shipments/${shipment.packlink_shipment_id}/create/address`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ButtonV2 variant="outline" size="sm" className="text-xs">
              Finaliser sur Packlink
            </ButtonV2>
          </a>
          <ButtonV2
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700"
            onClick={() => onCancel(shipment.packlink_shipment_id)}
          >
            Annuler
          </ButtonV2>
        </>
      )}
      {shipment.label_url && (
        <a href={shipment.label_url} target="_blank" rel="noopener noreferrer">
          <ButtonV2 variant="ghost" size="sm" className="text-xs">
            Étiquette
          </ButtonV2>
        </a>
      )}
    </div>
  );
}

interface PacklinkShipmentRowProps {
  shipment: PacklinkShipment;
  onCancel: (id: string) => void;
}

function PacklinkShipmentRow({ shipment, onCancel }: PacklinkShipmentRowProps) {
  return (
    <TableRow key={shipment.packlink_shipment_id}>
      <TableCell className="font-mono text-sm">
        {shipment.order_number}
      </TableCell>
      <TableCell>{shipment.customer_name}</TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="space-y-0.5">
          {shipment.items.map((item, idx) => (
            <div key={idx} className="text-sm">
              {item.product_name}
              <span className="text-muted-foreground ml-1">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div>
          <p className="font-medium text-sm">{shipment.carrier_name ?? '-'}</p>
          {shipment.carrier_service && (
            <p className="text-xs text-muted-foreground">
              {shipment.carrier_service}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {shipment.shipping_cost != null
          ? formatCurrency(shipment.shipping_cost)
          : '-'}
      </TableCell>
      <TableCell>
        <Badge
          variant={getPacklinkStatusBadgeVariant(shipment.packlink_status)}
        >
          {getPacklinkStatusLabel(shipment.packlink_status)}
        </Badge>
      </TableCell>
      <TableCell className="hidden 2xl:table-cell">
        {shipment.tracking_number ? (
          <div>
            {shipment.tracking_url ? (
              <a
                href={shipment.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {shipment.tracking_number}
              </a>
            ) : (
              <span className="text-sm font-mono">
                {shipment.tracking_number}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">En attente</span>
        )}
      </TableCell>
      <TableCell>
        <PacklinkRowActions shipment={shipment} onCancel={onCancel} />
      </TableCell>
    </TableRow>
  );
}

interface PacklinkTabProps {
  packlinkShipments: PacklinkShipment[];
  onCancel: (shipmentId: string) => void;
}

const PacklinkEmptyState = (
  <p className="text-muted-foreground text-center py-8">
    Aucune expédition Packlink en cours
  </p>
);

export function PacklinkTab({ packlinkShipments, onCancel }: PacklinkTabProps) {
  return (
    <TabsContent value="packlink" className="space-y-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Expéditions Packlink en cours
          </CardTitle>
          <CardDescription>
            Transport à payer par Verone ou en cours d&apos;acheminement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveDataView<PacklinkShipment>
            data={packlinkShipments}
            emptyMessage={PacklinkEmptyState}
            renderTable={items => (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commande</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Articles
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Transporteur
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Coût transport
                      </TableHead>
                      <TableHead>Statut transport</TableHead>
                      <TableHead className="hidden 2xl:table-cell">
                        Suivi
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(shipment => (
                      <PacklinkShipmentRow
                        key={shipment.packlink_shipment_id}
                        shipment={shipment}
                        onCancel={onCancel}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            renderCard={(shipment: PacklinkShipment) => (
              <PacklinkMobileCard
                key={shipment.packlink_shipment_id}
                shipment={shipment}
                onCancel={onCancel}
              />
            )}
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
