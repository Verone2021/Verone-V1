/**
 * POST /api/channel-pricing/upsert
 *
 * Upsert d'une ligne channel_pricing avec garde-fou minimum de vente.
 *
 * Minimum calculé côté serveur depuis products.cost_price, margin_percentage, eco_tax_default
 * (ou variant_groups.common_cost_price / common_eco_tax si le groupe les gère).
 *
 * Rejet 422 si custom_price_ht < minimum, sauf si override_minimum=true.
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';
import { z } from 'zod';

const upsertSchema = z
  .object({
    product_id: z.string().uuid(),
    channel_id: z.string().uuid(),
    custom_price_ht: z.number().nonnegative().nullable().optional(),
    discount_rate: z.number().min(0).max(1).nullable().optional(),
    min_quantity: z.number().int().positive().optional(),
    notes: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    override_minimum: z.boolean().optional(),
  })
  .refine(
    data =>
      data.custom_price_ht == null ||
      data.discount_rate == null ||
      data.discount_rate === 0,
    {
      message:
        'custom_price_ht et discount_rate sont exclusifs (un des deux doit être null ou 0)',
    }
  );

interface MinimumContext {
  cost_price: number;
  eco_tax: number;
  margin_percentage: number;
  minimum: number;
}

function computeMinimum({
  cost_price,
  eco_tax,
  margin_percentage,
}: {
  cost_price: number;
  eco_tax: number;
  margin_percentage: number;
}): number {
  if (cost_price <= 0) return 0;
  const totalCost = cost_price + eco_tax;
  return Math.round(totalCost * (1 + margin_percentage / 100) * 100) / 100;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = upsertSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: body.error.issues.map(i => i.message).join(' | ') },
        { status: 400 }
      );
    }

    const input = body.data;

    const supabase = await createServerClient();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select(
        'id, cost_price, eco_tax_default, margin_percentage, variant_group_id'
      )
      .eq('id', input.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { ok: false, error: 'Produit introuvable' },
        { status: 404 }
      );
    }

    let cost_price = product.cost_price ?? 0;
    let eco_tax = product.eco_tax_default ?? 0;

    if (product.variant_group_id) {
      const { data: group } = await supabase
        .from('variant_groups')
        .select('has_common_cost_price, common_cost_price, common_eco_tax')
        .eq('id', product.variant_group_id)
        .single();

      if (group?.has_common_cost_price) {
        cost_price = group.common_cost_price ?? cost_price;
        eco_tax = group.common_eco_tax ?? eco_tax;
      }
    }

    const margin_percentage = product.margin_percentage ?? 0;

    const context: MinimumContext = {
      cost_price,
      eco_tax,
      margin_percentage,
      minimum: computeMinimum({ cost_price, eco_tax, margin_percentage }),
    };

    const effectivePrice =
      input.custom_price_ht != null &&
      (input.discount_rate == null || input.discount_rate === 0)
        ? input.custom_price_ht
        : null;

    if (
      effectivePrice != null &&
      cost_price > 0 &&
      margin_percentage > 0 &&
      effectivePrice < context.minimum &&
      !input.override_minimum
    ) {
      return NextResponse.json(
        {
          ok: false,
          minimum_selling_price: context.minimum,
          error: `Prix inférieur au minimum de vente (${context.minimum.toFixed(2)} €). Utilisez override_minimum=true pour forcer.`,
        },
        { status: 422 }
      );
    }

    const hasDiscount = input.discount_rate != null && input.discount_rate > 0;

    const { data: upserted, error: upsertError } = await supabase
      .from('channel_pricing')
      .upsert(
        {
          product_id: input.product_id,
          channel_id: input.channel_id,
          custom_price_ht: hasDiscount ? null : (input.custom_price_ht ?? null),
          discount_rate: hasDiscount ? input.discount_rate : null,
          markup_rate: null,
          min_quantity: input.min_quantity ?? 1,
          notes: input.notes ?? null,
          is_active: input.is_active ?? true,
        },
        { onConflict: 'product_id,channel_id,min_quantity' }
      )
      .select('id')
      .single();

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      channel_pricing_id: upserted.id,
      minimum_selling_price: context.minimum,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
