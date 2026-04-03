import type { ContactsAddressesData } from '../components/contacts';

/**
 * Transforme les données contacts/adresses du formulaire en format DB linkme_details
 */
export function buildLinkMeDetails(data: ContactsAddressesData) {
  const deliveryContact = data.deliverySameAsBillingContact
    ? data.billingContact
    : data.deliveryContact;
  const deliveryAddr = data.deliverySameAsBillingAddress
    ? data.billingAddress
    : data.deliveryAddress;

  const hasAnyData =
    deliveryContact ??
    deliveryAddr ??
    data.billingContact ??
    data.billingAddress;

  if (!hasAnyData) return null;

  return {
    requester_phone: data.billingContact?.phone ?? null,
    delivery_contact_name: deliveryContact
      ? `${deliveryContact.firstName} ${deliveryContact.lastName}`.trim()
      : null,
    delivery_contact_email: deliveryContact?.email ?? null,
    delivery_contact_phone: deliveryContact?.phone ?? null,
    delivery_address: deliveryAddr?.customAddress?.addressLine1 ?? null,
    delivery_postal_code: deliveryAddr?.customAddress?.postalCode ?? null,
    delivery_city: deliveryAddr?.customAddress?.city ?? null,
    billing_name: data.billingContact
      ? `${data.billingContact.firstName} ${data.billingContact.lastName}`.trim()
      : null,
    billing_email: data.billingContact?.email ?? null,
    billing_phone: data.billingContact?.phone ?? null,
  };
}
