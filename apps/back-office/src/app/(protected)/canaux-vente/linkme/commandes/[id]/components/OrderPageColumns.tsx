'use client';

/**
 * OrderPageColumns — layout 2 colonnes de la page detail commande LinkMe
 */

import type { OrderHistoryEvent } from '@verone/orders';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { MissingFieldsResult } from '../../../utils/order-missing-fields';

import { OrderLeftColumn } from './OrderLeftColumn';
import { OrderRightColumn } from './OrderRightColumn';

import type {
  OrderWithDetails,
  EnrichedOrderItem,
  FusedContactGroup,
  ContactRole,
} from './types';

export interface OrderPageColumnsProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  enrichedItems: EnrichedOrderItem[];
  fusedContacts: FusedContactGroup[];
  missingFieldsResult: MissingFieldsResult | null;
  deliveryAddressMatchesOrg: boolean;
  updateDetailsIsPending: boolean;
  approveIsPending: boolean;
  historyEvents: OrderHistoryEvent[];
  historyLoading: boolean;
  onApprove: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
  onChangeContact: (role: ContactRole) => void;
  onEditDeliveryAddress: () => void;
  onEditDeliveryOptions: () => void;
  onChangeDeliveryContact: () => void;
  onUseOrgAddress: () => void;
}

export function OrderPageColumns({
  order,
  details,
  enrichedItems,
  fusedContacts,
  missingFieldsResult,
  deliveryAddressMatchesOrg,
  updateDetailsIsPending,
  approveIsPending,
  historyEvents,
  historyLoading,
  onApprove,
  onRequestInfo,
  onReject,
  onChangeContact,
  onEditDeliveryAddress,
  onEditDeliveryOptions,
  onChangeDeliveryContact,
  onUseOrgAddress,
}: OrderPageColumnsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <OrderLeftColumn
        order={order}
        details={details}
        enrichedItems={enrichedItems}
        deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
        updateDetailsIsPending={updateDetailsIsPending}
        onEditDeliveryAddress={onEditDeliveryAddress}
        onEditDeliveryOptions={onEditDeliveryOptions}
        onChangeDeliveryContact={onChangeDeliveryContact}
        onUseOrgAddress={onUseOrgAddress}
      />

      <OrderRightColumn
        order={order}
        details={details}
        fusedContacts={fusedContacts}
        missingFieldsResult={missingFieldsResult}
        approveIsPending={approveIsPending}
        historyEvents={historyEvents}
        historyLoading={historyLoading}
        onApprove={onApprove}
        onRequestInfo={onRequestInfo}
        onReject={onReject}
        onChangeContact={onChangeContact}
      />
    </div>
  );
}
