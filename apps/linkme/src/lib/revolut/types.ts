/**
 * Types pour l'intégration Revolut Merchant API
 */

export type RevolutEnvironment = 'sandbox' | 'prod';

export interface RevolutOrderRequest {
  amount: number; // Montant en centimes (ex: 2499 = 24.99€)
  currency: string; // EUR, GBP, USD, etc.
  description?: string;
  merchant_order_ext_ref?: string; // Référence interne (ex: order ID)
  customer_email?: string;
  capture_mode?: 'automatic' | 'manual';
  metadata?: Record<string, string>;
}

export interface RevolutOrder {
  id: string;
  token: string; // Public token pour le SDK frontend (remplace public_id)
  type: 'payment';
  state: RevolutOrderState;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  description?: string;
  capture_mode: 'automatic' | 'manual';
  order_amount: {
    value: number;
    currency: string;
  };
  order_outstanding_amount?: {
    value: number;
    currency: string;
  };
  refunded_amount?: {
    value: number;
    currency: string;
  };
  merchant_order_ext_ref?: string;
  customer_email?: string;
  payments?: RevolutPayment[];
  metadata?: Record<string, string>;
}

export type RevolutOrderState =
  | 'pending'
  | 'processing'
  | 'authorised'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface RevolutPayment {
  id: string;
  state:
    | 'pending'
    | 'processing'
    | 'authorised'
    | 'captured'
    | 'failed'
    | 'cancelled';
  created_at: string;
  updated_at: string;
  amount: {
    value: number;
    currency: string;
  };
  payment_method?: {
    type: 'card' | 'revolut_pay' | 'apple_pay' | 'google_pay' | 'pay_by_bank';
    card?: {
      card_brand: string;
      card_last_four: string;
      card_expiry: string;
    };
  };
}

export interface RevolutWebhookEvent {
  event: RevolutWebhookEventType;
  order_id: string;
  merchant_order_ext_ref?: string;
  timestamp: string;
}

export type RevolutWebhookEventType =
  | 'ORDER_COMPLETED'
  | 'ORDER_AUTHORISED'
  | 'ORDER_PAYMENT_AUTHENTICATED'
  | 'ORDER_PAYMENT_DECLINED'
  | 'ORDER_PAYMENT_FAILED'
  | 'ORDER_CANCELLED';

export interface RevolutConfig {
  apiKey: string;
  publicKey: string;
  merchantId?: string;
  environment: RevolutEnvironment;
  webhookSecret?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: RevolutOrder;
  token?: string; // Pour le SDK frontend
  error?: string;
}

// Types pour le checkout frontend
export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    postcode: string;
    countryCode: string;
  };
}

export interface CartItemForOrder {
  product_id: string;
  selection_item_id: string;
  name: string;
  quantity: number;
  unit_price_ht: number;
  total_price_ht: number;
}

export interface LinkMeOrderData {
  customer: CheckoutFormData;
  items: CartItemForOrder[];
  affiliate_id: string;
  selection_id: string;
  total_ht: number;
  total_ttc: number;
  total_tva: number;
}
