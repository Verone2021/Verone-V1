import type { CreateQuoteItemData } from './types';

export interface IItemTotals {
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
}

export function computeItemTotals(item: CreateQuoteItemData): IItemTotals {
  const discountMultiplier = 1 - (item.discount_percentage ?? 0) / 100;
  const total_ht =
    item.quantity * item.unit_price_ht * discountMultiplier +
    (item.eco_tax ?? 0) * item.quantity;
  const tva_amount = total_ht * (item.tva_rate / 100);
  const total_ttc = total_ht + tva_amount;
  return { total_ht, tva_amount, total_ttc };
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `DEV-${year}${month}-${random}`;
}

export function computeValidityDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['validated'],
  validated: ['sent', 'draft'],
  sent: ['accepted', 'declined', 'expired'],
  accepted: ['converted'],
  declined: [],
  expired: [],
  converted: [],
  superseded: [],
};

/** Fields editable when quote is in 'validated' or 'sent' status */
export const LOCKED_EDITABLE_FIELDS = new Set([
  'notes',
  'billing_address',
  'shipping_address',
  'validity_days',
]);

export interface IQuoteItemInsert {
  document_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  discount_percentage: number;
  eco_tax: number;
  sort_order: number;
  linkme_selection_item_id: string | null;
  base_price_ht: number | null;
  retrocession_rate: number | null;
}

export function buildItemsToInsert(
  documentId: string,
  items: Array<CreateQuoteItemData & IItemTotals>
): IQuoteItemInsert[] {
  return items.map((item, index) => ({
    document_id: documentId,
    product_id: item.product_id ?? null,
    description: item.description,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    total_ht: item.total_ht,
    tva_rate: item.tva_rate,
    tva_amount: item.tva_amount,
    total_ttc: item.total_ttc,
    discount_percentage: item.discount_percentage ?? 0,
    eco_tax: item.eco_tax ?? 0,
    sort_order: index,
    linkme_selection_item_id: item.linkme_selection_item_id ?? null,
    base_price_ht: item.base_price_ht ?? null,
    retrocession_rate: item.retrocession_rate ?? null,
  }));
}

export function computeDocumentTotals(
  items: IItemTotals[],
  feesConfig: {
    shipping_cost_ht?: number;
    handling_cost_ht?: number;
    insurance_cost_ht?: number;
    fees_vat_rate?: number;
  }
) {
  const items_total_ht = items.reduce((sum, i) => sum + i.total_ht, 0);
  const fees_total_ht =
    (feesConfig.shipping_cost_ht ?? 0) +
    (feesConfig.handling_cost_ht ?? 0) +
    (feesConfig.insurance_cost_ht ?? 0);
  const fees_vat = fees_total_ht * (feesConfig.fees_vat_rate ?? 0.2);
  const items_tva = items.reduce((sum, i) => sum + i.tva_amount, 0);
  const total_ht = items_total_ht + fees_total_ht;
  const tva_amount = items_tva + fees_vat;
  const total_ttc = total_ht + tva_amount;
  return { total_ht, tva_amount, total_ttc };
}

/** Select query for quote fields */
export const QUOTE_SELECT_FIELDS = `
  id, document_number, document_date, due_date, validity_date,
  quote_status, customer_type, partner_id, partner_type,
  individual_customer_id, channel_id,
  total_ht, total_ttc, tva_amount,
  shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
  billing_address, shipping_address,
  qonto_invoice_id, qonto_pdf_url, qonto_public_url,
  converted_to_invoice_id, sales_order_id,
  linkme_selection_id, linkme_affiliate_id,
  description, notes, created_at, updated_at, created_by,
  partner:organisations!financial_documents_partner_id_fkey(id, legal_name, trade_name),
  individual_customer:individual_customers!individual_customer_id(id, first_name, last_name, email),
  channel:sales_channels!channel_id(id, name, code),
  items:financial_document_items(
    id, document_id, product_id, description, quantity,
    unit_price_ht, total_ht, tva_rate, tva_amount, total_ttc,
    discount_percentage, eco_tax, sort_order,
    linkme_selection_item_id, base_price_ht, retrocession_rate,
    product:products(id, name, sku, product_images(public_url, is_primary, display_order))
  )
`;
