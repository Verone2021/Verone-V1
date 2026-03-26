'use client';

/**
 * Page: Detail Commande Enseigne LinkMe
 *
 * Affiche tous les details d'une commande Enseigne B2B.
 * Actions: Approuver / Demander complements / Refuser
 */

import { useParams, useRouter } from 'next/navigation';

import { Badge, Button, Skeleton } from '@verone/ui';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { getOrderMissingFields } from '../../utils/order-missing-fields';

import type {
  OrderWithDetails,
  ContactRef,
  ContactRole,
  FusedContactGroup,
} from './components/types';
import { getOrderChannel } from './components/types';

import { useOrderPageData } from './hooks/use-order-page-data';
import { OrderPageColumns } from './components/OrderPageColumns';
import { OrderPageDialogs } from './components/OrderPageDialogs';
import { buildColumnsProps, buildDialogsProps } from './utils/build-page-props';

// ============================================
// HELPERS (outside component = 0 function lines)
// ============================================

function getStatusBadge(status: string) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending_approval: 'outline',
    draft: 'secondary',
    validated: 'default',
    cancelled: 'destructive',
  };
  const labels: Record<string, string> = {
    pending_approval: "En attente d'approbation",
    draft: 'Brouillon',
    validated: 'Validee',
    cancelled: 'Annulee',
    shipped: 'Expediee',
    delivered: 'Livree',
  };
  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

function buildFusedContacts(order: OrderWithDetails): FusedContactGroup[] {
  const result: FusedContactGroup[] = [];
  const seen = new Set<string>();
  const add = (contact: ContactRef | null, role: ContactRole) => {
    if (!contact) return;
    if (seen.has(contact.id)) {
      const g = result.find(x => x.contact.id === contact.id);
      if (g && !g.roles.includes(role)) g.roles.push(role);
    } else {
      seen.add(contact.id);
      result.push({ contact, roles: [role] });
    }
  };
  add(order.responsable_contact, 'responsable');
  add(order.billing_contact, 'billing');
  add(order.delivery_contact, 'delivery');
  return result;
}

function computeDeliveryMatch(order: OrderWithDetails): boolean {
  const org = order.organisation;
  const orgAddress = org?.has_different_shipping_address
    ? org.shipping_address_line1
    : org?.address_line1;
  const orgCity = org?.has_different_shipping_address
    ? org.shipping_city
    : org?.city;
  const d = order.linkmeDetails;
  const dNorm = (d?.delivery_address ?? '').toLowerCase().trim();
  const oNorm = (orgAddress ?? '').toLowerCase().trim();
  const cityMatch =
    (d?.delivery_city ?? '').toLowerCase().trim() ===
    (orgCity ?? '').toLowerCase().trim();
  return (
    dNorm.length > 0 && oNorm.length > 0 && dNorm.includes(oNorm) && cityMatch
  );
}

function getRequesterLabel(order: OrderWithDetails): string | null {
  if (order.linkmeDetails?.requester_name)
    return order.linkmeDetails.requester_name;
  if (order.createdByProfile) {
    const n = [
      order.createdByProfile.first_name,
      order.createdByProfile.last_name,
    ]
      .filter(Boolean)
      .join(' ');
    return n.length > 0 ? n : 'Inconnu';
  }
  return null;
}

// ============================================
// SUB-COMPONENTS
// ============================================

function OrderPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function OrderPageError({ message }: { message: string }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>{message}</span>
      </div>
    </div>
  );
}

interface OrderPageHeaderProps {
  order: OrderWithDetails;
  onBack: () => void;
}

function OrderPageHeader({ order, onBack }: OrderPageHeaderProps) {
  const channel = getOrderChannel(
    order.created_by_affiliate_id,
    order.linkme_selection_id
  );
  const requesterLabel = getRequesterLabel(order);
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">
            {order.order_number}
          </h1>
          {order.linkme_display_number && (
            <span className="text-sm font-normal text-gray-500">
              ({order.linkme_display_number})
            </span>
          )}
          {getStatusBadge(order.status)}
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${channel.bg} ${channel.color}`}
          >
            {channel.label}
          </span>
          <span className="text-gray-400 text-xs">
            {new Date(order.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {requesterLabel && (
            <span className="text-xs text-blue-600">par {requesterLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function LinkMeOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const data = useOrderPageData(orderId);

  if (data.isLoading) return <OrderPageSkeleton />;
  if (data.error ?? !data.order)
    return <OrderPageError message={data.error ?? 'Commande non trouvee'} />;

  const order = data.order;
  const details = order.linkmeDetails;
  const fusedContacts = buildFusedContacts(order);
  const deliveryAddressMatchesOrg = computeDeliveryMatch(order);
  const missingFieldsResult = details
    ? getOrderMissingFields({
        details,
        organisationSiret: order.organisation?.siret,
        organisationCountry: order.organisation?.country,
        organisationVatNumber: order.organisation?.vat_number,
        ownerType: details.owner_type,
        organisationAddress: order.organisation?.address_line1,
        organisationBillingAddress: order.organisation?.billing_address_line1,
      })
    : null;

  const onBack = () => {
    if (window.history.length > 1) router.back();
    else void router.push('/canaux-vente/linkme/commandes');
  };

  const columnsProps = buildColumnsProps({
    order,
    enrichedItems: data.enrichedItems,
    fusedContacts,
    missingFieldsResult,
    deliveryAddressMatchesOrg,
    data,
  });

  return (
    <div className="space-y-4 p-4">
      <OrderPageHeader order={order} onBack={onBack} />
      <OrderPageColumns {...columnsProps} />
      <OrderPageDialogs {...buildDialogsProps({ order, data })} />
    </div>
  );
}
