import type { IOrderForDocument } from '../OrderSelectModal';

export interface IInvoiceCreateFromOrderModalProps {
  order: IOrderForDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (invoiceId: string, invoiceNumber: string) => void;
}

export type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

export interface ICreatedInvoice {
  id: string;
  invoice_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
}

export interface IInvoiceApiResponse {
  success: boolean;
  error?: string;
  invoice: ICreatedInvoice;
}

export interface IInvoiceListApiResponse {
  success: boolean;
  invoices?: { invoice_number: string }[];
}
