// Types locaux pour les données de sections éditables

export interface InfoSectionData {
  name: string;
  supplier_page_url: string;
  supplier_reference: string;
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
  dimensions_length: number;
  dimensions_width: number;
  dimensions_height: number;
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
  alt_text?: string | null;
}

export interface SourcingProductEditCardProps {
  product: SourcingProduct;
  primaryImage?: ProductImage | null;
  images?: ProductImage[];
  imagesLoading?: boolean;
  onProductUpdate: (updates: Partial<SourcingProduct>) => Promise<void>;
  onOpenPhotosModal: () => void;
  className?: string;
}
