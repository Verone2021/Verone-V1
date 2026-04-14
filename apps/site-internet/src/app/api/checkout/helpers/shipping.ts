import { createClient } from '@supabase/supabase-js';

import type { ShippingConfig, ShippingRateData } from './types';

export const DEFAULT_SHIPPING: ShippingConfig = {
  standard_enabled: true,
  standard_label: 'Livraison standard',
  standard_price_cents: 1290,
  standard_min_days: 5,
  standard_max_days: 7,
  express_enabled: false,
  express_label: 'Livraison express',
  express_price_cents: 1990,
  express_min_days: 2,
  express_max_days: 3,
  free_shipping_enabled: true,
  free_shipping_threshold_cents: 15000,
  free_shipping_applies_to: 'standard',
  allowed_countries: ['FR'],
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Checkout] Supabase not configured - using default shipping');
    return DEFAULT_SHIPPING;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('sales_channels')
    .select('config')
    .eq('code', 'site_internet')
    .single();

  if (error || !data) {
    console.warn('[Checkout] Failed to fetch shipping config:', error?.message);
    return DEFAULT_SHIPPING;
  }

  const config = data.config as Record<string, unknown> | null;
  const shipping = config?.shipping as ShippingConfig | undefined;

  return shipping ?? DEFAULT_SHIPPING;
}

export function buildShippingOptions(
  shipping: ShippingConfig,
  subtotalCents: number,
  maxProductShippingCents: number
): ShippingRateData[] {
  const options: ShippingRateData[] = [];

  if (shipping.standard_enabled) {
    const isFreeBase =
      shipping.free_shipping_enabled &&
      subtotalCents >= shipping.free_shipping_threshold_cents &&
      ['standard', 'all'].includes(shipping.free_shipping_applies_to);

    // Use the higher of: base rate OR max product shipping supplement
    const baseAmount = isFreeBase ? 0 : shipping.standard_price_cents;
    const finalAmount = Math.max(baseAmount, maxProductShippingCents);

    const label =
      finalAmount === 0
        ? `${shipping.standard_label} (offerte)`
        : shipping.standard_label;

    options.push({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: finalAmount, currency: 'eur' },
        display_name: label,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: shipping.standard_min_days },
          maximum: { unit: 'business_day', value: shipping.standard_max_days },
        },
      },
    });
  }

  if (shipping.express_enabled) {
    const isFree =
      shipping.free_shipping_enabled &&
      shipping.free_shipping_applies_to === 'all' &&
      subtotalCents >= shipping.free_shipping_threshold_cents;

    const baseAmount = isFree ? 0 : shipping.express_price_cents;
    const finalAmount = Math.max(baseAmount, maxProductShippingCents);

    options.push({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: finalAmount, currency: 'eur' },
        display_name: isFree
          ? `${shipping.express_label} (offerte)`
          : shipping.express_label,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: shipping.express_min_days },
          maximum: { unit: 'business_day', value: shipping.express_max_days },
        },
      },
    });
  }

  return options;
}
