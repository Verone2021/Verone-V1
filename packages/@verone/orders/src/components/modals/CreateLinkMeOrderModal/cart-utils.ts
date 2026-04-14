import type { SelectionItem } from '../../../hooks/linkme/use-linkme-selections';
import type { ContactsAddressesData } from '../../linkme-contacts';
import { type CartItem, roundMoney } from './types';

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

/**
 * Ajoute un produit depuis une sélection au panier, ou incrémente si déjà présent
 */
export function addProductToCart(
  cart: CartItem[],
  item: SelectionItem
): CartItem[] {
  const existing = cart.find(c => c.product_id === item.product_id);
  if (existing) {
    return cart.map(c =>
      c.product_id === item.product_id ? { ...c, quantity: c.quantity + 1 } : c
    );
  }

  const marginRate = item.margin_rate / 100;
  const sellingPrice = roundMoney(
    item.selling_price_ht ?? item.base_price_ht * (1 + item.margin_rate / 100)
  );

  const newItem: CartItem = {
    id: `${item.product_id}-${Date.now()}`,
    product_id: item.product_id,
    product_name: item.product?.name ?? 'Produit inconnu',
    sku: item.product?.sku ?? '',
    quantity: 1,
    unit_price_ht: sellingPrice,
    tax_rate: 0.2,
    base_price_ht: item.base_price_ht,
    retrocession_rate: marginRate,
    linkme_selection_item_id: item.id,
  };
  return [...cart, newItem];
}

export function updateCartQuantity(
  cart: CartItem[],
  itemId: string,
  delta: number
): CartItem[] {
  return cart
    .map(item => {
      if (item.id !== itemId) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return newQty === 0 ? null : { ...item, quantity: newQty };
    })
    .filter(Boolean) as CartItem[];
}

export function updateCartUnitPrice(
  cart: CartItem[],
  itemId: string,
  newPrice: number
): CartItem[] {
  if (newPrice < 0 || isNaN(newPrice)) return cart;
  return cart.map(item =>
    item.id === itemId
      ? { ...item, unit_price_ht: Math.round(newPrice * 100) / 100 }
      : item
  );
}

export function updateCartRetrocessionRate(
  cart: CartItem[],
  itemId: string,
  newRatePercent: number
): CartItem[] {
  if (newRatePercent < 0 || newRatePercent > 100 || isNaN(newRatePercent))
    return cart;
  return cart.map(item =>
    item.id === itemId
      ? { ...item, retrocession_rate: newRatePercent / 100 }
      : item
  );
}
