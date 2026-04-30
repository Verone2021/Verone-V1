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
  /**
   * Mode lightweight pour les usages liste/sélecteur où on n'a besoin que
   * de id + legal_name + trade_name + type + is_active.
   * - Réduit le payload réseau (~70 colonnes → 5)
   * - Skip le calcul `_count.products` (N+1 query évitée)
   * Utiliser dans les contextes catalogue, dropdowns, filtres.
   */
  lightweight?: boolean;
}

// Type pour création d'organisation (basé sur Supabase Insert)
export type CreateOrganisationData = OrganisationInsert;

// Type pour mise à jour d'organisation
export type UpdateOrganisationData = Partial<OrganisationInsert> & {
  id: string;
};
