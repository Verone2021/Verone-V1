export interface EnseigneWithStats {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city?: string | null;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  organisations_count: number;
  affiliates_count: number;
  selections_count: number;
  orders_count: number;
  total_ca_ht: number;
  total_commissions: number;
}

export interface CreateEnseigneInput {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

export interface UpdateEnseigneInput {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

export interface EnseigneOrganisation {
  id: string;
  name: string;
  is_enseigne_parent: boolean;
  is_active: boolean;
  logo_url: string | null;
  created_at: string | null;
}
