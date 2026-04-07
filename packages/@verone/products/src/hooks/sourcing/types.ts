export interface SourcingProduct {
  id: string;
  sku: string;
  name: string;
  supplier_page_url: string | null;

  // 💰 PRICING - Pattern LPP (Last Purchase Price)
  cost_price: number | null; // Prix d'achat indicatif (auto-update via trigger PO)
  margin_percentage?: number; // Marge minimum en pourcentage
  // ❌ selling_price N'EXISTE PAS - Prix de vente sera dans sales_order_items (Phase 2)

  product_status: string;
  stock_status?: string;
  supplier_id: string | null;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    name: string;
    type: string;
    website: string | null;
  };
  creation_mode: string;
  sourcing_type?: string;
  requires_sample: boolean;
  assigned_client_id: string | null;
  assigned_client?: {
    id: string;
    name: string;
    type: string; // 🔥 FIX: type au lieu de is_professional
  };
  created_at: string;
  updated_at: string;
  archived_at?: string | null; // ✅ Pour gestion Annuler/Supprimer

  // ✅ FIX: Images produits (jointure LEFT depuis product_images)
  product_images?: Array<{
    public_url: string;
    is_primary: boolean;
  }>;

  // Calculs
  estimated_selling_price?: number;
}

export interface SourcingFilters {
  search?: string;
  product_status?: string;
  sourcing_type?: 'interne' | 'client';
  supplier_id?: string; // 🆕 Filtrer par fournisseur spécifique
  assigned_client_id?: string; // 🆕 Filtrer par client assigné spécifique
  has_supplier?: boolean;
  requires_sample?: boolean;
}
