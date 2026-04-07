// ============================================
// TYPES — LinkMe Commissions Page
// ============================================

export interface Commission {
  id: string;
  affiliate_id: string;
  selection_id: string | null;
  order_id: string;
  order_item_id: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  linkme_commission: number;
  margin_rate_applied: number;
  linkme_rate_applied: number;
  tax_rate: number | null;
  order_number: string | null;
  status: string | null;
  validated_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  created_at: string | null;
  total_payout_ht: number | null;
  total_payout_ttc: number | null;
  // Joined
  affiliate?: {
    display_name: string;
    enseigne_id: string | null;
    organisation_id: string | null;
  } | null;
  sales_order?: {
    order_number: string;
    payment_status_v2: string | null;
    customer_type: string;
    total_ht: number | null;
    total_ttc: number | null;
    created_at: string | null;
    customer: {
      trade_name: string | null;
      legal_name: string;
    } | null;
  } | null;
}

export interface Affiliate {
  id: string;
  display_name: string;
  enseigne_id: string | null;
  organisation_id: string | null;
}

export type TabType = 'en_attente' | 'payables' | 'en_cours' | 'payees';
export type SortColumn = 'date' | 'order_number' | null;
export type SortDirection = 'asc' | 'desc';

// ============================================
// HOOK STATE INTERFACE
// ============================================

export interface CommissionsPageState {
  // Data
  commissions: Commission[];
  affiliates: Affiliate[];
  loading: boolean;
  processing: boolean;
  // Filters
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  affiliateFilter: string;
  setAffiliateFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  filterYear: number | null;
  setFilterYear: (v: number | null) => void;
  enseigneFilter: string;
  setEnseigneFilter: (v: string) => void;
  availableYears: number[];
  hasActiveFilters: boolean;
  resetFilters: () => void;
  enseignes: Array<{ id: string; name: string }>;
  // Selection
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: (list: Commission[]) => void;
  // Tabs / navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  // Pagination
  pageSize: number;
  setPageSize: (v: number) => void;
  currentPage: number;
  setCurrentPage: (updater: number | ((prev: number) => number)) => void;
  // Sort
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  handleSort: (column: SortColumn) => void;
  // Expand
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  // Modal
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (v: boolean) => void;
  openPaymentModal: () => void;
  handlePaymentSuccess: () => void;
  handleMarkPaid: (ids: string[]) => Promise<void>;
  exportToCSV: () => void;
  // Derived
  filteredByTab: Record<TabType, Commission[]>;
  tabCounts: Record<TabType, { count: number; total: number }>;
}
