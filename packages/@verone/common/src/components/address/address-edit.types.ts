export interface Organisation {
  id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;

  // Adresse de facturation
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_postal_code?: string | null;
  billing_city?: string | null;
  billing_region?: string | null;
  billing_country?: string | null;

  // Adresse de livraison
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_postal_code?: string | null;
  shipping_city?: string | null;
  shipping_region?: string | null;
  shipping_country?: string | null;

  // Coordonnées GPS (adresse de livraison)
  latitude?: number | null;
  longitude?: number | null;

  // Indicateur adresses différentes
  has_different_shipping_address?: boolean | null;
}

export interface AddressEditSectionProps {
  organisation: Organisation;
  onUpdate: (updatedOrganisation: Partial<Organisation>) => void;
  className?: string;
}

export const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'ES', name: 'Espagne' },
  { code: 'CH', name: 'Suisse' },
  { code: 'UK', name: 'Royaume-Uni' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'OTHER', name: 'Autre' },
] as const;
