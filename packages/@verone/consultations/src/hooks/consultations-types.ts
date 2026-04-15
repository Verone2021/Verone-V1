export interface ClientConsultation {
  id: string;
  enseigne_id?: string;
  organisation_id?: string;
  client_email: string;
  client_phone?: string;
  descriptif: string;
  image_url?: string;
  tarif_maximum?: number;
  status: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  assigned_to?: string;
  notes_internes?: string;
  priority_level: number;
  source_channel: 'website' | 'email' | 'phone' | 'other';
  estimated_response_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  responded_at?: string;
  responded_by?: string;
  // Lifecycle columns (ajoutées 2025-10-20)
  validated_at?: string;
  validated_by?: string;
  archived_at?: string;
  archived_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  tva_rate?: number;
  // Relations (optionnelles, pour joins)
  enseigne?: { id: string; name: string };
  organisation?: { id: string; legal_name: string; trade_name?: string };
}

// Interface existante maintenue pour rétrocompatibilité
export interface ConsultationProduct {
  id: string;
  consultation_id: string;
  product_id: string;
  proposed_price?: number;
  notes?: string;
  is_primary_proposal: boolean;
  quantity: number;
  is_free: boolean;
  created_at: string;
  created_by?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    requires_sample: boolean;
    supplier_name?: string;
  };
}

// Nouvelle interface simplifiée pour le workflow type commande
export interface ConsultationItem {
  id: string;
  consultation_id: string;
  product_id: string;
  quantity: number;
  unit_price?: number;
  is_free: boolean;
  is_sample: boolean;
  notes?: string;
  created_at: string;
  created_by?: string;
  shipping_cost: number;
  shipping_cost_currency: string;
  cost_price_override?: number;
  status: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    requires_sample: boolean;
    supplier_id?: string;
    supplier_name?: string;
    cost_price?: number;
    stock_real?: number;
    stock_forecasted_in?: number;
    stock_forecasted_out?: number;
    image_url?: string | null;
  };
}

export interface CreateConsultationData {
  enseigne_id?: string;
  organisation_id?: string;
  client_email: string;
  client_phone?: string;
  descriptif: string;
  image_url?: string;
  tarif_maximum?: number;
  priority_level?: number;
  source_channel?: 'website' | 'email' | 'phone' | 'other';
  estimated_response_date?: string;
  notes_internes?: string;
  /** Images uploadées (max 5) — insertion dans consultation_images */
  images?: Array<{
    publicUrl: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
  }>;
}

// Interface existante maintenue pour rétrocompatibilité
export interface AssignProductData {
  consultation_id: string;
  product_id: string;
  proposed_price?: number;
  notes?: string;
  is_primary_proposal?: boolean;
  quantity?: number;
  is_free?: boolean;
}

// Nouvelles interfaces simplifiées pour le workflow type commande
export interface CreateConsultationItemData {
  consultation_id: string;
  product_id: string;
  quantity: number;
  unit_price?: number;
  is_free?: boolean;
  notes?: string;
}

export interface UpdateConsultationItemData {
  quantity?: number;
  unit_price?: number;
  is_free?: boolean;
  is_sample?: boolean;
  notes?: string;
  shipping_cost?: number;
  shipping_cost_currency?: string;
  cost_price_override?: number;
  status?: string;
}

export interface ConsultationFilters {
  status?: string;
  assigned_to?: string;
  priority_level?: number | 'all';
  search_client?: string;
  source_channel?: string;
  date_range?: {
    start: string;
    end: string;
  };
}
