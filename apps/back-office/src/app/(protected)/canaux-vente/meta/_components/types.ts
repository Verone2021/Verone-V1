export interface MetaFilters {
  search: string;
  status: 'all' | 'active' | 'pending' | 'rejected' | 'error';
  sortBy: 'name' | 'sku' | 'price' | 'status' | 'synced_at';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_META_FILTERS: MetaFilters = {
  search: '',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};
