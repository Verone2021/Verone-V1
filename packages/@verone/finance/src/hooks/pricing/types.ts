export interface PricingResultV2 {
  cost_price: number;
  original_price: number;
  discount_rate: number | null;
  price_list_id: string;
  price_list_name: string;
  price_source:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  min_quantity: number;
  max_quantity: number | null;
  currency: string;
  margin_rate: number | null;
  notes: string | null;
}

export interface PricingResult {
  final_cost_price: number;
  pricing_source:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  discount_applied: number;
  original_cost_price: number;
}

export interface PricingParams {
  productId: string;
  customerId?: string;
  customerType?: 'organization' | 'individual';
  channelId?: string;
  quantity?: number;
  date?: string;
  enabled?: boolean;
}

export interface BatchPricingRequest {
  items: PricingParams[];
}

export interface BatchPricingResult {
  productId: string;
  pricing: PricingResult | null;
  error?: string;
}

export interface SalesChannel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_discount_rate: number | null;
  is_active: boolean;
  requires_approval: boolean;
  min_order_value: number | null;
  display_order: number;
  icon_name: string | null;
}

export interface ChannelPricing {
  id: string;
  product_id: string;
  channel_id: string;
  custom_cost_price: number | null;
  discount_rate: number | null;
  markup_rate: number | null;
  min_quantity: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface CustomerPricing {
  id: string;
  customer_id: string;
  customer_type: 'organization' | 'individual';
  product_id: string;
  custom_price_ht: number | null;
  discount_rate: number | null;
  retrocession_rate: number | null;
  contract_reference: string | null;
  min_quantity: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  customer_name?: string;
  product_name?: string;
}

export interface QuantityBreak {
  min_quantity: number;
  max_quantity: number | null;
  cost_price: number;
  discount_rate: number | null;
  price_list_name: string;
  savings_amount: number;
  savings_percent: number;
}

export interface QuantityBreaksParams {
  productId: string;
  channelId?: string;
  customerId?: string;
  customerType?: 'organization' | 'individual';
  date?: string;
  enabled?: boolean;
}
