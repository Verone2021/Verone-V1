import type { Database } from '@verone/types';

export interface Affiliate {
  id: string;
  organisation_id: string | null;
  enseigne_id: string | null;
  affiliate_type: string; // 'enseigne' | 'client_professionnel' | 'client_particulier'
  display_name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  default_margin_rate: number | null;
  linkme_commission_rate: number | null;
  status: string | null; // 'pending' | 'active' | 'suspended' - relaxed for Supabase types
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  organisation_name?: string | null;
  enseigne_name?: string | null;
}

export interface Organisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
}

export type AffiliateRow =
  Database['public']['Tables']['linkme_affiliates']['Row'];
export type AffiliateInsert =
  Database['public']['Tables']['linkme_affiliates']['Insert'];
export type AffiliateUpdate =
  Database['public']['Tables']['linkme_affiliates']['Update'];
export type AffiliateWithOrg = AffiliateRow & {
  organisations: {
    legal_name: string;
    trade_name: string | null;
  } | null;
};

export interface Enseigne {
  id: string;
  name: string;
  logo_url: string | null;
}

export type AffiliateType =
  | 'enseigne'
  | 'client_professionnel'
  | 'client_particulier';

export interface FormData {
  entity_type: 'organisation' | 'enseigne';
  entity_id: string;
  display_name: string;
  slug: string;
  affiliate_type: AffiliateType;
  bio: string;
}
