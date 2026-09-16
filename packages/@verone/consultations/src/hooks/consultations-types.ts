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
  /** Marge par défaut de la consultation en % — produit le prix de vente
   *  quand aucun prix n'est saisi sur la ligne (BO-CONSULT-MULTI-001). */
  default_margin_percentage?: number | null;
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
  /** Prix de vente proposé. null = prix à fixer (jamais fallback cost_price). */
  unit_price: number | null;
  is_free: boolean;
  is_sample: boolean;
  notes?: string;
  created_at: string;
  created_by?: string;
  shipping_cost: number;
  shipping_cost_currency: string;
  /** Transport vente facturé au client (total ligne, EUR HT). 0 = aucun. */
  selling_shipping_cost: number;
  cost_price_override?: number;
  /** Marge de la ligne en % — prioritaire sur la marge par défaut de la
   *  consultation (BO-CONSULT-MULTI-001). null = suit la marge par défaut. */
  margin_percentage?: number | null;
  /** Besoin du client auquel la ligne répond. null = ligne libre. */
  need_id?: string | null;
  status: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    requires_sample: boolean;
    supplier_id?: string;
    supplier_name?: string;
    cost_price?: number;
    /** Éco-taxe par défaut du produit (Décision 6 BO-CONSULT-P2-001) */
    eco_tax_default?: number | null;
    stock_real?: number;
    stock_forecasted_in?: number;
    stock_forecasted_out?: number;
    image_url?: string | null;
    /** Produit retiré (BO-PRODUCTS-P8-001) : badge, non commandable, hors PDF client */
    archived_at?: string | null;
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
  selling_shipping_cost?: number;
  cost_price_override?: number;
  margin_percentage?: number | null;
  need_id?: string | null;
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
