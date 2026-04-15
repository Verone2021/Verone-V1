import type { Database } from '@verone/types';

// Types Supabase internes
export type UserProfileUpdate =
  Database['public']['Tables']['user_profiles']['Update'];
export type UserAppRoleUpdate =
  Database['public']['Tables']['user_app_roles']['Update'];
export type LinkMeUserView =
  Database['public']['Views']['v_linkme_users']['Row'];

// Types publics
export type LinkMeRole =
  | 'enseigne_admin'
  | 'enseigne_collaborateur'
  | 'organisation_admin';

export interface LinkMeUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  linkme_role: LinkMeRole;
  enseigne_id: string | null;
  organisation_id: string | null;
  permissions: string[];
  is_active: boolean;
  role_created_at: string;
  default_margin_rate: number | null;
  enseigne_name: string | null;
  enseigne_logo: string | null;
  organisation_name: string | null;
  organisation_logo: string | null;
}

export interface EnseigneSelectOption {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface OrganisationSelectOption {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
}

export interface CreateLinkMeUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: LinkMeRole;
  enseigne_id?: string;
  organisation_id?: string;
  permissions?: string[];
}

export interface UpdateLinkMeUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: LinkMeRole;
  enseigne_id?: string | null;
  organisation_id?: string | null;
  permissions?: string[];
  is_active?: boolean;
}

// Constantes
export const LINKME_ROLE_LABELS: Record<LinkMeRole, string> = {
  enseigne_admin: 'Enseigne',
  enseigne_collaborateur: 'Collaborateur',
  organisation_admin: 'Organisation',
};

export const LINKME_ROLE_COLORS: Record<LinkMeRole, string> = {
  enseigne_admin: 'bg-purple-100 text-purple-800',
  enseigne_collaborateur: 'bg-teal-100 text-teal-800',
  organisation_admin: 'bg-blue-100 text-blue-800',
};

export const LINKME_ROLE_PERMISSIONS: Record<LinkMeRole, string[]> = {
  enseigne_admin: [
    'Gerer les selections de produits',
    'Vendre aux organisations du reseau',
    "Voir toutes les organisations de l'enseigne",
    'Acces aux statistiques reseau',
  ],
  enseigne_collaborateur: [
    'Consulter le catalogue et passer des commandes',
    'Acces aux statistiques (sans commissions)',
    'Pas de gestion des selections ni du reseau',
    "Rattache a l'enseigne de l'admin",
  ],
  organisation_admin: [
    'Creer des selections de produits',
    'Voir uniquement son organisation',
    'Formulaire de selection limite',
  ],
};
