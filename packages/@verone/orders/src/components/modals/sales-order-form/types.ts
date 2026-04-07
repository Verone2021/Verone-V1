import type { Database } from '@verone/types';

// Extended types for fields present in DB but not in SalesOrder/SalesOrderItem interfaces
export interface SalesOrderExtended {
  payment_terms_type?: Database['public']['Enums']['payment_terms_type'] | null;
  payment_terms_notes?: string | null;
}

export interface SalesOrderItemExtended {
  eco_tax?: number;
  is_sample?: boolean;
}

export interface ProductExtended {
  eco_tax_default?: number;
}

// Type for pricing V2 RPC result
export interface PricingV2Result {
  price_ht: number;
  discount_rate: number | null;
  price_source:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  original_price: number;
}

// Types pour le wizard de création
export type SalesChannelType = 'manual' | 'site-internet' | 'linkme';
export type WizardStep = 'channel-selection' | 'form';
