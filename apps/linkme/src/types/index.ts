/**
 * Types LinkMe Frontend
 * Types pour le frontend public et l'espace affilié
 */

// ============================================
// ENTITÉS DE BASE
// ============================================

export interface LinkMeAffiliate {
  id: string;
  user_id: string | null;
  organisation_id: string | null;
  enseigne_id: string | null;
  affiliate_type: 'enseigne' | 'prescripteur';
  display_name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  default_margin_rate: number;
  max_margin_rate: number;
  linkme_commission_rate: number;
  status: 'pending' | 'active' | 'suspended';
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkMeSelection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  /**
   * @deprecated Utiliser published_at !== null à la place
   * Gardé pour compatibilité, dérivé de published_at
   */
  is_public: boolean;
  share_token: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  /** Timestamp de publication. null = brouillon, non-null = publié */
  published_at: string | null;
  /** Timestamp d'archivage. null = actif, non-null = archivé */
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Helper: détermine si une sélection est publiée
 */
export function isSelectionPublished(selection: LinkMeSelection): boolean {
  return selection.published_at !== null && selection.archived_at === null;
}

export interface LinkMeSelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number;
  display_order: number;
  is_featured: boolean;
  created_at: string;
}

export interface LinkMeCommission {
  id: string;
  affiliate_id: string;
  selection_id: string | null;
  order_id: string | null;
  order_item_id: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  linkme_commission: number;
  margin_rate_applied: number;
  linkme_rate_applied: number;
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  validated_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  created_at: string;
}

// ============================================
// TYPES ENRICHIS (avec jointures)
// ============================================

export interface SelectionWithAffiliate extends LinkMeSelection {
  affiliate: Pick<LinkMeAffiliate, 'display_name' | 'slug' | 'logo_url'>;
}

export interface SelectionWithProducts extends LinkMeSelection {
  affiliate: Pick<
    LinkMeAffiliate,
    'display_name' | 'slug' | 'logo_url' | 'bio'
  >;
  items: SelectionItemWithProduct[];
}

export interface SelectionItemWithProduct extends LinkMeSelectionItem {
  product: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    primary_image_url: string | null;
    stock_real: number;
  };
}

export interface AffiliateWithSelections extends LinkMeAffiliate {
  selections: LinkMeSelection[];
  selections_count: number;
}

// ============================================
// TYPES PANIER
// ============================================

export interface CartItem {
  id: string; // selection_item_id
  product_id: string;
  selection_item_id: string;
  name: string;
  sku: string;
  image_url: string | null;
  base_price_ht: number;
  selling_price_ht: number;
  margin_rate: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  affiliateId: string | null;
  affiliateSlug: string | null;
  selectionId: string | null;
  selectionSlug: string | null;
}

export interface CartTotals {
  itemCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

// ============================================
// TYPES CHECKOUT
// ============================================

export interface CheckoutCustomer {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface CheckoutOrder {
  customer: CheckoutCustomer;
  items: CartItem[];
  affiliateId: string;
  selectionId: string;
  totals: CartTotals;
  paymentIntentId?: string;
}

// ============================================
// TYPES API RESPONSES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// TYPES DASHBOARD AFFILIÉ
// ============================================

export interface AffiliateDashboardStats {
  commissionsThisMonth: number;
  commissionsTotal: number;
  salesThisMonth: number;
  salesTotal: number;
  revenueThisMonth: number;
  revenueTotal: number;
  averageCommissionRate: number;
  pendingCommissions: number;
  paidCommissions: number;
}

export interface CommissionFilter {
  status?: 'pending' | 'validated' | 'paid' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  selectionId?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const TVA_RATE = 0.2; // 20% TVA

export const COMMISSION_STATUS_LABELS: Record<
  LinkMeCommission['status'],
  string
> = {
  pending: 'En attente',
  validated: 'Validée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

export const AFFILIATE_STATUS_LABELS: Record<
  LinkMeAffiliate['status'],
  string
> = {
  pending: 'En attente',
  active: 'Actif',
  suspended: 'Suspendu',
};

/**
 * Labels pour l'état de publication d'une sélection
 * Basé sur published_at et archived_at
 */
export function getSelectionStatusLabel(selection: LinkMeSelection): string {
  if (selection.archived_at) return 'Archivée';
  if (selection.published_at) return 'Publiée';
  return 'Brouillon';
}
