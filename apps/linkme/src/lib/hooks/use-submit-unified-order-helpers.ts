'use client';

/**
 * Helpers de construction des payloads RPC pour useSubmitUnifiedOrder
 *
 * @module use-submit-unified-order-helpers
 * @since 2026-04-14
 */

import type {
  CartItem,
  OrderFormUnifiedData,
} from '@/components/OrderFormUnified';

// ============================================================================
// TYPES PAYLOAD
// ============================================================================

export interface LinkMeDetails {
  requester_type: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  is_new_restaurant: boolean;
  owner_type: null;
  billing_contact_source: string;
  billing_name: string;
  billing_email: string;
  billing_phone: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  desired_delivery_date: string | null;
  delivery_asap: boolean;
  is_mall_delivery: boolean;
  mall_email: string | null;
  semi_trailer_accessible: boolean;
  access_form_url: string | null;
  delivery_notes: string | null;
  delivery_terms_accepted: boolean;
}

// ============================================================================
// HELPER: Build linkme_details for existing restaurant
// ============================================================================

export function buildLinkMeDetailsExisting(
  data: OrderFormUnifiedData
): LinkMeDetails {
  return {
    requester_type: 'responsable_enseigne',
    requester_name: data.requester.name,
    requester_email: data.requester.email,
    requester_phone: data.requester.phone || null,
    requester_position: data.requester.position || null,
    is_new_restaurant: false,
    owner_type: null,
    billing_contact_source: data.billing.useParentOrganisation
      ? 'parent_organisation'
      : data.billing.contactSource || 'responsable',
    billing_name:
      data.billing.contactSource === 'custom'
        ? data.billing.name
        : data.responsable.name,
    billing_email:
      data.billing.contactSource === 'custom'
        ? data.billing.email
        : data.responsable.email,
    billing_phone:
      data.billing.contactSource === 'custom'
        ? data.billing.phone || null
        : data.responsable.phone || null,
    delivery_contact_name: data.delivery.useResponsableContact
      ? null
      : data.delivery.contactName || null,
    delivery_contact_email: data.delivery.useResponsableContact
      ? null
      : data.delivery.contactEmail || null,
    delivery_contact_phone: data.delivery.useResponsableContact
      ? null
      : data.delivery.contactPhone || null,
    delivery_address: data.delivery.address || null,
    delivery_postal_code: data.delivery.postalCode || null,
    delivery_city: data.delivery.city || null,
    delivery_latitude: data.delivery.latitude ?? null,
    delivery_longitude: data.delivery.longitude ?? null,
    desired_delivery_date: data.delivery.deliveryAsap
      ? null
      : data.delivery.deliveryDate || null,
    delivery_asap: data.delivery.deliveryAsap || false,
    is_mall_delivery: data.delivery.isMallDelivery || false,
    mall_email: data.delivery.isMallDelivery
      ? data.delivery.mallEmail || null
      : null,
    semi_trailer_accessible: data.delivery.semiTrailerAccessible !== false,
    access_form_url: data.delivery.accessFormUrl ?? null,
    delivery_notes: data.delivery.notes || null,
    delivery_terms_accepted: data.deliveryTermsAccepted || false,
  };
}

// ============================================================================
// HELPER: Build RPC params for new restaurant
// ============================================================================

