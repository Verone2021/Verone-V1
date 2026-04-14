export interface PromoResult {
  valid: boolean;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

export interface ShippingConfigPublic {
  standard_enabled: boolean;
  standard_label: string;
  standard_price_cents: number;
  express_enabled: boolean;
  express_label: string;
  express_price_cents: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold_cents: number;
  free_shipping_applies_to: 'standard' | 'all';
  shipping_info_message?: string;
}
