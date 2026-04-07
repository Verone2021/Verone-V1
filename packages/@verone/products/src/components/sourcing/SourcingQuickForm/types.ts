export type SupplierMode = 'existing' | 'new';

export interface SourcingQuickFormProps {
  onSuccess?: (draftId: string) => void;
  onCancel?: () => void;
  className?: string;
  showHeader?: boolean;
}

export interface NewSupplierState {
  legal_name: string;
  has_different_trade_name: boolean;
  trade_name: string;
  website: string;
  country: string;
}

export interface ProductFormData {
  name: string;
  supplier_page_url: string;
  cost_price: number;
  supplier_reference: string;
  brand: string;
  description: string;
  supplier_moq: number;
  sourcing_channel: string;
  supplier_id: string;
  assigned_client_id: string;
  enseigne_id: string;
}
