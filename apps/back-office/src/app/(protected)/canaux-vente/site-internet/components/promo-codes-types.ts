export interface PromoCode {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  max_uses_total: number | null;
  max_uses_per_customer: number;
  current_uses: number;
  is_active: boolean;
  is_automatic: boolean;
  target_type: 'all' | 'products' | 'collections';
  exclude_sale_items: boolean;
  created_at: string;
}

export interface PromoTarget {
  id: string;
  discount_id: string;
  target_type: 'product' | 'collection';
  target_id: string;
}

export interface PromoFormData {
  code: string;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: string;
  max_discount_amount: string;
  valid_from: string;
  valid_until: string;
  max_uses_total: string;
  max_uses_per_customer: number;
  is_active: boolean;
  is_automatic: boolean;
  target_type: 'all' | 'products' | 'collections';
  exclude_sale_items: boolean;
  selected_target_ids: string[];
}
