import type { OrganisationContact } from '../../../../../lib/hooks/use-organisation-contacts';
import type { Address } from '../../../../../lib/hooks/use-entity-addresses';
import type { EditableItem, ContactFormData } from './types';
import type { OrderItemData } from './page';

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// ============================================================================
// MAPPING HELPERS
// ============================================================================

export function mapOrderItemToEditable(item: OrderItemData): EditableItem {
  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product?.name ?? 'Produit inconnu',
    product_sku: item.product?.sku ?? null,
    product_image_url: null,
    quantity: item.quantity,
    originalQuantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    original_unit_price_ht: item.unit_price_ht,
    base_price_ht: item.base_price_ht_locked ?? 0,
    margin_rate: item.retrocession_rate ?? 0,
    tax_rate: item.tax_rate ?? 0.2,
    _delete: false,
    _isNew: false,
    is_affiliate_product: !!item.product?.created_by_affiliate,
    affiliate_commission_rate: item.product?.affiliate_commission_rate
      ? item.product.affiliate_commission_rate / 100
      : 0.15,
  };
}

// ============================================================================
// CONTACT FORM HELPERS
// ============================================================================

export const emptyContactForm: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
};

/** Match a contact by name/email against stored details */
export function findContactMatch(
  contacts: OrganisationContact[],
  name: string | null | undefined,
  email: string | null | undefined
): string | null {
  if (!name && !email) return null;
  for (const c of contacts) {
    const fullName = `${c.firstName} ${c.lastName}`.trim();
    if (email?.toLowerCase() === c.email.toLowerCase()) return c.id;
    if (name?.toLowerCase() === fullName.toLowerCase()) return c.id;
  }
  return null;
}

/** Match an address by line1/postalCode/city */
export function findAddressMatch(
  addresses: Address[],
  line1: string | null | undefined,
  postalCode: string | null | undefined,
  city: string | null | undefined
): string | null {
  if (!line1) return null;
  for (const a of addresses) {
    if (
      a.addressLine1.toLowerCase() === line1.toLowerCase() &&
      a.postalCode === postalCode &&
      a.city.toLowerCase() === (city ?? '').toLowerCase()
    ) {
      return a.id;
    }
  }
  return null;
}
