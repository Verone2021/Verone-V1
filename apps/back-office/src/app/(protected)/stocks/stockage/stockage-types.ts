/**
 * Shared types for Stockage & Facturation page
 *
 * @module stockage-types
 * @since 2025-12-20
 */

export type OwnerTypeFilter = 'all' | 'enseigne' | 'organisation';

export interface AllocationData {
  allocation_id: string;
  product_name: string;
  product_sku: string;
  stock_quantity: number;
  total_volume_m3: number;
  billable_in_storage: boolean;
  storage_start_date: string;
}
