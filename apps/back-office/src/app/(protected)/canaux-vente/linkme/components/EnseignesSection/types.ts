// Interface pour les organisations indépendantes (sans enseigne)
export interface OrganisationIndependante {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
  city: string | null;
  address_line1: string | null;
  postal_code: string | null;
  is_linkme_active: boolean;
}

// Type pour le résultat de la view v_linkme_users
export type LinkMeUserWithOrg = {
  organisation_id: string | null;
};
