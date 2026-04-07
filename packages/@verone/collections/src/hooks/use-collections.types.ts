export interface Collection {
  id: string;
  name: string;
  description?: string;
  is_featured?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  visibility: 'public' | 'private';
  shared_link_token?: string;
  product_count: number;
  shared_count: number;
  last_shared?: string;
  style?: string;
  suitable_rooms?: string[]; // Aligné avec products.suitable_rooms (40 pièces)
  theme_tags?: string[];
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
  image_url?: string; // Deprecated - utilise cover_image_url
  cover_image_url?: string; // Nouvelle image de couverture (collection_images table)
  color_theme?: string;
  archived_at?: string;
  products?: Array<{
    id: string;
    name: string;
    image_url?: string;
  }>;
}

export interface CollectionFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  visibility?: 'all' | 'public' | 'private';
  shared?: 'all' | 'shared' | 'not_shared';
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  is_active?: boolean;
  visibility?: 'public' | 'private';
  style?: string;
  suitable_rooms?: string[]; // Aligné avec products
  theme_tags?: string[];
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string;
}
