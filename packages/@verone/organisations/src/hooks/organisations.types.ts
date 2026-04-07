import type { OrganisationInsert } from '@verone/types';

export interface OrganisationFilters {
  type?: 'supplier' | 'customer' | 'partner' | 'internal';
  customer_type?: 'professional' | 'individual' | 'all';
  is_active?: boolean;
  /** Filtre prestataire (true) vs fournisseur (false) pour type=supplier */
  is_service_provider?: boolean;
  search?: string;
  country?: string;
  include_archived?: boolean;
  /** Exclure les organisations qui appartiennent à une enseigne (enseigne_id IS NOT NULL) */
  exclude_with_enseigne?: boolean;
}

// Type pour création d'organisation (basé sur Supabase Insert)
export type CreateOrganisationData = OrganisationInsert;

// Type pour mise à jour d'organisation
export type UpdateOrganisationData = Partial<OrganisationInsert> & {
  id: string;
};
