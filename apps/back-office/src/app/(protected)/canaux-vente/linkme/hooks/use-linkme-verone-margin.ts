'use client';

/**
 * useLinkMeVeroneMargin — marge nette Vérone sur toutes les ventes LinkMe.
 *
 * Appelle la RPC get_linkme_verone_margin(p_from, p_to).
 * Validation Zod sur la réponse JSONB.
 * Filtre par période (null = tout l'historique).
 *
 * Sprint : BO-PRODUCTS-PROFIT-002
 */

import { useQuery } from '@tanstack/react-query';

import { z } from 'zod';

import { createClient } from '@verone/utils/supabase/client';

// ---------- Schéma Zod ----------

const CostSourcesSchema = z.record(z.string(), z.coerce.number());

const TotalsSchema = z.object({
  lines: z.coerce.number(),
  orders: z.coerce.number(),
  quantity: z.coerce.number(),
  verone_revenue: z.coerce.number(),
  client_revenue: z.coerce.number(),
  affiliate_commission_total: z.coerce.number(),
  covered_lines: z.coerce.number(),
  covered_revenue: z.coerce.number(),
  cost_total: z.coerce.number(),
  margin_total: z.coerce.number(),
  margin_percent: z.coerce.number(),
  coefficient: z.coerce.number(),
  missing_cost_lines: z.coerce.number(),
  without_fees_lines: z.coerce.number(),
  affiliate_product_lines: z.coerce.number(),
  verone_commission_total: z.coerce.number(),
  cost_sources: CostSourcesSchema,
});

const ProductMarginSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  quantity: z.coerce.number(),
  verone_revenue: z.coerce.number(),
  margin_total: z.coerce.number(),
  margin_percent: z.coerce.number(),
  coefficient: z.coerce.number(),
  all_costs_include_fees: z.boolean().optional().default(false),
});

const LinkMeVeroneMarginSchema = z.object({
  totals: TotalsSchema,
  products: z.array(ProductMarginSchema),
});

export type LinkMeVeroneMargin = z.infer<typeof LinkMeVeroneMarginSchema>;
export type LinkMeVeroneMarginProduct = z.infer<typeof ProductMarginSchema>;

// ---------- Helpers ----------

/** Convertit une Date en chaîne ISO date (YYYY-MM-DD) */
function toIsoDate(d: Date | null | undefined): string | null {
  if (d == null) return null;
  return d.toISOString().slice(0, 10);
}

// ---------- Hook ----------

interface UseLinkMeVeroneMarginOptions {
  from: Date | null;
  to: Date | null;
}

export function useLinkMeVeroneMargin({
  from,
  to,
}: UseLinkMeVeroneMarginOptions) {
  const supabase = createClient();
  const fromStr = toIsoDate(from);
  const toStr = toIsoDate(to);

  return useQuery({
    queryKey: [
      'linkme-verone-margin',
      fromStr ?? 'all',
      toStr ?? 'all',
    ] as const,
    staleTime: 60_000,
    retry: 1,
    queryFn: async (): Promise<LinkMeVeroneMargin> => {
      const { data, error } = await supabase.rpc('get_linkme_verone_margin', {
        p_from: fromStr ?? undefined,
        p_to: toStr ?? undefined,
      });

      if (error) {
        console.error('[useLinkMeVeroneMargin] RPC error:', error.message);
        throw new Error(error.message);
      }

      const parsed = LinkMeVeroneMarginSchema.safeParse(data);
      if (!parsed.success) {
        console.error(
          '[useLinkMeVeroneMargin] Invalid shape:',
          parsed.error.issues
        );
        throw new Error('Réponse inattendue de la base de données');
      }
      return parsed.data;
    },
  });
}
