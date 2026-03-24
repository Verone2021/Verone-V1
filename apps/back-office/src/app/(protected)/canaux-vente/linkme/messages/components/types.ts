/**
 * Shared types, constants, and helpers for the Messages page
 *
 * @module messages/components/types
 */

import type {
  MissingFieldsResult,
  MissingFieldCategory,
} from '../../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../../hooks/use-linkme-order-actions';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationSeverity = 'info' | 'important' | 'urgent';
export type TargetType = 'all' | 'enseigne' | 'affiliate';
export type ClickableCategory =
  | 'responsable'
  | 'billing'
  | 'delivery_contact'
  | 'delivery_address'
  | 'organisation';

export interface Enseigne {
  id: string;
  name: string;
  affiliate_count: number;
}

export interface Affiliate {
  id: string;
  user_id: string;
  display_name: string;
  enseigne_name: string | null;
}

export interface InfoRequest {
  id: string;
  token: string;
  recipient_email: string;
  recipient_type: string;
  sent_at: string;
  completed_at: string | null;
  completed_by_email: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  submitted_data: Record<string, string> | null;
  custom_message: string | null;
  token_expires_at: string | null;
}

export interface OrderWithMissing {
  id: string;
  order_number: string;
  total_ttc: number;
  status: string;
  customer_id: string | null;
  organisationName: string | null;
  organisationSiret: string | null;
  organisationId: string | null;
  enseigneId: string | null;
  ownerType: string | null;
  details: LinkMeOrderDetails | null;
  detailsId: string | null;
  ignoredFields: string[];
  missingFields: MissingFieldsResult;
  infoRequests: InfoRequest[];
}

export interface InfoRequestHistoryItem {
  id: string;
  sales_order_id: string;
  order_number: string;
  recipient_email: string;
  recipient_type: string;
  sent_at: string;
  completed_at: string | null;
  completed_by_email: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  submitted_data: Record<string, string> | null;
  custom_message: string | null;
  token_expires_at: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CATEGORY_BADGE_COLORS: Record<MissingFieldCategory, string> = {
  responsable: 'bg-red-100 text-red-700 border-red-200',
  billing: 'bg-orange-100 text-orange-700 border-orange-200',
  delivery: 'bg-blue-100 text-blue-700 border-blue-200',
  organisation: 'bg-purple-100 text-purple-700 border-purple-200',
  custom: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const ORDER_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  pending_approval: {
    label: 'En attente approbation',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  validated: {
    label: 'Validee',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  partially_shipped: {
    label: 'Partiellement expediee',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

export const DELIVERY_CONTACT_KEYS = [
  'delivery_contact_name',
  'delivery_contact_email',
  'delivery_contact_phone',
];

export const DELIVERY_ADDRESS_KEYS = [
  'delivery_address',
  'delivery_postal_code',
  'delivery_city',
  'mall_email',
];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =============================================================================
// HELPERS
// =============================================================================

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  return `il y a ${diffDays} jours`;
}

export function getInfoRequestStatus(
  req: InfoRequest
): 'pending' | 'completed' | 'cancelled' | 'expired' {
  if (req.completed_at) return 'completed';
  if (req.cancelled_at) return 'cancelled';
  if (req.token_expires_at && new Date(req.token_expires_at) < new Date()) {
    return 'expired';
  }
  return 'pending';
}

export function hasPendingRequest(order: OrderWithMissing): boolean {
  return order.infoRequests.some(r => getInfoRequestStatus(r) === 'pending');
}

export function formatFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    requester_name: 'Nom demandeur',
    requester_email: 'Email demandeur',
    requester_phone: 'Tel. demandeur',
    owner_name: 'Nom proprietaire',
    owner_email: 'Email proprietaire',
    owner_phone: 'Tel. proprietaire',
    owner_company_legal_name: 'Raison sociale',
    billing_name: 'Contact facturation',
    billing_email: 'Email facturation',
    billing_phone: 'Tel. facturation',
    delivery_contact_name: 'Contact livraison',
    delivery_contact_email: 'Email livraison',
    delivery_contact_phone: 'Tel. livraison',
    delivery_address: 'Adresse',
    delivery_postal_code: 'Code postal',
    delivery_city: 'Ville',
    desired_delivery_date: 'Date souhaitee',
    mall_email: 'Email centre commercial',
    organisation_siret: 'SIRET',
  };
  return labels[key] ?? key.replace(/_/g, ' ');
}
