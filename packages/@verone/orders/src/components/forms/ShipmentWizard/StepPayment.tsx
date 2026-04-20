'use client';

import type { ShipmentItem } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  CheckCircle2,
  Truck,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import type { PacklinkService, PackageInfo, DropoffPoint } from './types';
import { WizardSummaryPanel } from './WizardSummaryPanel';
import type { SalesOrderForShipment } from '@verone/orders/hooks';

interface StepPaymentProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  declaredValue: number;
  wantsInsurance: boolean;
  insurancePrice: number;
  selectedService: PacklinkService;
  senderDropoffs: DropoffPoint[];
  selectedSenderDropoff: string | null;
  receiverDropoffs: DropoffPoint[];
  selectedReceiverDropoff: string | null;
  customerName: string;
  addr: Record<string, string> | null;
  paying: boolean;
  servicesError: string | null;
  formatTransit: (hours: string) => string;
  formatEstimatedDate: (dateStr: string) => string;
  onBack: () => void;
  onCreateDraft: () => void;
}

export function StepPayment({
  salesOrder,
  packages,
  items,
  contentDescription,
  declaredValue,
  wantsInsurance,
  insurancePrice,
  selectedService,
  senderDropoffs,
  selectedSenderDropoff,
  receiverDropoffs,
  selectedReceiverDropoff,
  customerName,
  addr,
  paying,
  servicesError,
  formatTransit,
  formatEstimatedDate,
  onBack,
  onCreateDraft,
}: StepPaymentProps) {
  const totalAmount =
    selectedService.price.total_price + (wantsInsurance ? insurancePrice : 0);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Paiement expedition
        </h3>

        <div className="space-y-3">
          {/* Expediteur */}
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">Expediteur</Label>
            <p className="font-medium text-sm mt-1">Verone Collections</p>
            <p className="text-xs text-muted-foreground">
              4 rue du Perou, 91300 Massy
            </p>
          </div>

          {/* Destinataire */}
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">
              Destinataire
            </Label>
            <p className="font-medium text-sm mt-1">{customerName}</p>
            {addr && (
              <p className="text-xs text-muted-foreground">
                {addr.address_line1 ?? addr.line1 ?? ''},{' '}
                {addr.postal_code ?? ''} {addr.city ?? ''}
              </p>
            )}
          </div>

          {/* Relais depot (expediteur) */}
          {selectedSenderDropoff && (
            <div className="border rounded-lg p-3 border-l-4 border-l-blue-500">
              <Label className="text-xs text-blue-700 font-semibold">
                Relais de depot (expediteur)
              </Label>
              <p className="font-medium text-sm mt-1">
                {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                  ?.commerce_name ?? 'Relais selectionne'}
              </p>
              <p className="text-xs text-muted-foreground">
                {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                  ?.address ?? ''}
                ,{' '}
                {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                  ?.zip ?? ''}{' '}
                {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                  ?.city ?? ''}
              </p>
            </div>
          )}

          {/* Relais retrait (destinataire) */}
          {selectedReceiverDropoff && (
            <div className="border rounded-lg p-3 border-l-4 border-l-green-500">
              <Label className="text-xs text-green-700 font-semibold">
                Relais de retrait (destinataire)
              </Label>
              <p className="font-medium text-sm mt-1">
                {receiverDropoffs.find(d => d.id === selectedReceiverDropoff)
                  ?.commerce_name ?? 'Relais selectionne'}
              </p>
              <p className="text-xs text-muted-foreground">
                {receiverDropoffs.find(d => d.id === selectedReceiverDropoff)
                  ?.address ?? ''}
                ,{' '}
                {receiverDropoffs.find(d => d.id === selectedReceiverDropoff)
                  ?.zip ?? ''}{' '}
                {receiverDropoffs.find(d => d.id === selectedReceiverDropoff)
                  ?.city ?? ''}
              </p>
            </div>
          )}

          {/* Colis */}
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">Colis</Label>
            {packages.map((pkg, idx) => (
              <p key={idx} className="text-sm mt-1">
                Colis {idx + 1} : {pkg.length} x {pkg.width} x {pkg.height} cm —{' '}
                {pkg.weight} kg
              </p>
            ))}
          </div>

          {/* Transporteur */}
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">
              Transporteur
            </Label>
            <p className="font-medium text-sm mt-1">
              {selectedService.carrier_name} — {selectedService.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTransit(selectedService.transit_hours)} ·{' '}
              {selectedService.delivery_to_parcelshop
                ? 'Point relais'
                : 'Domicile'}
              {selectedService.first_estimated_delivery_date &&
                ` · Livraison prevue le ${formatEstimatedDate(selectedService.first_estimated_delivery_date)}`}
            </p>
          </div>

          {/* Articles */}
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">Articles</Label>
            {items
              .filter(i => (i.quantity_to_ship ?? 0) > 0)
              .map(i => (
                <p key={i.sales_order_item_id} className="text-sm mt-0.5">
                  {i.product_name} x{i.quantity_to_ship}
                </p>
              ))}
          </div>

          {/* Total cost — payment highlight */}
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-800">
                Montant a payer
              </span>
              <span className="font-bold text-2xl text-blue-700">
                {totalAmount.toFixed(2)} EUR
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Debite sur le compte Packlink PRO
              {wantsInsurance &&
                ` · dont ${insurancePrice.toFixed(2)} EUR de protection`}
            </p>
          </div>
        </div>

        {servicesError && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-red-50 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {servicesError}
          </div>
        )}

        <div className="flex justify-between">
          <ButtonV2 variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
          <ButtonV2
            onClick={onCreateDraft}
            disabled={paying}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Truck className="h-4 w-4 mr-1" />
            )}
            Creer l expedition — {totalAmount.toFixed(2)} EUR
          </ButtonV2>
        </div>
      </div>

      {/* Summary panel */}
      <WizardSummaryPanel
        salesOrder={salesOrder}
        packages={packages}
        items={items}
        contentDescription={contentDescription}
        declaredValue={declaredValue}
        selectedService={selectedService}
        wantsInsurance={wantsInsurance}
      />
    </div>
  );
}
