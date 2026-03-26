export interface PromoCode {
  id: string;
  code: string;
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
  created_at: string;
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
}
