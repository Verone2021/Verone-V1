'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrderFormData } from '../../components/orders/schemas/order-form.schema';
import { toNullIfEmpty } from './use-order-form-helpers';

export interface AffiliateData {
  id: string;
  enseigne_id: string | null;
}

interface ContactFk {
  organisation_id: string | null;
  enseigne_id: string | null;
  owner_type: 'enseigne' | 'organisation';
}

export interface ContactIds {
  responsableContactId: string | null;
  billingContactId: string | null;
  deliveryContactId: string | null;
}

/**
 * Étape 2.6 du submit : créer les contacts en BD si nécessaire.
 * Règle métier selon ownership_type :
 *   Succursale : responsable/facturation → enseigne, livraison → organisation
 *   Franchise  : tous → organisation
 */
export async function createOrderContacts(
  supabase: SupabaseClient,
  formData: OrderFormData,
  customerId: string,
  affiliate: AffiliateData,
  ownerType: string | null | undefined
): Promise<ContactIds> {
  const isSuccursale = ownerType === 'succursale';

  const responsableBillingFk: ContactFk = isSuccursale
    ? {
        organisation_id: null,
        enseigne_id: affiliate.enseigne_id,
        owner_type: 'enseigne',
      }
    : {
        organisation_id: customerId,
        enseigne_id: null,
        owner_type: 'organisation',
      };

  const deliveryFk: ContactFk = {
    organisation_id: customerId,
    enseigne_id: null,
    owner_type: 'organisation',
  };

  // Responsable
  let responsableContactId = formData.contacts.existingResponsableId ?? null;

  if (!responsableContactId && formData.contacts.responsable.firstName) {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ...responsableBillingFk,
        first_name: formData.contacts.responsable.firstName,
        last_name: formData.contacts.responsable.lastName,
        email: formData.contacts.responsable.email,
        phone: toNullIfEmpty(formData.contacts.responsable.phone),
        title: toNullIfEmpty(formData.contacts.responsable.position),
        is_primary_contact: false,

        is_active: true,
      })
      .select('id')
      .single();

    if (contactError) {
      console.error('Erreur création contact responsable:', contactError);
      throw new Error('Erreur lors de la création du contact responsable');
    }
    responsableContactId = newContact.id as string;
  }

  // Billing contact
  let billingContactId: string | null = null;
  if (formData.contacts.billingContact.mode === 'same_as_responsable') {
    billingContactId = responsableContactId;
  } else if (formData.contacts.billingContact.mode === 'existing') {
    billingContactId =
      formData.contacts.billingContact.existingContactId ?? null;
  } else if (
    formData.contacts.billingContact.mode === 'new' &&
    formData.contacts.billingContact.contact
  ) {
    const bc = formData.contacts.billingContact.contact;
    const { data: newBilling, error: billingError } = await supabase
      .from('contacts')
      .insert({
        ...responsableBillingFk,
        first_name: bc.firstName,
        last_name: bc.lastName,
        email: bc.email,
        phone: toNullIfEmpty(bc.phone),
        title: toNullIfEmpty(bc.position),
        is_billing_contact: true,

        is_active: true,
      })
      .select('id')
      .single();

    if (billingError) {
      console.error('Erreur création contact facturation:', billingError);
      throw new Error('Erreur lors de la création du contact facturation');
    }
    billingContactId = newBilling.id as string;
  }

  // Delivery contact
  let deliveryContactId: string | null = null;
  if (formData.contacts.delivery.sameAsResponsable) {
    deliveryContactId = responsableContactId;
  } else if (formData.contacts.delivery.existingContactId) {
    deliveryContactId = formData.contacts.delivery.existingContactId;
  } else if (formData.contacts.delivery.contact) {
    const dc = formData.contacts.delivery.contact;
    const { data: newDelivery, error: deliveryError } = await supabase
      .from('contacts')
      .insert({
        ...deliveryFk,
        first_name: dc.firstName,
        last_name: dc.lastName,
        email: dc.email,
        phone: toNullIfEmpty(dc.phone),
        title: toNullIfEmpty(dc.position),
        is_delivery_only: true,

        is_active: true,
      })
      .select('id')
      .single();

    if (deliveryError) {
      console.error('Erreur création contact livraison:', deliveryError);
      throw new Error('Erreur lors de la création du contact livraison');
    }
    deliveryContactId = newDelivery.id as string;
  }

  return { responsableContactId, billingContactId, deliveryContactId };
}
