'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@verone/ui';
import { Truck } from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';
import {
  DeliveryContact,
  DeliveryAddress,
  DeliveryOptions,
  PostApprovalSection,
  renderStepBadge,
} from './DeliverySectionParts';

interface DeliverySectionProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  deliveryAddressMatchesOrg: boolean;
  updateDetailsIsPending: boolean;
  onEditDeliveryAddress: () => void;
  onEditDeliveryOptions: () => void;
  onChangeDeliveryContact: () => void;
  onUseOrgAddress: () => void;
}

export function DeliverySection({
  order,
  details,
  deliveryAddressMatchesOrg,
  updateDetailsIsPending,
  onEditDeliveryAddress,
  onEditDeliveryOptions,
  onChangeDeliveryContact,
  onUseOrgAddress,
}: DeliverySectionProps) {
  const isStep4Complete = !!details?.step4_completed_at;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cyan-600" />
          <CardTitle className="text-base">Livraison</CardTitle>
          {order.status === 'validated' && renderStepBadge(isStep4Complete)}
        </div>
      </CardHeader>
      <CardContent>
        {details ? (
          <div className="space-y-6">
            <DeliveryContact
              order={order}
              details={details}
              onChangeDeliveryContact={onChangeDeliveryContact}
            />
            <Separator />
            <DeliveryAddress
              order={order}
              details={details}
              deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
              updateDetailsIsPending={updateDetailsIsPending}
              onEditDeliveryAddress={onEditDeliveryAddress}
              onUseOrgAddress={onUseOrgAddress}
            />
            <Separator />
            <DeliveryOptions
              details={details}
              onEditDeliveryOptions={onEditDeliveryOptions}
            />
            {order.status === 'validated' && (
              <>
                <Separator />
                <PostApprovalSection details={details} />
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Donnees non disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}
