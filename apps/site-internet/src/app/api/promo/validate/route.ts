import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const PromoSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

interface PromoDiscount {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  max_uses_total: number | null;
  current_uses: number;
  is_active: boolean;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = PromoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    const { code, subtotal } = validated.data;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Service indisponible' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('order_discounts')
      .select(
        'id, code, name, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, max_uses_total, current_uses, is_active'
      )
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .eq('requires_code', true)
      .single();

    if (error ?? !data) {
      return NextResponse.json(
        { error: 'Code promo invalide ou expiré' },
        { status: 404 }
      );
    }

    const promo = data as PromoDiscount;
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { error: 'Ce code promo a expiré' },
        { status: 400 }
      );
    }

    if (
      promo.max_uses_total !== null &&
      promo.current_uses >= promo.max_uses_total
    ) {
      return NextResponse.json(
        { error: "Ce code promo a atteint sa limite d'utilisation" },
        { status: 400 }
      );
    }

    if (promo.min_order_amount !== null && subtotal < promo.min_order_amount) {
      return NextResponse.json(
        {
          error: `Minimum de commande : ${promo.min_order_amount.toFixed(2)} \u20ac`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = subtotal * (promo.discount_value / 100);
    } else {
      discountAmount = promo.discount_value;
    }

    if (
      promo.max_discount_amount !== null &&
      discountAmount > promo.max_discount_amount
    ) {
      discountAmount = promo.max_discount_amount;
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      name: promo.name,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      discount_amount: Math.round(discountAmount * 100) / 100,
    });
  } catch (error) {
    console.error('[Promo] Validation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}
