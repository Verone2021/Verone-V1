/**
 * Helpers partagés pour les routes /api/qonto/quotes
 * Ces fonctions sont pures (pas d'effets de bord) et réutilisables.
 */

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { QontoClient } from '@verone/integrations/qonto';

export type Organisation = Database['public']['Tables']['organisations']['Row'];
export type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

// ---------------------------------------------------------------------------
// Types exportés
// ---------------------------------------------------------------------------

export type ISalesOrderWithItems =
  Database['public']['Tables']['sales_orders']['Row'] & {
    sales_order_items: Array<{
      id: string;
      quantity: number;
      unit_price_ht: number;
      tax_rate: number | null;
      notes: string | null;
      products: { id: string; name: string; sku: string | null } | null;
    }>;
  };

export interface IFeesData {
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
}

export interface ICustomLine {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

export interface IStandaloneCustomer {
  customerId: string;
  customerType: 'organization' | 'individual';
}

export interface IPostRequestBody {
  salesOrderId?: string;
  consultationId?: string;
  userId?: string;
  supersededQuoteIds?: string[];
  customer?: IStandaloneCustomer;
  customerEmail?: string;
  expiryDays?: number;
  billingAddress?: {
    address_line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  fees?: IFeesData;
  customLines?: ICustomLine[];
}

export interface IQontoQuoteRaw {
  id: string;
  number?: string;
  quote_number?: string;
  status: string;
  currency?: string;
  total_amount?: number | string | { value: string; currency?: string } | null;
  total_amount_cents?: number;
  issue_date?: string;
  expiry_date?: string;
  client?: unknown;
  converted_to_invoice_id?: string | null;
  purchase_order_number?: string | null;
  pdf_url?: string | null;
  public_url?: string | null;
}

export interface IResolvedBillingAddress {
  streetAddress: string;
  city: string;
  zipCode: string;
  countryCode: string;
}

export interface IResolvedCustomer {
  customer: Organisation | IndividualCustomer | null;
  customerType: string;
}

export interface IQuoteItem {
  title: string;
  description: string | undefined;
  quantity: string;
  unit: string;
  unitPrice: { value: string; currency: string };
  vatRate: string;
}

// ---------------------------------------------------------------------------
// Helpers purs
// ---------------------------------------------------------------------------

/**
 * Parse le montant total depuis les différents formats que Qonto peut retourner.
 */
export function parseQontoAmount(raw: IQontoQuoteRaw): number {
  const totalAmt = raw.total_amount as
    | number
    | string
    | { value: string }
    | null
    | undefined;

  if (totalAmt !== null && totalAmt !== undefined) {
    if (typeof totalAmt === 'number') return totalAmt;
    if (typeof totalAmt === 'string') return parseFloat(totalAmt) || 0;
    if (typeof totalAmt === 'object' && 'value' in totalAmt) {
      return parseFloat(totalAmt.value) || 0;
    }
  }

  if (raw.total_amount_cents) return raw.total_amount_cents / 100;

  return 0;
}

/**
 * Mappe un devis brut Qonto vers notre format normalisé (GET et POST).
 */
export function mapQontoQuote(
  raw: IQontoQuoteRaw,
  includeUrls = false
): Record<string, unknown> {
  const base = {
    id: raw.id,
    quote_number: raw.number ?? raw.quote_number ?? '-',
    status: raw.status,
    currency: raw.currency ?? 'EUR',
    total_amount: parseQontoAmount(raw),
    issue_date: raw.issue_date,
    expiry_date: raw.expiry_date,
  };

  if (includeUrls) {
    return {
      ...base,
      quote_number: raw.number ?? raw.quote_number ?? '(brouillon)',
      pdf_url: raw.pdf_url,
      public_url: raw.public_url,
    };
  }

  return {
    ...base,
    client: raw.client,
    converted_to_invoice_id: raw.converted_to_invoice_id,
    purchase_order_number: raw.purchase_order_number ?? null,
  };
}

/**
 * Résout l'adresse de facturation selon les 3 priorités :
 * 1. bodyBillingAddress (envoyé par le modal)
 * 2. orderBillingAddress (JSONB de la commande en DB)
 * 3. colonnes directes de l'organisation (fallback)
 */
export function resolveBillingAddress(
  bodyBillingAddress: IPostRequestBody['billingAddress'],
  orderBillingAddress: Record<string, string> | null,
  customerType: string,
  customer: Organisation | IndividualCustomer | null
): IResolvedBillingAddress | null {
  let city: string | undefined;
  let zipCode: string | undefined;
  let street = '';
  let country = 'FR';

  if (bodyBillingAddress?.city) {
    city = bodyBillingAddress.city;
    zipCode = bodyBillingAddress.postal_code;
    street = bodyBillingAddress.address_line1 ?? '';
    country = bodyBillingAddress.country ?? 'FR';
  } else if (orderBillingAddress?.city) {
    city = orderBillingAddress.city;
    zipCode = orderBillingAddress.postal_code;
    street =
      orderBillingAddress.street ??
      orderBillingAddress.address ??
      orderBillingAddress.address_line1 ??
      '';
    country = orderBillingAddress.country ?? 'FR';
  } else if (customerType === 'organization' && customer) {
    const org = customer as Organisation;
    city = org.city ?? undefined;
    zipCode = org.postal_code ?? undefined;
    street = org.address_line1 ?? '';
    country = org.country ?? 'FR';
  }

  if (!city && !zipCode) return null;

  return {
    streetAddress: street,
    city: city ?? '',
    zipCode: zipCode ?? '',
    countryCode: country,
  };
}

/**
 * Extrait les infos client (email, nom, TVA, SIRET) selon le type.
 */
export function resolveCustomerInfo(
  customerType: string,
  customer: Organisation | IndividualCustomer | null,
  emailOverride?: string
): { email: string | null; name: string; vatNumber?: string; taxId?: string } {
  let email: string | null = null;
  let name = 'Client';
  let vatNumber: string | undefined;
  let taxId: string | undefined;

  if (customerType === 'organization' && customer) {
    const org = customer as Organisation;
    email = org.email ?? null;
    name = org.trade_name ?? org.legal_name ?? 'Client';
    vatNumber = org.vat_number ?? undefined;
    taxId = org.siret ?? undefined;
  } else if (customerType === 'individual' && customer) {
    const indiv = customer as IndividualCustomer;
    email = indiv.email ?? null;
    name =
      `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
  }

  return { email: emailOverride ?? email, name, vatNumber, taxId };
}

/**
 * Construit les items du devis depuis les lignes de commande et les frais.
 */
export function buildQuoteItems(
  orderItems: ISalesOrderWithItems['sales_order_items'],
  fees: IFeesData | undefined,
  orderFees: {
    shippingCostHt: number;
    handlingCostHt: number;
    insuranceCostHt: number;
    feesVatRate: number;
  },
  customLines?: ICustomLine[]
): IQuoteItem[] {
  const items: IQuoteItem[] = orderItems.map(item => ({
    title: item.products?.name ?? 'Article',
    description: item.notes ?? undefined,
    quantity: String(item.quantity ?? 1),
    unit: 'pièce',
    unitPrice: { value: String(item.unit_price_ht ?? 0), currency: 'EUR' },
    vatRate: String(item.tax_rate ?? 0.2),
  }));

  const feesVatRate = fees?.fees_vat_rate ?? orderFees.feesVatRate;

  const addFeeItem = (title: string, cost: number, vatRate: number): void => {
    if (cost > 0) {
      items.push({
        title,
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: { value: String(cost), currency: 'EUR' },
        vatRate: String(vatRate),
      });
    }
  };

  addFeeItem(
    'Frais de livraison',
    fees?.shipping_cost_ht ?? orderFees.shippingCostHt,
    feesVatRate
  );
  addFeeItem(
    'Frais de manutention',
    fees?.handling_cost_ht ?? orderFees.handlingCostHt,
    feesVatRate
  );
  addFeeItem(
    "Frais d'assurance",
    fees?.insurance_cost_ht ?? orderFees.insuranceCostHt,
    feesVatRate
  );

  if (customLines) {
    for (const line of customLines) {
      items.push({
        title: line.title,
        description: line.description,
        quantity: String(line.quantity),
        unit: 'pièce',
        unitPrice: { value: String(line.unit_price_ht), currency: 'EUR' },
        vatRate: String(line.vat_rate),
      });
    }
  }

  return items;
}

/**
 * Calcule les dates d'émission et d'expiration du devis.
 */
export function computeQuoteDates(expiryDays: number): {
  issueDate: string;
  expiryDate: string;
} {
  const issueDate = new Date().toISOString().split('T')[0];
  const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return { issueDate, expiryDate };
}

/**
 * Génère un numéro de document local unique.
 */
export function generateLocalDocNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(
    4,
    '0'
  );
  return `DEV-${yearMonth}-${randomSuffix}`;
}

/**
 * Récupère ou crée un client Qonto selon email et nom.
 */
export async function resolveQontoClient(
  qontoClient: QontoClient,
  customerName: string,
  customerEmail: string | null,
  qontoClientType: 'company' | 'individual',
  qontoAddress: IResolvedBillingAddress,
  vatNumber?: string,
  taxId?: string
): Promise<string> {
  let existingClient = customerEmail
    ? await qontoClient.findClientByEmail(customerEmail)
    : null;

  existingClient ??= await qontoClient.findClientByName(customerName);

  if (existingClient) {
    await qontoClient.updateClient(existingClient.id, {
      name: customerName ?? existingClient.name,
      type: qontoClientType,
      email: customerEmail ?? existingClient.email,
      address: qontoAddress,
      vatNumber: vatNumber ?? taxId,
    });
    return existingClient.id;
  }

  const newClient = await qontoClient.createClient({
    name: customerName ?? 'Client',
    type: qontoClientType,
    email: customerEmail ?? undefined,
    currency: 'EUR',
    address: qontoAddress,
    vatNumber: vatNumber ?? taxId,
  });
  return newClient.id;
}

/**
 * Récupère le client depuis Supabase selon le type (org ou individuel).
 */
export async function fetchCustomerFromSupabase(
  supabase: SupabaseClient,
  customerType: string,
  customerId: string,
  individualCustomerId?: string | null
): Promise<Organisation | IndividualCustomer | null> {
  if (customerType === 'organization') {
    const result = await supabase
      .from('organisations')
      .select('*')
      .eq('id', customerId)
      .single();
    return (result.data as Organisation | null) ?? null;
  }

  if (customerType === 'individual' && individualCustomerId) {
    const result = await supabase
      .from('individual_customers')
      .select('id, first_name, last_name, email')
      .eq('id', individualCustomerId)
      .single();
    return (result.data as IndividualCustomer | null) ?? null;
  }

  return null;
}
