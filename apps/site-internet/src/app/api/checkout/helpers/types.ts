import { z } from 'zod';

/**
 * Ce que le navigateur a le droit d'imposer : le produit, la quantité et le
 * choix du montage. Les trois montants qui suivent sont encore acceptés, mais
 * uniquement pour être COMPARÉS aux prix lus en base (`resolveCartItems`).
 * Aucun d'eux ne sert de montant à payer. Voir `src/lib/checkout/`.
 */
export const CheckoutItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  include_assembly: z.boolean(),
  // Valeurs annoncées par le navigateur — comparées, jamais encaissées.
  price_ttc: z.number().min(0),
  assembly_price: z.number().min(0),
  eco_participation: z.number().min(0),
});

/**
 * Le navigateur n'annonce que le code. Le montant de la remise est recalculé
 * côté serveur par `validatePromoServerSide` — même principe que les prix.
 */
export const DiscountSchema = z.object({
  code: z.string().min(1).max(64),
});

export const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default('FR'),
  }),
  userId: z.string().uuid().optional(),
  discount: DiscountSchema.optional(),
});

export interface ShippingConfig {
  standard_enabled: boolean;
  standard_label: string;
  standard_price_cents: number;
  standard_min_days: number;
  standard_max_days: number;
  express_enabled: boolean;
  express_label: string;
  express_price_cents: number;
  express_min_days: number;
  express_max_days: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold_cents: number;
  free_shipping_applies_to: 'standard' | 'all';
  allowed_countries: string[];
  shipping_info_message?: string;
}

export type DiscountInput = z.infer<typeof DiscountSchema>;

export interface ValidatedDiscount {
  discount_id: string;
  code: string | null;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

export interface ShippingRateData {
  shipping_rate_data: {
    type: 'fixed_amount';
    fixed_amount: { amount: number; currency: string };
    display_name: string;
    delivery_estimate: {
      minimum: { unit: 'business_day'; value: number };
      maximum: { unit: 'business_day'; value: number };
    };
  };
}
