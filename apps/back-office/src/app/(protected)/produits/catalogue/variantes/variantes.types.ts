export interface LocalVariantFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  type: 'all' | 'color' | 'material';
  subcategoryId?: string;
}
