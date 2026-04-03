export interface GoogleMerchantFilters {
  search: string;
  status: 'all' | 'approved' | 'pending' | 'rejected' | 'error';
  sortBy: 'name' | 'sku' | 'price' | 'status' | 'synced_at';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_GM_FILTERS: GoogleMerchantFilters = {
  search: '',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};
