import { createClient } from '@supabase/supabase-js';

import type { DiscountInput, ValidatedDiscount } from './types';

/**
 * Server-side promo validation — never trust the frontend discount_amount.
 * Revalidates the code against DB and recalculates the discount.
 */
export async function validatePromoServerSide(
  discount: DiscountInput,
  subtotalTtc: number,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<ValidatedDiscount | { error: string }> {
  if (!discount.code) {
    return { error: 'Code promo requis' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('order_discounts')
    .select(
      'id, code, name, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, max_uses_total, current_uses, is_active'
    )
    .eq('code', discount.code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { error: 'Code promo invalide ou expire' };
  }

  const promo = data as {
    id: string;
    code: string | null;
    discount_type: string;
    discount_value: number;
    min_order_amount: number | null;
    max_discount_amount: number | null;
    valid_from: string;
    valid_until: string;
    max_uses_total: number | null;
    current_uses: number;
    is_active: boolean;
  };

  const now = new Date();
  if (now < new Date(promo.valid_from) || now > new Date(promo.valid_until)) {
    return { error: 'Ce code promo a expire' };
  }

  if (
    promo.max_uses_total !== null &&
    promo.current_uses >= promo.max_uses_total
  ) {
    return { error: "Ce code promo a atteint sa limite d'utilisation" };
  }

  if (promo.min_order_amount !== null && subtotalTtc < promo.min_order_amount) {
    return {
      error: `Minimum de commande : ${promo.min_order_amount.toFixed(2)} \u20ac`,
    };
  }

  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = subtotalTtc * (promo.discount_value / 100);
  } else if (promo.discount_type === 'fixed') {
    discountAmount = promo.discount_value;
  }
  // free_shipping handled by Stripe shipping_options — discount_amount = 0

  if (
    promo.max_discount_amount !== null &&
    discountAmount > promo.max_discount_amount
  ) {
    discountAmount = promo.max_discount_amount;
  }

  return {
    discount_id: promo.id,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: Math.round(discountAmount * 100) / 100,
  };
}
