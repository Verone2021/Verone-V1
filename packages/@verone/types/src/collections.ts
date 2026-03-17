/**
 * 🏭 Types Collections - Patterns Industrie 2025
 * Optimisés selon Shopify/Magento/WooCommerce standards
 *
 * Structure: Base → Extended → Business Logic
 */

// ===== BASE TYPES (Database Schema) =====

export type CollectionVisibility = 'public' | 'private';

export type CollectionStyle =
  | 'minimaliste'
  | 'contemporain'
  | 'moderne'
  | 'scandinave'
  | 'industriel'
  | 'classique'
  | 'boheme'
  | 'art_deco';

export type RoomCategory =
  | 'chambre'
  | 'wc_salle_bain'
  | 'salon'
  | 'cuisine'
  | 'bureau'
  | 'salle_a_manger'
  | 'entree'
  | 'plusieurs_pieces'
  | 'exterieur_balcon'
  | 'exterieur_jardin';

export type ShareType = 'link' | 'email' | 'pdf' | 'export';

// ===== CORE INTERFACES (Patterns E-commerce) =====

/**
 * Collection de base (Database Schema optimisé)
 */
export interface CollectionBase {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  visibility: CollectionVisibility;
  shared_link_token: string | null;
  product_count: number;
  shared_count: number;
  last_shared: string | null;
  style: CollectionStyle | null;
  suitable_rooms: string[] | null; // Aligné avec products.suitable_rooms (40 pièces)
  theme_tags: string[];
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  color_theme: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Type ProductImage unifié (Relation Supabase)
 */
export interface ProductImage {
  id: string;
  public_url: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  image_type?: 'gallery' | 'thumbnail' | 'technical' | 'lifestyle';
  alt_text?: string;
}

/**
 * Produit simplifié pour collections (Performance optimisée + Relations DB)
 */
export interface CollectionProduct {
  id: string;
  name: string;
  sku?: string;
  status: string;
  creation_mode?: string;
  cost_price?: number;
  position: number;
  added_at: string;
  // ✅ CORRECTION : Relation images normalisée
  product_images: ProductImage[];
  // ✅ HELPER : Image primaire calculée (accepte null depuis getPrimaryImageUrl)
  primary_image_url?: string | null;
}

/**
 * Collection avec produits (Extended)
 */
export interface CollectionWithProducts extends CollectionBase {
  products: CollectionProduct[];
}

/**
 * Collection pour affichage liste (Compact + Support produits)
 */
export interface CollectionListItem {
  id: string;
  name: string;
  description: string | null;
  visibility: CollectionVisibility;
  product_count: number;
  shared_count: number;
  style: CollectionStyle | null;
  room_category: RoomCategory | null;
  suitable_rooms: string[] | null; // Aligné avec products
  theme_tags: string[];
  updated_at: string;
  is_active: boolean;
  shared_link_token: string | null;
  // ✅ AJOUT : Support produits pour affichage (optionnel pour performance)
  products?: CollectionProduct[];
}

/**
 * Collection pour recherche (Full-Text Search)
 */
export interface CollectionSearchResult {
  id: string;
  name: string;
  description: string | null;
  style: CollectionStyle | null;
  room_category: RoomCategory | null;
  product_count: number;
  rank: number; // Score de pertinence
  snippet?: string; // Extrait de recherche
}

// ===== SHARE MANAGEMENT =====

export interface CollectionShare {
  id: string;
  collection_id: string;
  share_type: ShareType;
  recipient_email: string | null;
  shared_at: string;
  shared_by: string | null;
}

// ===== CRUD OPERATIONS (Patterns API) =====

/**
 * Données création collection (Input Form)
 */
export interface CreateCollectionInput {
  name: string;
  description?: string;
  visibility?: CollectionVisibility;
  style?: CollectionStyle;
  room_category?: RoomCategory;
  suitable_rooms?: string[]; // Aligné avec products (40 room types)
  theme_tags?: string[];
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
  image_url?: string;
  color_theme?: string;
}

/**
 * Données mise à jour collection (Partial Update)
 */
export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {
  id: string;
  is_active?: boolean;
}

/**
 * Ajout produit à collection
 */
export interface AddProductToCollectionInput {
  collection_id: string;
  product_id: string;
  position?: number;
}

/**
 * Réorganisation produits collection
 */
export interface ReorderCollectionProductsInput {
  collection_id: string;
  product_orders: Array<{
    product_id: string;
    position: number;
  }>;
}

// ===== FILTERS & SEARCH (Patterns E-commerce) =====

/**
 * Filtres collections (Advanced Filtering)
 */
export interface CollectionFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  visibility?: 'all' | CollectionVisibility;
  shared?: 'all' | 'shared' | 'not_shared';
  style?: CollectionStyle | CollectionStyle[];
  room_category?: RoomCategory | RoomCategory[];
  tags?: string[];
  has_image?: boolean;
  min_products?: number;
  max_products?: number;
  created_after?: string;
  created_before?: string;
  sort_by?:
    | 'name'
    | 'created_at'
    | 'updated_at'
    | 'product_count'
    | 'display_order';
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Paramètres recherche full-text
 */
export interface CollectionSearchParams {
  query: string;
  filters?: Omit<CollectionFilters, 'search'>;
  highlight?: boolean;
  limit?: number;
}

// ===== BUSINESS LOGIC TYPES =====

/**
 * Statut collection (Business Logic)
 */
export interface CollectionStatus {
  is_active: boolean;
  is_published: boolean; // visibility === 'public'
  is_shared: boolean; // shared_count > 0
  has_products: boolean; // product_count > 0
  has_image: boolean;
  is_complete: boolean; // has name + description + products
}

/**
 * Métriques collection (Analytics)
 */
export interface CollectionMetrics {
  id: string;
  name: string;
  total_products: number;
  total_shares: number;
  total_views?: number;
  last_activity: string;
  completion_score: number; // 0-100
  engagement_score: number; // 0-100
}

/**
 * Suggestion collection (Intelligence artificielle)
 */
export interface CollectionSuggestion {
  type: 'style' | 'room' | 'product' | 'tag';
  value: string;
  label: string;
  confidence: number; // 0-1
  reason: string;
}

// ===== API RESPONSES =====

/**
 * Réponse API collections (Pagination + Meta)
 */
export interface CollectionsResponse {
  data: CollectionListItem[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: CollectionFilters;
}

/**
 * Réponse API recherche collections
 */
export interface CollectionSearchResponse {
  data: CollectionSearchResult[];
  meta: {
    query: string;
    total_results: number;
    search_time_ms: number;
    suggestions: string[];
  };
}

// ===== ERROR HANDLING =====

export interface CollectionError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// ===== HOOKS RETURN TYPES =====

/**
 * Return type useCollections hook
 */
export interface UseCollectionsReturn {
  collections: CollectionListItem[];
  loading: boolean;
  error: CollectionError | null;
  filters: CollectionFilters;
  pagination: {
    page: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  // Actions
  setFilters: (filters: Partial<CollectionFilters>) => void;
  resetFilters: () => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  // CRUD
  createCollection: (
    data: CreateCollectionInput
  ) => Promise<CollectionBase | null>;
  updateCollection: (
    data: UpdateCollectionInput
  ) => Promise<CollectionBase | null>;
  deleteCollection: (id: string) => Promise<boolean>;
  toggleStatus: (id: string) => Promise<boolean>;
  // Products
  addProduct: (input: AddProductToCollectionInput) => Promise<boolean>;
  removeProduct: (
    collection_id: string,
    product_id: string
  ) => Promise<boolean>;
  reorderProducts: (input: ReorderCollectionProductsInput) => Promise<boolean>;
  // Sharing
  generateShareLink: (id: string) => Promise<string | null>;
  recordShare: (
    collection_id: string,
    share_type: ShareType,
    recipient_email?: string
  ) => Promise<boolean>;
}

/**
 * Return type useCollection hook (Single)
 */
export interface UseCollectionReturn {
  collection: CollectionWithProducts | null;
  loading: boolean;
  error: CollectionError | null;
  metrics: CollectionMetrics | null;
  status: CollectionStatus | null;
  suggestions: CollectionSuggestion[];
  // Actions
  refresh: () => Promise<void>;
  updateCollection: (data: UpdateCollectionInput) => Promise<boolean>;
  addProduct: (product_id: string, position?: number) => Promise<boolean>;
  removeProduct: (product_id: string) => Promise<boolean>;
  reorderProducts: (
    product_orders: Array<{ product_id: string; position: number }>
  ) => Promise<boolean>;
}

// ===== FORM TYPES (UI Components) =====

/**
 * État formulaire création collection
 */
export interface CollectionFormState {
  // Step 1: Basic Info
  name: string;
  description: string;
  image_url: string;
  // Step 2: Style & Pièces
  style: CollectionStyle | null;
  suitable_rooms: string[]; // Aligné avec products (40 room types)
  color_theme: string;
  // Step 3: Metadata & Settings
  visibility: CollectionVisibility;
  theme_tags: string[];
  meta_title: string;
  meta_description: string;
  display_order: number;
}

/**
 * Validation erreurs formulaire
 */
export interface CollectionFormErrors {
  name?: string;
  description?: string;
  style?: string;
  room_category?: string;
  theme_tags?: string;
  meta_title?: string;
  meta_description?: string;
  image_url?: string;
  general?: string;
}

// ===== CONSTANTS & DEFAULTS =====

// ✅ ALIGNÉ DB : Seulement 2 valeurs (private/public)
// Note : Le partage se gère via shared_link_token, pas via visibility
export const COLLECTION_VISIBILITY_OPTIONS: Array<{
  value: CollectionVisibility;
  label: string;
  description: string;
}> = [
  {
    value: 'private',
    label: 'Privée',
    description: 'Visible uniquement dans le back-office',
  },
  {
    value: 'public',
    label: 'Publique',
    description:
      'Visible sur les canaux de vente (site web, Google Merchant, etc.)',
  },
];

export const COLLECTION_STYLE_OPTIONS: Array<{
  value: CollectionStyle;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: 'minimaliste',
    label: 'Minimaliste',
    description: 'Épuré et fonctionnel',
    color: '#FFFFFF',
  },
  {
    value: 'contemporain',
    label: 'Contemporain',
    description: 'Moderne et élégant',
    color: '#F5F5F5',
  },
  {
    value: 'moderne',
    label: 'Moderne',
    description: 'Lignes nettes et matériaux innovants',
    color: '#E8E8E8',
  },
  {
    value: 'scandinave',
    label: 'Scandinave',
    description: 'Chaleureux et naturel',
    color: '#F0E6D2',
  },
  {
    value: 'industriel',
    label: 'Industriel',
    description: 'Brut et authentique',
    color: '#A0A0A0',
  },
  {
    value: 'classique',
    label: 'Classique',
    description: 'Intemporel et raffiné',
    color: '#DDD',
  },
  {
    value: 'boheme',
    label: 'Bohème',
    description: 'Libre et coloré',
    color: '#E6D7C3',
  },
  {
    value: 'art_deco',
    label: 'Art Déco',
    description: 'Luxueux et géométrique',
    color: '#D4AF37',
  },
];

export const ROOM_CATEGORY_OPTIONS: Array<{
  value: RoomCategory;
  label: string;
  icon: string;
}> = [
  { value: 'salon', label: 'Salon', icon: '🛋️' },
  { value: 'chambre', label: 'Chambre', icon: '🛏️' },
  { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { value: 'salle_a_manger', label: 'Salle à manger', icon: '🍽️' },
  { value: 'bureau', label: 'Bureau', icon: '💻' },
  { value: 'wc_salle_bain', label: 'Salle de bain', icon: '🛁' },
  { value: 'entree', label: 'Entrée', icon: '🚪' },
  { value: 'plusieurs_pieces', label: 'Plusieurs pièces', icon: '🏠' },
  { value: 'exterieur_balcon', label: 'Balcon', icon: '🌿' },
  { value: 'exterieur_jardin', label: 'Jardin', icon: '🌳' },
];

export const DEFAULT_COLLECTION_FILTERS: CollectionFilters = {
  status: 'all',
  visibility: 'all',
  shared: 'all',
  sort_by: 'updated_at',
  sort_direction: 'desc',
  limit: 20,
  offset: 0,
};

// =====================================================================
// CONSTANTES - Types de pièces (partagé avec variant_groups)
// =====================================================================

export const ROOM_TYPES = [
  { value: 'atelier', label: 'Atelier', emoji: '🛠️' },
  { value: 'balcon', label: 'Balcon', emoji: '🌿' },
  { value: 'bibliotheque', label: 'Bibliothèque', emoji: '📚' },
  { value: 'buanderie', label: 'Buanderie', emoji: '🧺' },
  { value: 'bureau', label: 'Bureau', emoji: '💼' },
  { value: 'cave', label: 'Cave', emoji: '🍷' },
  { value: 'cellier', label: 'Cellier', emoji: '🏺' },
  { value: 'chambre', label: 'Chambre', emoji: '🛏️' },
  { value: 'couloir', label: 'Couloir', emoji: '🚪' },
  { value: 'cour', label: 'Cour', emoji: '🌳' },
  { value: 'cuisine', label: 'Cuisine', emoji: '🍳' },
  { value: 'dressing', label: 'Dressing', emoji: '👔' },
  { value: 'garage', label: 'Garage', emoji: '🚗' },
  { value: 'grenier', label: 'Grenier', emoji: '📦' },
  { value: 'hall_entree', label: "Hall d'entrée", emoji: '🏛️' },
  { value: 'jardin', label: 'Jardin', emoji: '🌸' },
  { value: 'loggia', label: 'Loggia', emoji: '🏞️' },
  { value: 'mezzanine', label: 'Mezzanine', emoji: '📐' },
  { value: 'patio', label: 'Patio', emoji: '☀️' },
  { value: 'salle_a_manger', label: 'Salle à manger', emoji: '🍽️' },
  { value: 'salle_de_bain', label: 'Salle de bain', emoji: '🛁' },
  { value: 'salle_de_jeux', label: 'Salle de jeux', emoji: '🎮' },
  { value: 'salle_de_sport', label: 'Salle de sport', emoji: '🏋️' },
  { value: 'salon', label: 'Salon', emoji: '🛋️' },
  { value: 'salon_sejour', label: 'Salon/Séjour', emoji: '🏠' },
  { value: 'sous_sol', label: 'Sous-sol', emoji: '⬇️' },
  { value: 'terrasse', label: 'Terrasse', emoji: '🌅' },
  { value: 'toilettes', label: 'Toilettes', emoji: '🚽' },
  { value: 'veranda', label: 'Véranda', emoji: '🪟' },
  { value: 'wc', label: 'WC', emoji: '🚻' },
] as const;

// ===== HELPER FUNCTIONS (Utilities) =====

/**
 * Calcule l'URL de l'image primaire depuis une liste d'images
 * Pattern utilisé par ProductSelectorModal - standardisé
 */
export function getPrimaryImageUrl(
  images: ProductImage[] | Array<Partial<ProductImage>>
): string | null {
  if (!images || images.length === 0) return null;

  // Chercher l'image primaire
  const primaryImage = images.find(img => img.is_primary);
  if (primaryImage?.public_url) return primaryImage.public_url;

  // Fallback : première image disponible
  const firstImage = images[0];
  return firstImage?.public_url ?? null;
}

/** Raw product image data from Supabase before transformation */
interface RawProductImage {
  id?: string;
  public_url?: string;
  storage_path?: string;
  is_primary?: boolean;
  display_order?: number;
  image_type?: string;
  alt_text?: string;
}

/** Raw product data from Supabase before transformation */
interface RawCollectionProduct {
  id: string;
  name: string;
  sku?: string;
  status: string;
  creation_mode?: string;
  cost_price?: number;
  position?: number;
  added_at?: string;
  product_images?: RawProductImage[];
}

/**
 * Transforme les données produit brutes vers CollectionProduct
 * avec gestion correcte des images selon relations Supabase
 */
export function formatCollectionProduct(
  rawProduct: RawCollectionProduct
): CollectionProduct {
  const productImages = rawProduct.product_images ?? [];

  return {
    id: rawProduct.id,
    name: rawProduct.name,
    sku: rawProduct.sku,
    status: rawProduct.status,
    creation_mode: rawProduct.creation_mode,
    cost_price: rawProduct.cost_price,
    position: rawProduct.position ?? 0,
    added_at: rawProduct.added_at ?? new Date().toISOString(),
    product_images: productImages.map(img => ({
      id: img.id ?? '',
      public_url: img.public_url ?? '',
      storage_path: img.storage_path ?? '',
      is_primary: img.is_primary ?? false,
      display_order: img.display_order ?? 0,
      image_type: (img.image_type as ProductImage['image_type']) ?? 'gallery',
      alt_text: img.alt_text,
    })),
    primary_image_url: getPrimaryImageUrl(
      productImages as Array<Partial<ProductImage>>
    ),
  };
}