export function buildNewRestaurantRpcParams(
  data: OrderFormUnifiedData,
  affiliateId: string,
  selectionId: string,
  cart: CartItem[],
  kbisUrl: string | null
) {
  const p_cart = cart.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    selling_price_ttc: item.selling_price_ttc,
    id: item.id,
  }));

  const p_requester = {
    type: 'responsable_enseigne',
    name: data.requester.name,
    email: data.requester.email,
    phone: data.requester.phone ?? null,
    position: data.requester.position ?? null,
    notes: data.requester.notes ?? null,
  };

  const p_organisation = {
    is_new: true,
    trade_name: data.newRestaurant.tradeName,
    legal_name:
      data.newRestaurant.ownershipType === 'franchise'
        ? data.responsable.companyLegalName
        : data.newRestaurant.tradeName,
    city: data.newRestaurant.city,
    postal_code: data.newRestaurant.postalCode ?? null,
    address: data.newRestaurant.address ?? null,
    latitude: data.newRestaurant.latitude ?? null,
    longitude: data.newRestaurant.longitude ?? null,
    ownership_type: data.newRestaurant.ownershipType,
    kbis_url: kbisUrl,
  };

  const p_responsable = data.isNewRestaurant
    ? {
        is_new: true,
        name: data.responsable.name,
        email: data.responsable.email,
        phone: data.responsable.phone ?? null,
        type: data.newRestaurant.ownershipType ?? null,
        company_legal_name:
          data.newRestaurant.ownershipType === 'franchise'
            ? (data.responsable.companyLegalName ?? null)
            : null,
        siret:
          data.newRestaurant.ownershipType === 'franchise'
            ? (data.responsable.siret ?? null)
            : null,
      }
    : data.existingContact.isNewContact
      ? {
          is_new: true,
          name: data.responsable.name,
          email: data.responsable.email,
          phone: data.responsable.phone ?? null,
          company_legal_name: null,
          siret: null,
        }
      : {
          is_new: false,
          contact_id: data.existingContact.selectedContactId,
        };

  const isFranchiseOrder = data.newRestaurant?.ownershipType === 'franchise';
  const useParent = data.billing.useParentOrganisation && !isFranchiseOrder;

  const p_billing = useParent
    ? {
        use_parent: true,
        contact_source: null,
        name: null,
        email: null,
        phone: null,
        address: null,
        postal_code: null,
        city: null,
        latitude: null,
        longitude: null,
        company_legal_name: null,
        siret: null,
      }
    : {
        use_parent: false,
        contact_source:
          data.billing.contactSource === 'custom'
            ? ('custom' as const)
            : ('responsable' as const),
        name:
          data.billing.contactSource === 'custom'
            ? data.billing.name
            : data.responsable.name,
        email:
          data.billing.contactSource === 'custom'
            ? data.billing.email
            : data.responsable.email,
        phone:
          data.billing.contactSource === 'custom'
            ? (data.billing.phone ?? null)
            : (data.responsable.phone ?? null),
        address: data.billing.address ?? null,
        postal_code: data.billing.postalCode ?? null,
        city: data.billing.city ?? null,
        latitude: data.billing.latitude ?? null,
        longitude: data.billing.longitude ?? null,
        company_legal_name: data.billing.companyLegalName ?? null,
        siret: data.billing.siret ?? null,
      };

  const p_delivery = {
    use_responsable_contact: data.delivery.useResponsableContact,
    contact_name: data.delivery.useResponsableContact
      ? null
      : (data.delivery.contactName ?? null),
    contact_email: data.delivery.useResponsableContact
      ? null
      : (data.delivery.contactEmail ?? null),
    contact_phone: data.delivery.useResponsableContact
      ? null
      : (data.delivery.contactPhone ?? null),
    address: data.delivery.address ?? null,
    postal_code: data.delivery.postalCode ?? null,
    city: data.delivery.city ?? null,
    latitude: data.delivery.latitude ?? null,
    longitude: data.delivery.longitude ?? null,
    delivery_date: data.delivery.deliveryDate ?? null,
    is_mall_delivery: data.delivery.isMallDelivery ?? false,
    mall_email: data.delivery.isMallDelivery
      ? (data.delivery.mallEmail ?? null)
      : null,
    access_form_required: data.delivery.accessFormRequired ?? false,
    access_form_url: data.delivery.accessFormUrl ?? null,
    semi_trailer_accessible: data.delivery.semiTrailerAccessible !== false,
    notes: data.delivery.notes ?? null,
  };

  return {
    p_affiliate_id: affiliateId,
    p_selection_id: selectionId,
    p_cart,
    p_requester,
    p_organisation,
    p_owner: p_responsable,
    p_billing,
    p_delivery,
  };
}
