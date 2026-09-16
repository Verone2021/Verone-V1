// Types locaux pour les données de sections éditables

export interface InfoSectionData {
  name: string;
  supplier_page_url: string;
  supplier_reference: string;
  subcategory_id: string;
}

export interface PricingSectionData {
  cost_price: number;
  eco_tax_default: number;
}

export interface SupplierSectionData {
  supplier_id: string | null;
}

export interface DetailsSectionData {
  manufacturer: string;
  description: string;
  supplier_moq: number | null;
  weight: number;
  /**
   * `products` n'a pas de colonnes dimensions_length/width/height : les trois
   * saisies vivent dans la colonne JSON `dimensions`.
   */
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface NotesSectionData {
  internal_notes: string;
}

export interface SourcingProduct {
  id: string;
  name: string;
  sku: string;
  supplier_page_url: string | null;
  supplier_reference?: string | null;
  subcategory_id?: string | null;
  cost_price: number | null;
  cost_net_avg?: number | null;
  eco_tax_default?: number | null;
  supplier_id: string | null;
  sourcing_type: 'client' | 'interne' | null;
  requires_sample: boolean;
  manufacturer?: string | null;
  description?: string | null;
  supplier_moq?: number | null;
  dimensions?: Record<string, number> | null;
  weight?: number | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    website?: string | null;
  } | null;
  assigned_client?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface ProductImage {
  id: string;
  public_url: string | null;
  cloudflare_image_id?: string | null;
  alt_text?: string | null;
}

export interface SourcingProductEditCardProps {
  product: SourcingProduct;
  primaryImage?: ProductImage | null;
  images?: ProductImage[];
  imagesLoading?: boolean;
  onProductUpdate: (updates: Partial<SourcingProduct>) => Promise<void>;
  onOpenPhotosModal: () => void;
  /**
   * Sections ouvertes de l'accordéon. Fourni = accordéon piloté par le parent
   * (la checklist de complétude ouvre la section du champ manquant).
   */
  openSections?: string[];
  onOpenSectionsChange?: (sections: string[]) => void;
  className?: string;
}
