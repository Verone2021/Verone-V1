'use client';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

import { RestaurantSection } from './RestaurantSection';
import { ProductsSection } from './ProductsSection';
import { TotalsSection } from './TotalsSection';
import { DeliverySection } from './DeliverySection';

import type { OrderWithDetails, EnrichedOrderItem } from './types';

interface OrderLeftColumnProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  enrichedItems: EnrichedOrderItem[];
  deliveryAddressMatchesOrg: boolean;
  updateDetailsIsPending: boolean;
  onEditDeliveryAddress: () => void;
  onEditDeliveryOptions: () => void;
  onChangeDeliveryContact: () => void;
  onUseOrgAddress: () => void;
}

export function OrderLeftColumn({
  order,
  details,
  enrichedItems,
  deliveryAddressMatchesOrg,
  updateDetailsIsPending,
  onEditDeliveryAddress,
  onEditDeliveryOptions,
  onChangeDeliveryContact,
  onUseOrgAddress,
}: OrderLeftColumnProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <RestaurantSection
        organisation={order.organisation}
        details={details}
        orderId={order.id}
      />

      <ProductsSection items={order.items} enrichedItems={enrichedItems} />

      <TotalsSection
        totalHt={order.total_ht}
        totalTtc={order.total_ttc}
        notes={order.notes}
      />

      <DeliverySection
        order={order}
        details={details}
        deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
        updateDetailsIsPending={updateDetailsIsPending}
        onEditDeliveryAddress={onEditDeliveryAddress}
        onEditDeliveryOptions={onEditDeliveryOptions}
        onChangeDeliveryContact={onChangeDeliveryContact}
        onUseOrgAddress={onUseOrgAddress}
      />
    </div>
  );
}
