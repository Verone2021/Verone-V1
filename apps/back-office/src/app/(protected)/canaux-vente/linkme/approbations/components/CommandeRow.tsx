'use client';

import { Fragment } from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  Store,
  Trash2,
  XCircle,
} from 'lucide-react';

import { Button } from '@verone/ui';

import {
  getOrderMissingFields,
  type MissingFieldsResult,
} from '../../utils/order-missing-fields';
import type {
  PendingOrder,
  OrderValidationStatus,
} from '../../hooks/use-linkme-order-actions';
import { CommandeExpandedRow } from './CommandeExpandedRow';

// ============================================================================
// HELPERS
// ============================================================================

function formatRelativeDate(dateStr: string): {
  text: string;
  isUrgent: boolean;
} {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return { text: `il y a ${diffDays}j`, isUrgent: diffDays >= 2 };
  }
  if (diffHours > 0) {
    return { text: `il y a ${diffHours}h`, isUrgent: false };
  }
  return { text: "il y a moins d'1h", isUrgent: false };
}

function computeMissingFields(order: PendingOrder): MissingFieldsResult | null {
  const details = order.linkme_details;
  if (!details) return null;
  return getOrderMissingFields({
    details: details as unknown as Parameters<
      typeof getOrderMissingFields
    >[0]['details'],
    organisationSiret: order.organisation_siret ?? undefined,
    organisationCountry: order.organisation_country ?? undefined,
    organisationVatNumber: order.organisation_vat_number ?? undefined,
    organisationLegalName: order.organisation_legal_name ?? undefined,
    organisationBillingAddress: order.organisation_billing_address ?? undefined,
    organisationBillingPostalCode:
      order.organisation_billing_postal_code ?? undefined,
    organisationBillingCity: order.organisation_billing_city ?? undefined,
    ownerType: details.owner_type,
    ignoredFields: (details.ignored_missing_fields as string[]) ?? [],
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OrderCellInfo({ order }: { order: PendingOrder }) {
  const rel = formatRelativeDate(order.created_at);
  return (
    <div>
      <p className="font-medium text-gray-900">
        {order.order_number}
        {order.linkme_display_number && (
          <span className="ml-1 text-xs font-normal text-gray-500">
            ({order.linkme_display_number})
          </span>
        )}
      </p>
      <p className="text-sm text-gray-500">
        {new Date(order.created_at).toLocaleDateString('fr-FR')}
      </p>
      <p
        className={`text-xs ${rel.isUrgent ? 'text-amber-600 font-medium' : 'text-gray-400'}`}
      >
        {rel.text}
      </p>
    </div>
  );
}

function OrganisationCell({ order }: { order: PendingOrder }) {
  const details = order.linkme_details;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-gray-900">{order.organisation_name ?? '-'}</p>
      <p className="text-sm text-gray-500">{order.enseigne_name ?? '-'}</p>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {details?.owner_type && (
          <span
            className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border ${
              details.owner_type === 'franchise'
                ? 'border-violet-300 text-violet-700 bg-violet-50'
                : 'border-blue-300 text-blue-700 bg-blue-50'
            }`}
          >
            <Building2 className="h-3 w-3" />
            {details.owner_type === 'franchise' ? 'Franchisé' : 'Propre'}
          </span>
        )}
        {details?.is_new_restaurant === true && (
          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50">
            <Building2 className="h-3 w-3" />
            Nouveau restaurant
          </span>
        )}
        {details?.is_new_restaurant === false && (
          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">
            <Store className="h-3 w-3" />
            Restaurant existant
          </span>
        )}
      </div>
    </div>
  );
}

function MissingFieldsCell({
  orderId,
  missingFields,
}: {
  orderId: string;
  missingFields: MissingFieldsResult | null;
}) {
  if (!missingFields) {
    return <span className="text-xs text-gray-400">-</span>;
  }
  if (!missingFields.isComplete) {
    return (
      <Link
        href={`/canaux-vente/linkme/commandes/${orderId}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <AlertTriangle className="h-3 w-3" />
        {missingFields.totalCategories} à compléter
      </Link>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle className="h-3.5 w-3.5" />
      Complet
    </span>
  );
}

interface ActionsCellProps {
  order: PendingOrder;
  validationStatus: OrderValidationStatus;
  isApprovePending: boolean;
  onApprove: (order: PendingOrder, e: React.MouseEvent) => void;
  onRejectClick: (order: PendingOrder, e: React.MouseEvent) => void;
  onDeleteClick: (order: PendingOrder) => void;
}

function ActionsCell({
  order,
  validationStatus,
  isApprovePending,
  onApprove,
  onRejectClick,
  onDeleteClick,
}: ActionsCellProps) {
  return (
    <div
      className="flex items-center justify-end gap-2"
      onClick={e => e.stopPropagation()}
    >
      <Link
        href={`/canaux-vente/linkme/commandes/${order.id}`}
        className="p-2 text-gray-500 hover:text-gray-700"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {validationStatus === 'pending' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={e => onRejectClick(order, e)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
          <Button
            size="sm"
            onClick={e => {
              void onApprove(order, e);
            }}
            disabled={isApprovePending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApprovePending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Approuver
          </Button>
        </>
      )}
      {validationStatus === 'rejected' && (
        <Button
          variant="outline"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onDeleteClick(order);
          }}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Supprimer
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function resolveValidationStatus(
  order: PendingOrder,
  selectedStatus: OrderValidationStatus | 'all'
): OrderValidationStatus {
  if (selectedStatus !== 'all') return selectedStatus;
  if (order.status === 'cancelled') return 'rejected';
  if (order.status === 'pending_approval') return 'pending';
  return 'approved';
}

interface CommandeRowProps {
  order: PendingOrder;
  isExpanded: boolean;
  selectedStatus: OrderValidationStatus | 'all';
  isApprovePending: boolean;
  onToggle: (orderId: string) => void;
  onApprove: (order: PendingOrder, e: React.MouseEvent) => void;
  onRejectClick: (order: PendingOrder, e: React.MouseEvent) => void;
  onDeleteClick: (order: PendingOrder) => void;
}

export function CommandeRow({
  order,
  isExpanded,
  selectedStatus,
  isApprovePending,
  onToggle,
  onApprove,
  onRejectClick,
  onDeleteClick,
}: CommandeRowProps) {
  const missingFields = computeMissingFields(order);
  const validationStatus = resolveValidationStatus(order, selectedStatus);

  return (
    <Fragment>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => onToggle(order.id)}
      >
        <td className="px-3 py-4">
          <button className="p-1 text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-6 py-4">
          <OrderCellInfo order={order} />
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="text-gray-900">{order.requester_name ?? '-'}</p>
            <p className="text-sm text-gray-500">
              {order.requester_email ?? '-'}
            </p>
          </div>
        </td>
        <td className="px-6 py-4">
          <OrganisationCell order={order} />
        </td>
        <td className="px-6 py-4">
          <div>
            <p className="font-semibold text-gray-900">
              {order.total_ttc.toFixed(2)} EUR
            </p>
            <p className="text-xs text-gray-500">
              {order.items.length} article{order.items.length > 1 ? 's' : ''}
            </p>
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          <MissingFieldsCell orderId={order.id} missingFields={missingFields} />
        </td>
        <td className="px-6 py-4">
          <ActionsCell
            order={order}
            validationStatus={validationStatus}
            isApprovePending={isApprovePending}
            onApprove={onApprove}
            onRejectClick={onRejectClick}
            onDeleteClick={onDeleteClick}
          />
        </td>
      </tr>
      {isExpanded && <CommandeExpandedRow order={order} />}
    </Fragment>
  );
}
