import type {
  LinkMeOrderItemInput,
  CreateLinkMeOrderInput,
  LinkMeDetailsInput,
} from './use-linkme-orders';
import type { SelectionItem } from './use-linkme-selections';
import type { ContactsAddressesData } from '../components/contacts';
import { buildLinkMeDetails } from '../utils/build-linkme-details';

export type CustomerType = 'organization' | 'individual';

export type AffiliateSelection = {
  id: string;
  name: string;
  slug: string;
  products_count: number | null;
  archived_at: string | null;
};

export interface CartItem extends LinkMeOrderItemInput {
  id: string;
  tax_rate: number;
  is_affiliate_product: boolean;
  affiliate_commission_rate: number;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildCartItemFromSelection(item: SelectionItem): CartItem {
  const isAffiliateProduct = !!item.product?.created_by_affiliate;

  if (isAffiliateProduct) {
    const affiliateCommRate =
      (item.product?.affiliate_commission_rate ?? 0) / 100;
    const sellingPrice = item.selling_price_ht ?? item.base_price_ht;
    return {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name ?? 'Produit inconnu',
      sku: item.product?.sku ?? '',
      quantity: 1,
      unit_price_ht: sellingPrice,
      tax_rate: 0.2,
      base_price_ht: item.base_price_ht,
      retrocession_rate: affiliateCommRate,
      linkme_selection_item_id: item.id,
      is_affiliate_product: true,
      affiliate_commission_rate: affiliateCommRate,
    };
  }

  const marginRate = item.margin_rate / 100;
  const sellingPrice = roundMoney(
    item.selling_price_ht ?? item.base_price_ht * (1 + marginRate)
  );
  const retrocessionRate = marginRate;
  return {
    id: `${item.product_id}-${Date.now()}`,
    product_id: item.product_id,
    product_name: item.product?.name ?? 'Produit inconnu',
    sku: item.product?.sku ?? '',
    quantity: 1,
    unit_price_ht: sellingPrice,
    tax_rate: 0.2,
    base_price_ht: item.base_price_ht,
    retrocession_rate: retrocessionRate,
    linkme_selection_item_id: item.id,
    is_affiliate_product: false,
    affiliate_commission_rate: 0,
  };
}

export function computeCartTotals(
  cart: CartItem[],
  shippingCostHt: number,
  handlingCostHt: number,
  insuranceCostHt: number,
  fraisTaxRate: number
) {
  const productsHt = cart.reduce(
    (sum, item) => sum + roundMoney(item.unit_price_ht * item.quantity),
    0
  );
  const totalFrais = shippingCostHt + handlingCostHt + insuranceCostHt;
  const totalHt = roundMoney(productsHt + totalFrais);

  const totalTva = cart.reduce((sum, item) => {
    const lineHt = roundMoney(item.unit_price_ht * item.quantity);
    return sum + roundMoney(lineHt * (item.tax_rate ?? 0.2));
  }, 0);
  const totalTvaFrais = roundMoney(totalFrais * fraisTaxRate);
  const totalTtc = roundMoney(totalHt + totalTva + totalTvaFrais);

  const totalRetrocession = cart.reduce((sum, item) => {
    if (item.is_affiliate_product) return sum;
    const lineHt = roundMoney(item.unit_price_ht * item.quantity);
    return sum + roundMoney(lineHt * item.retrocession_rate);
  }, 0);

  return {
    productsHt,
    totalFrais,
    totalHt,
    totalTva: roundMoney(totalTva + totalTvaFrais),
    totalTtc,
    totalRetrocession,
  };
}

export interface BuildOrderInputParams {
  customerType: CustomerType;
  selectedCustomerId: string;
  selectedAffiliateId: string;
  cart: CartItem[];
  orderDate: string;
  internalNotes: string;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  fraisTaxRate: number;
  selectedSelectionId: string;
  contactsAddressesData: ContactsAddressesData;
}

export function buildOrderInput(
  params: BuildOrderInputParams
): CreateLinkMeOrderInput {
  const {
    customerType,
    selectedCustomerId,
    selectedAffiliateId,
    cart,
    orderDate,
    internalNotes,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    fraisTaxRate,
    selectedSelectionId,
    contactsAddressesData,
  } = params;

  const contactDetails = buildLinkMeDetails(contactsAddressesData);
  const linkme_details: LinkMeDetailsInput | null = contactDetails
    ? { ...contactDetails }
    : null;

  const deliveryAddr = contactsAddressesData.deliverySameAsBillingAddress
    ? contactsAddressesData.billingAddress
    : contactsAddressesData.deliveryAddress;

  return {
    customer_type: customerType,
    customer_organisation_id:
      customerType === 'organization' ? selectedCustomerId : null,
    individual_customer_id:
      customerType === 'individual' ? selectedCustomerId : null,
    affiliate_id: selectedAffiliateId,
    items: cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      tax_rate: item.tax_rate ?? 0.2,
      base_price_ht: item.base_price_ht,
      retrocession_rate: item.is_affiliate_product
        ? item.affiliate_commission_rate
        : item.retrocession_rate,
      linkme_selection_item_id: item.linkme_selection_item_id,
      is_affiliate_product: item.is_affiliate_product,
    })),
    order_date: orderDate,
    internal_notes: internalNotes ?? undefined,
    shipping_cost_ht: shippingCostHt ?? 0,
    handling_cost_ht: handlingCostHt ?? 0,
    insurance_cost_ht: insuranceCostHt ?? 0,
    frais_tax_rate: fraisTaxRate,
    linkme_selection_id: selectedSelectionId || null,
    responsable_contact_id: contactsAddressesData.billingContact?.id ?? null,
    billing_contact_id: contactsAddressesData.billingContact?.id ?? null,
    delivery_contact_id: contactsAddressesData.deliverySameAsBillingContact
      ? (contactsAddressesData.billingContact?.id ?? null)
      : (contactsAddressesData.deliveryContact?.id ?? null),
    billing_address: contactsAddressesData.billingAddress?.customAddress
      ? {
          address_line1:
            contactsAddressesData.billingAddress.customAddress.addressLine1,
          city: contactsAddressesData.billingAddress.customAddress.city,
          postal_code:
            contactsAddressesData.billingAddress.customAddress.postalCode,
          country:
            contactsAddressesData.billingAddress.customAddress.country ?? 'FR',
        }
      : undefined,
    shipping_address: deliveryAddr?.customAddress
      ? {
          address_line1: deliveryAddr.customAddress.addressLine1,
          city: deliveryAddr.customAddress.city,
          postal_code: deliveryAddr.customAddress.postalCode,
          country: deliveryAddr.customAddress.country ?? 'FR',
        }
      : undefined,
    linkme_details,
  };
}
