export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  department?: string | null;
  is_primary_contact: boolean | null;
  is_commercial_contact: boolean | null;
  is_technical_contact: boolean | null;
  is_billing_contact: boolean | null;
  is_active: boolean | null;
  organisation?: {
    type?: string | null;
    [key: string]: unknown;
  } | null;
  enseigne?: {
    id: string;
    name: string;
  } | null;
}

export interface ContactStats {
  totalContacts: number;
  supplierContacts: number;
  customerContacts: number;
  primaryContacts: number;
  activeContacts: number;
}

export type FilterType = 'all' | 'supplier' | 'customer';
export type FilterRole = 'all' | 'primary' | 'technical' | 'billing';
