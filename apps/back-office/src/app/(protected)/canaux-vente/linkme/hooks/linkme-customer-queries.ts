import { createClient } from '@verone/utils/supabase/client';
import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from './linkme-customer-types';

const supabase = createClient();

export async function fetchEnseigneOrganisations(
  enseigneId: string
): Promise<EnseigneOrganisationCustomer[]> {
  const { data, error } = await supabase
    .from('organisations')
    .select(
      'id, legal_name, trade_name, email, phone, address_line1, city, postal_code, billing_address_line1, billing_city, billing_postal_code, siret, is_active, created_at, source_type, source_affiliate_id'
    )
    .eq('enseigne_id', enseigneId)
    .eq('type', 'customer')
    .order('legal_name');
  if (error) {
    console.error('Erreur fetch organisations enseigne:', error);
    throw error;
  }
  return (data ?? []).map(org => ({
    id: org.id,
    name: org.trade_name ?? org.legal_name,
    legal_name: org.legal_name,
    trade_name: org.trade_name,
    email: org.email,
    phone: org.phone,
    address_line1: org.address_line1,
    city: org.city,
    postal_code: org.postal_code,
    billing_address_line1: org.billing_address_line1 ?? null,
    billing_city: org.billing_city ?? null,
    billing_postal_code: org.billing_postal_code ?? null,
    siret: org.siret ?? null,
    is_active: org.is_active ?? true,
    created_at: org.created_at,
    source_type: org.source_type,
    source_affiliate_id: org.source_affiliate_id,
  }));
}

export async function fetchEnseigneIndividualCustomers(
  enseigneId: string
): Promise<EnseigneIndividualCustomer[]> {
  const { data, error } = await supabase
    .from('individual_customers')
    .select(
      'id, first_name, last_name, email, phone, address_line1, city, postal_code, created_at, source_type, source_affiliate_id'
    )
    .eq('enseigne_id', enseigneId)
    .order('last_name');
  if (error) {
    console.error('Erreur fetch individual customers enseigne:', error);
    throw error;
  }
  return (data ?? []).map(customer => ({
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    address_line1: customer.address_line1,
    city: customer.city,
    postal_code: customer.postal_code,
    created_at: customer.created_at,
    source_type: customer.source_type,
    source_affiliate_id: customer.source_affiliate_id,
  }));
}

export async function fetchOrganisationIndividualCustomers(
  organisationId: string,
  affiliateId?: string
): Promise<EnseigneIndividualCustomer[]> {
  let query = supabase
    .from('individual_customers')
    .select(
      'id, first_name, last_name, email, phone, address_line1, city, postal_code, created_at, source_type, source_affiliate_id'
    );
  if (affiliateId) {
    query = query.or(
      `organisation_id.eq.${organisationId},source_affiliate_id.eq.${affiliateId}`
    );
  } else {
    query = query.eq('organisation_id', organisationId);
  }
  const { data, error } = await query.order('last_name');
  if (error) {
    console.error('Erreur fetch individual customers organisation:', error);
    throw error;
  }
  return (data ?? []).map(customer => ({
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    address_line1: customer.address_line1,
    city: customer.city,
    postal_code: customer.postal_code,
    created_at: customer.created_at,
    source_type: customer.source_type,
    source_affiliate_id: customer.source_affiliate_id,
  }));
}
