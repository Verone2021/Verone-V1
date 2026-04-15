export interface EligibleProduct {
  id: string;
  sku: string;
  name: string;
  primary_image_url?: string | null;
  cost_price?: number;
  family_name?: string | null;
  category_name?: string | null;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  product_status: 'draft' | 'active' | 'preorder' | 'discontinued';
}

export interface CustomMetadata {
  custom_price_ht?: number;
}

export interface GoogleMerchantProductManagerProps {
  products: EligibleProduct[];
  onAddProducts: (
    productIds: string[],
    customData: Record<string, CustomMetadata>,
    onProgress?: (progress: { synced: number; total: number }) => void
  ) => Promise<{
    success: boolean;
    synced: number;
    failed: number;
    error?: string;
  }>;
  isLoading?: boolean;
}
