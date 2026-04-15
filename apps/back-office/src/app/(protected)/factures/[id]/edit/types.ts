export type DocumentType = 'invoice' | 'quote' | 'credit_note';

export interface QontoClient {
  id: string;
  name: string;
  email?: string;
  billing_address?: {
    street_address?: string;
    city?: string;
    zip_code?: string;
    country_code?: string;
  };
}

export interface QontoInvoiceItem {
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
}

export interface QontoDocument {
  id: string;
  status: string;
  currency: string;
  issue_date: string;
  client_id: string;
  client?: QontoClient;
  items?: QontoInvoiceItem[];
  invoice_number?: string;
  payment_deadline?: string;
  quote_number?: string;
  expiry_date?: string;
  credit_note_number?: string;
  reason?: string;
  header?: string;
  footer?: string;
  terms_and_conditions?: string;
}

export interface IAddress {
  street: string;
  city: string;
  zip_code: string;
  country: string;
}

export const emptyAddress: IAddress = {
  street: '',
  city: '',
  zip_code: '',
  country: '',
};

export interface QontoApiResponse {
  success: boolean;
  invoice?: QontoDocument;
  quote?: QontoDocument;
  credit_note?: QontoDocument;
  creditNote?: QontoDocument;
  localData?: {
    billing_address?: IAddress | null;
    shipping_address?: IAddress | null;
    partner_legal_name?: string | null;
    partner_trade_name?: string | null;
    sales_order_id?: string | null;
    order_number?: string | null;
  } | null;
  error?: string;
}

export interface IEditableItem {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
}
