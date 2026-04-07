'use client';

import { Card } from '@verone/ui';

import type { WizardSummaryPanelProps } from './types';

export function WizardSummaryPanel({
  salesOrder,
  packages,
  items,
  contentDescription,
  declaredValue,
  selectedService,
  wantsInsurance,
}: WizardSummaryPanelProps) {
  const addr = (salesOrder.shipping_address ?? null) as Record<
    string,
    string
  > | null;
  const customerName = salesOrder.customer_name ?? 'Client';

  const insurancePrice = Math.max(2, declaredValue * 0.03);

  return (
    <div className="w-64 flex-shrink-0">
      <Card className="p-4 space-y-4 text-sm sticky top-4">
        <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
          Résumé
        </p>

        {/* From */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">DE</p>
          <p className="font-medium">Verone Collections</p>
          <p className="text-xs text-muted-foreground">
            4 rue du Perou, 91300 Massy
          </p>
        </div>

        {/* To */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">À</p>
          <p className="font-medium">{customerName}</p>
          {addr && (
            <p className="text-xs text-muted-foreground">
              {addr.line1 ?? ''}, {addr.postal_code ?? ''} {addr.city ?? ''}
            </p>
          )}
        </div>

        {/* Packages */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">COLIS</p>
          {packages.map((pkg, idx) => (
            <p key={idx} className="text-xs text-muted-foreground">
              Colis {idx + 1} : {pkg.length}×{pkg.width}×{pkg.height} cm —{' '}
              {pkg.weight} kg
            </p>
          ))}
        </div>

        {/* Content */}
        {contentDescription && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">CONTENU</p>
            <p className="text-xs">{contentDescription}</p>
            <p className="text-xs text-muted-foreground">
              Valeur : {declaredValue.toFixed(2)} €
            </p>
          </div>
        )}

        {/* Service */}
        {selectedService && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">SERVICE</p>
            <p className="font-medium">{selectedService.carrier_name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedService.name}
            </p>
          </div>
        )}

        {/* Price */}
        {selectedService && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground font-medium">PRIX</p>
            <p className="font-bold text-base">
              {(
                selectedService.price.total_price +
                (wantsInsurance ? insurancePrice : 0)
              ).toFixed(2)}{' '}
              €
            </p>
            {wantsInsurance && (
              <p className="text-xs text-muted-foreground">
                dont {insurancePrice.toFixed(2)} € protection
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">ARTICLES</p>
          {items
            .filter(i => (i.quantity_to_ship ?? 0) > 0)
            .map(i => (
              <p
                key={i.sales_order_item_id}
                className="text-xs text-muted-foreground"
              >
                {i.product_name} ×{i.quantity_to_ship}
              </p>
            ))}
        </div>
      </Card>
    </div>
  );
}
