'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrderFormData } from '../../components/orders/schemas/order-form.schema';
import { emptyToNull } from './use-order-form-helpers';

type LinkmeDetailsValue = string | number | boolean | null;

/**
 * Construit l'objet linkme_details à partir des données du formulaire.
 * Résout les noms/emails/phones de facturation et livraison selon le mode choisi.
 */
export function buildLinkmeDetails(
  formData: OrderFormData,
  ownerType: string | null | undefined
): Record<string, LinkmeDetailsValue> {
  const { contacts, delivery, restaurant } = formData;

  // Résoudre contact de facturation
  let billingName = '';
  let billingEmail = '';
  let billingPhone = '';
  if (contacts.billingContact.mode === 'same_as_responsable') {
    billingName =
      `${contacts.responsable.firstName} ${contacts.responsable.lastName}`.trim();
    billingEmail = contacts.responsable.email;
    billingPhone = contacts.responsable.phone ?? '';
  } else if (contacts.billingContact.contact) {
    const bc = contacts.billingContact.contact;
    billingName = `${bc.firstName} ${bc.lastName}`.trim();
    billingEmail = bc.email;
    billingPhone = bc.phone ?? '';
  }

  // Résoudre contact de livraison
  let deliveryContactName = '';
  let deliveryContactEmail = '';
  let deliveryContactPhone = '';
  if (contacts.delivery.sameAsResponsable) {
    deliveryContactName =
      `${contacts.responsable.firstName} ${contacts.responsable.lastName}`.trim();
    deliveryContactEmail = contacts.responsable.email;
    deliveryContactPhone = contacts.responsable.phone ?? '';
  } else if (contacts.delivery.contact) {
    const dc = contacts.delivery.contact;
    deliveryContactName = `${dc.firstName} ${dc.lastName}`.trim();
    deliveryContactEmail = dc.email;
    deliveryContactPhone = dc.phone ?? '';
  }

  const requesterName =
    `${contacts.responsable.firstName} ${contacts.responsable.lastName}`.trim();

  return {
    requester_type: contacts.existingResponsableId
      ? 'existing_contact'
      : requesterName
        ? 'manual_entry'
        : null,
    requester_name: emptyToNull(requesterName),
    requester_email: emptyToNull(contacts.responsable.email),
    requester_phone: emptyToNull(contacts.responsable.phone),
    requester_position: emptyToNull(contacts.responsable.position),
    is_new_restaurant: restaurant.mode === 'new',
    owner_type: ownerType ?? null,
    billing_contact_source: contacts.billingContact.mode,
    billing_name: emptyToNull(billingName),
    billing_email: emptyToNull(billingEmail),
    billing_phone: emptyToNull(billingPhone),
    delivery_contact_name: emptyToNull(deliveryContactName),
    delivery_contact_email: emptyToNull(deliveryContactEmail),
    delivery_contact_phone: emptyToNull(deliveryContactPhone),
    delivery_address: emptyToNull(delivery.address),
    delivery_postal_code: emptyToNull(delivery.postalCode),
    delivery_city: emptyToNull(delivery.city),
    desired_delivery_date: delivery.deliveryAsap
      ? null
      : (delivery.desiredDate ?? null),
    delivery_asap: delivery.deliveryAsap,
    is_mall_delivery: delivery.isMallDelivery,
    mall_email: delivery.mallEmail ?? null,
    semi_trailer_accessible: delivery.semiTrailerAccessible,
    access_form_url: delivery.accessFormUrl ?? null,
    delivery_notes: delivery.notes ?? null,
    delivery_terms_accepted: delivery.deliveryTermsAccepted,
    franchise_legal_name:
      restaurant.newRestaurant?.legalName ??
      contacts.franchiseInfo?.companyLegalName ??
      null,
    franchise_siret:
      restaurant.newRestaurant?.siret ?? contacts.franchiseInfo?.siret ?? null,
    franchise_trade_name: restaurant.newRestaurant?.tradeName ?? null,
    kbis_url: null, // Set after upload
  };
}

/**
 * Upload le fichier Kbis et retourne son URL publique, ou null si absent/erreur.
 */
export async function uploadKbisFile(
  supabase: SupabaseClient,
  formData: OrderFormData
): Promise<string | null> {
  const kbisFile = formData.restaurant.newRestaurant?.kbisFile as File | null;
  if (!kbisFile) return null;

  const fileExt = kbisFile.name.split('.').pop() ?? 'pdf';
  const fileName = `kbis/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('linkme-delivery-forms')
    .upload(fileName, kbisFile, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('[useOrderForm] Kbis upload error:', uploadError);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('linkme-delivery-forms').getPublicUrl(fileName);

  return publicUrl;
}
