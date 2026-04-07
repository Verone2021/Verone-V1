'use client';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';
import { FeesSection } from '@/components/orders/FeesSection';

import type {
  EnrichedOrderItem,
  FusedContactGroup,
  OrderWithDetails,
} from './types';
import { CommissionVersementCard } from './left-column/CommissionVersementCard';
import { DeliveryCard } from './left-column/DeliveryCard';
import { InfoRequestsCard } from './left-column/InfoRequestsCard';
import { OrderItemsTable } from './left-column/OrderItemsTable';
import { OrderTotalsCard } from './left-column/OrderTotalsCard';
import { OrganisationCard } from './left-column/OrganisationCard';

// ============================================
// PROPS
// ============================================

export interface LeftColumnProps {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
  locked: boolean;
  details: LinkMeOrderDetails | null;
  fusedContacts: FusedContactGroup[];
  // Items editing
  editedQuantities: Record<string, number>;
  setEditedQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  hasItemChanges: boolean;
  isSavingItems: boolean;
  onSaveItems: () => void;
  // Edit dialogs
  onOpenEditDialog: (
    step: 'responsable' | 'billing' | 'delivery_address' | 'delivery_options'
  ) => void;
  // Contact dialog
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
  // Delivery address
  deliveryAddressMatchesOrg: boolean;
  onUseOrgAddress: () => void;
  updateDetailsPending: boolean;
  // Step badge
  isStep4Complete: boolean;
  // Organisation inline edit
  onUpdateOrganisation?: (
    orgId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
}

// ============================================
// COMPONENT
// ============================================

export function LeftColumn({
  order,
  enrichedItems,
  locked,
  details,
  fusedContacts,
  editedQuantities,
  setEditedQuantities,
  hasItemChanges,
  isSavingItems,
  onSaveItems,
  onOpenEditDialog,
  onOpenContactDialog,
  deliveryAddressMatchesOrg,
  onUseOrgAddress,
  updateDetailsPending,
  isStep4Complete,
  onUpdateOrganisation,
}: LeftColumnProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <OrganisationCard
        order={order}
        details={details}
        onUpdateOrganisation={onUpdateOrganisation}
      />

      <OrderItemsTable
        order={order}
        enrichedItems={enrichedItems}
        editedQuantities={editedQuantities}
        setEditedQuantities={setEditedQuantities}
        hasItemChanges={hasItemChanges}
        isSavingItems={isSavingItems}
        onSaveItems={onSaveItems}
      />

      <FeesSection
        orderId={order.id}
        shippingCostHt={order.shipping_cost_ht ?? 0}
        handlingCostHt={order.handling_cost_ht ?? 0}
        insuranceCostHt={order.insurance_cost_ht ?? 0}
        feesVatRate={order.fees_vat_rate ?? 0.2}
        readOnly={locked}
      />

      <OrderTotalsCard totalHt={order.total_ht} totalTtc={order.total_ttc} />

      <CommissionVersementCard enrichedItems={enrichedItems} />

      <DeliveryCard
        order={order}
        details={details}
        locked={locked}
        fusedContacts={fusedContacts}
        deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
        onUseOrgAddress={onUseOrgAddress}
        updateDetailsPending={updateDetailsPending}
        isStep4Complete={isStep4Complete}
        onOpenEditDialog={onOpenEditDialog}
        onOpenContactDialog={onOpenContactDialog}
      />

      <InfoRequestsCard infoRequests={order.infoRequests} />
    </div>
  );
}
