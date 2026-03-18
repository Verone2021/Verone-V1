import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

interface ShippingConfigPublic {
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

const DEFAULT_CONFIG: ShippingConfigPublic = {
  standard_enabled: true,
  standard_label: 'Livraison standard',
  standard_price_cents: 1290,
  express_enabled: false,
  express_label: 'Livraison express',
  express_price_cents: 1990,
  free_shipping_enabled: true,
  free_shipping_threshold_cents: 15000,
  free_shipping_applies_to: 'standard',
};

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('sales_channels')
      .select('config')
      .eq('code', 'site_internet')
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const config = data.config as Record<string, unknown> | null;
    const shipping = config?.shipping as ShippingConfigPublic | undefined;

    return NextResponse.json(shipping ?? DEFAULT_CONFIG, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[ShippingConfig] Error:', error);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}
