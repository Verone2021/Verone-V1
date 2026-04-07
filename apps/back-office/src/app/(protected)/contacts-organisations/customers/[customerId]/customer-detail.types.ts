// Interface pour les images de produit (Supabase join)
export interface ProductImageRow {
  public_url: string | null;
  is_primary: boolean;
}

// Interface pour les produits retournés par Supabase
export interface ProductWithImages {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  product_images: ProductImageRow[] | null;
}

// Interface pour les produits du client
export interface CustomerProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
}

// Interface pour les canaux de vente de l'organisation
export interface OrganisationChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}

// Helper pour générer le badge ownership_type
export function getOwnershipBadge(
  type: string | null
): { label: string; className: string } | null {
  switch (type) {
    case 'succursale':
      return { label: 'Propre', className: 'bg-blue-100 text-blue-700' };
    case 'franchise':
      return { label: 'Franchise', className: 'bg-amber-100 text-amber-700' };
    default:
      return null;
  }
}
