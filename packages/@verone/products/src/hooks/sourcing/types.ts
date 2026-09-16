import type {
  SourcingListSegment,
  SourcingStage,
} from '../../utils/sourcing-stage';

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
  /** Sous-catégorie : exigée pour valider au catalogue (complétude). */
  subcategory_id?: string | null;
  /** Référence chez le fournisseur : exigée pour valider au catalogue. */
  supplier_reference?: string | null;
  /** Éco-participation unitaire : entre dans le coût rendu d'une offre. */
  eco_tax_default?: number | null;
  /** Quantité minimale de commande annoncée par le fournisseur retenu. */
  supplier_moq?: number | null;
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
  // Sourcing pipeline
  sourcing_status?: string;
  sourcing_priority?: string;
  sourcing_tags?: string[];
  target_price?: number | null;
  sourcing_notes?: string | null;
  consultation_id?: string | null;
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
    cloudflare_image_id?: string | null;
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
  // 'active' (défaut) : archived_at IS NULL
  // 'archived' : archived_at IS NOT NULL (onglet Archivés)
  archived_view?: 'active' | 'archived';
  // Fiche d'un produit précis, archivé ou non (ignore archived_view)
  product_id?: string;
  // Liste sourcing (P5) : segment et étape, prioritaires sur archived_view
  segment?: SourcingListSegment;
  stage?: SourcingStage;
  priority?: string;
}
