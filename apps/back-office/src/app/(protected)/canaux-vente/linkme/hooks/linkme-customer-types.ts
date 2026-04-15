export interface EnseigneOrganisationCustomer {
  id: string;
  name: string;
  legal_name: string;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  billing_address_line1: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  siret: string | null;
  is_active: boolean;
  created_at: string | null;
  source_type: 'internal' | 'linkme' | 'site-internet' | 'manual' | null;
  source_affiliate_id: string | null;
}

export interface EnseigneIndividualCustomer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string | null;
  source_type: 'internal' | 'linkme' | 'site-internet' | 'manual' | null;
  source_affiliate_id: string | null;
}

export interface CreateOrganisationInput {
  enseigne_id: string;
  legal_name: string;
  trade_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  logo_url?: string | null;
  ownership_type?: 'succursale' | 'franchise' | null;
  source_type?: 'internal' | 'linkme' | 'site-internet' | 'manual';
  source_affiliate_id?: string | null;
}

export interface CreateIndividualCustomerInput {
  enseigne_id?: string | null;
  organisation_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  source_type?: 'internal' | 'linkme' | 'site-internet' | 'manual';
  source_affiliate_id?: string | null;
}
