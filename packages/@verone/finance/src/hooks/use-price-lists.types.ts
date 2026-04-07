export type PriceListType =
  | 'base'
  | 'customer_group'
  | 'channel'
  | 'promotional'
  | 'contract';

export interface PriceList {
  id: string;
  code: string;
  name: string;
  description: string | null;
  list_type: PriceListType;
  priority: number;
  currency: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  cost_price: number;
  discount_rate: number | null;
  min_quantity: number;
  max_quantity: number | null;
  margin_rate: number | null;
  currency: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations jointes
  products?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number;
  };
  price_lists?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CreatePriceListData {
  code: string;
  name: string;
  description?: string;
  list_type: PriceListType;
  priority?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

export interface UpdatePriceListData {
  code?: string;
  name?: string;
  description?: string;
  list_type?: PriceListType;
  priority?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

export interface CreatePriceListItemData {
  price_list_id: string;
  product_id: string;
  cost_price: number;
  discount_rate?: number;
  min_quantity?: number;
  max_quantity?: number;
  margin_rate?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdatePriceListItemData {
  cost_price?: number;
  discount_rate?: number;
  min_quantity?: number;
  max_quantity?: number;
  margin_rate?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  notes?: string;
}
