import type { Organisation } from '@verone/organisations/hooks';

import type { OrganisationFormData, OrganisationType } from './types';

// ========================
// HELPERS
// ========================

export const getDefaultValues = (
  organisation?: Organisation | null
): OrganisationFormData => {
  if (!organisation) {
    return {
      name: '',
      country: 'FR',
      is_active: true,
      notes: '',
      // Adresse de facturation
      billing_address_line1: '',
      billing_address_line2: '',
      billing_postal_code: '',
      billing_city: '',
      billing_region: '',
      billing_country: 'FR',
      // Adresse de livraison
      shipping_address_line1: '',
      shipping_address_line2: '',
      shipping_postal_code: '',
      shipping_city: '',
      shipping_region: '',
      shipping_country: 'FR',
      has_different_shipping_address: false,
      has_different_trade_name: false,
      trade_name: '',
      siren: '',
      legal_form: '',
      siret: '',
      vat_number: '',
      industry_sector: '',
      currency: 'EUR',
      payment_terms: '',
      supplier_segment: '',
      enseigne_id: null,
      ownership_type: null,
    };
  }

  return {
    name: organisation.name,
    country: organisation.country ?? 'FR',
    is_active: organisation.is_active ?? true,
    notes: organisation.notes ?? '',
    // Adresse de facturation
    billing_address_line1: organisation.billing_address_line1 ?? '',
    billing_address_line2: organisation.billing_address_line2 ?? '',
    billing_postal_code: organisation.billing_postal_code ?? '',
    billing_city: organisation.billing_city ?? '',
    billing_region: organisation.billing_region ?? '',
    billing_country: organisation.billing_country ?? 'FR',
    // Adresse de livraison
    shipping_address_line1: organisation.shipping_address_line1 ?? '',
    shipping_address_line2: organisation.shipping_address_line2 ?? '',
    shipping_postal_code: organisation.shipping_postal_code ?? '',
    shipping_city: organisation.shipping_city ?? '',
    shipping_region: organisation.shipping_region ?? '',
    shipping_country: organisation.shipping_country ?? 'FR',
    has_different_shipping_address:
      organisation.has_different_shipping_address ?? false,
    has_different_trade_name: organisation.has_different_trade_name ?? false,
    trade_name: organisation.trade_name ?? '',
    siren: organisation.siren ?? '',
    legal_form: organisation.legal_form ?? '',
    siret: organisation.siret ?? '',
    vat_number: organisation.vat_number ?? '',
    industry_sector: organisation.industry_sector ?? '',
    currency: organisation.currency ?? 'EUR',
    payment_terms: organisation.payment_terms ?? '',
    supplier_segment: organisation.supplier_segment ?? '',
    enseigne_id: organisation.enseigne_id ?? null,
    ownership_type: organisation.ownership_type ?? null,
    latitude: organisation.latitude ?? null,
    longitude: organisation.longitude ?? null,
  };
};

export const getOrganisationTypeLabel = (type: OrganisationType): string => {
  const labels: Record<OrganisationType, string> = {
    supplier: 'Fournisseur',
    customer: 'Client professionnel',
    partner: 'Prestataire',
    internal: 'Interne',
    generic: 'Organisation',
  };
  return labels[type];
};
