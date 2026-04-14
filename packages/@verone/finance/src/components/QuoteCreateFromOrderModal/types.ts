import type { IOrderForDocument, ICustomLine } from '../OrderSelectModal';

export type { IOrderForDocument, ICustomLine };

export type CreateStatus = 'idle' | 'creating' | 'success' | 'error';

export interface ICreatedQuote {
  id: string;
  quote_number: string;
  pdf_url?: string;
  public_url?: string;
  total_amount: number;
  currency: string;
  status: string;
}

export interface IQuoteCreateFromOrderModalProps {
  order: IOrderForDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
  /** When true, creates a standalone quote (no salesOrderId) using customer + customLines */
  isConsultation?: boolean;
  /** Consultation ID to link the devis in local DB */
  consultationId?: string;
  /** IDs of existing quotes to mark as superseded when creating the new one */
  supersededQuoteIds?: string[];
}

export interface IQuoteFeesState {
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
}
