// Counterparty types
// For debit: supplier (fournisseur de biens) or partner (prestataire de services)
// For credit: individual (client particulier B2C) or customer_pro (client professionnel B2B)
export type CounterpartyType =
  | 'supplier'
  | 'partner'
  | 'individual'
  | 'customer_pro';

export interface IOrganisationLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  transactionCount?: number;
  totalAmount?: number;
  onSuccess?: () => void;
  /** Transaction side determines which counterparty types to show */
  transactionSide?: 'credit' | 'debit';
}

// Unified counterparty (can be organisation OR individual customer)
export interface ISelectedCounterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  isOrganisation: boolean;
}

export interface IExistingRule {
  id: string;
  match_value: string;
  match_patterns: string[] | null;
  default_category: string | null;
  organisation_id: string | null;
  individual_customer_id?: string | null;
  counterparty_type?: string | null;
}
