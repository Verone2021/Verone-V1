import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const PromoSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
  product_ids: z.array(z.string()).optional(),
  customer_email: z.string().email().optional(),
  shipping_cost: z.number().min(0).optional(),
});

interface PromoDiscount {
  id: string;
  code: string | null;
  name: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  max_uses_total: number | null;
  max_uses_per_customer: number | null;
  current_uses: number;
  is_active: boolean;
  target_type: string;
  exclude_sale_items: boolean;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validated = PromoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    const { code, subtotal, product_ids, customer_email, shipping_cost } =
      validated.data;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Service indisponible' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch promo by code
    const { data, error } = await supabase
      .from('order_discounts')
      .select(
        'id, code, name, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, max_uses_total, max_uses_per_customer, current_uses, is_active, target_type, exclude_sale_items'
      )
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .eq('requires_code', true)
      .single();

    if (error ?? !data) {
      return NextResponse.json(
        { error: 'Code promo invalide ou expire' },
        { status: 404 }
      );
    }

    const promo = data as PromoDiscount;
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);

    // Date validation
    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { error: 'Ce code promo a expire' },
        { status: 400 }
      );
    }

    // Global usage limit
    if (
      promo.max_uses_total !== null &&
      promo.current_uses >= promo.max_uses_total
    ) {
      return NextResponse.json(
        { error: "Ce code promo a atteint sa limite d'utilisation" },
        { status: 400 }
      );
    }

    // Per-customer usage limit
    if (
      promo.max_uses_per_customer !== null &&
      promo.max_uses_per_customer > 0 &&
      customer_email
    ) {
      const { data: customerData } = await supabase
        .from('individual_customers')
        .select('id')
        .eq('email', customer_email)
        .single();

      if (customerData) {
        const { count } = await supabase
          .from('promotion_usages')
          .select('id', { count: 'exact', head: true })
          .eq('discount_id', promo.id)
          .eq('customer_id', customerData.id);

        if (count !== null && count >= promo.max_uses_per_customer) {
          return NextResponse.json(
            { error: 'Vous avez deja utilise ce code promo' },
            { status: 400 }
          );
        }
      }
    }

    // Product/collection targeting check
    if (promo.target_type !== 'all' && product_ids && product_ids.length > 0) {
      const { data: rawTargets } = await supabase
        .from('order_discount_targets')
        .select('target_id, target_type')
        .eq('discount_id', promo.id);

      const targets = rawTargets as Array<{
        target_id: string;
        target_type: string;
      }> | null;

      if (targets && targets.length > 0) {
        if (promo.target_type === 'products') {
          const targetProductIds = targets.map(t => t.target_id);
          const hasEligible = product_ids.some(pid =>
            targetProductIds.includes(pid)
          );
          if (!hasEligible) {
            return NextResponse.json(
              {
                error:
                  "Ce code promo ne s'applique pas aux produits de votre panier",
              },
              { status: 400 }
            );
          }
        }
        // For collections, we'd need to check product→collection membership
        // This is deferred — collection promos apply at order level for now
      }
    }

    // Minimum order amount
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
    if (promo.discount_type === 'free_shipping') {
      discountAmount = shipping_cost ?? 0;
    } else if (promo.discount_type === 'percentage') {
      discountAmount = subtotal * (promo.discount_value / 100);
    } else {
      discountAmount = promo.discount_value;
    }

    // Apply max discount cap
    if (
      promo.max_discount_amount !== null &&
      discountAmount > promo.max_discount_amount
    ) {
      discountAmount = promo.max_discount_amount;
    }

    return NextResponse.json({
      valid: true,
      discount_id: promo.id,
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
