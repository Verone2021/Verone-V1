'use client';

/**
 * useProductSalesMargin — données de marge pour la fiche produit.
 *
 * TanStack Query, clé ['product-sales-margin', productId], staleTime 30 s.
 * L'arithmétique est entièrement déléguée à product-sales-margin.ts (pur).
 *
 * Sprint : BO-PRODUCTS-PROFIT-001 / PROFIT-002
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import {
  LINKME_CHANNEL_ID,
  VALID_SALE_STATUSES,
  computeSaleLine,
  isValidLine,
  resolveCost,
  summarizeByChannel,
  summarizeLinkMe,
} from '../utils/product-sales-margin';

import type {
  ChannelSummary,
  ComputedSaleLine,
  CostSource,
  LinkMeSummary,
  LockedCostInput,
  ResolvedCost,
} from '../utils/product-sales-margin';

export type { ChannelSummary, ComputedSaleLine, LinkMeSummary, ResolvedCost };

export interface UseProductSalesMarginResult {
  lines: ComputedSaleLine[];
  byChannel: ChannelSummary[];
  linkme: LinkMeSummary;
  cost: ResolvedCost;
  isAffiliateProduct: boolean;
  linkmePriceHt: number | null;
  /** Prix cible produit (products.target_price) */
  targetPrice: number | null;
}

// ---------- Type guards ----------

const COST_SOURCES: ReadonlyArray<string> = [
  'validation',
  'purchase_history',
  'current_cost_net_avg',
  'current_cost_price',
  'missing',
];

function isCostSource(s: unknown): s is CostSource {
  return typeof s === 'string' && COST_SOURCES.includes(s);
}

function parseLockedCost(raw: unknown): LockedCostInput | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!isCostSource(obj.cost_source)) return null;
  return {
    costUnitHt: obj.cost_unit_ht != null ? Number(obj.cost_unit_ht) : null,
    source: obj.cost_source,
    includesFees: Boolean(obj.includes_fees),
  };
}

// ---------- Hook ----------

export function useProductSalesMargin(productId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product-sales-margin', productId] as const,
    staleTime: 30_000,
    enabled: Boolean(productId),
    queryFn: async (): Promise<UseProductSalesMarginResult> => {
      const [soiResult, productResult, pricingResult, offeringResult] =
        await Promise.all([
          // 1. Lignes de commande avec embeds (coût figé inclus)
          supabase
            .from('sales_order_items')
            .select(
              `id, quantity, unit_price_ht, total_ht,
               base_price_ht_locked, selling_price_ht_locked, retrocession_amount,
               cost:sales_order_item_costs(cost_unit_ht, cost_source, includes_fees),
               sales_orders!inner(
                 id, order_number, order_date, created_at, status, channel_id,
                 customer_id, customer_type, individual_customer_id,
                 sales_channels!sales_orders_channel_id_fkey(code, name),
                 organisations!sales_orders_customer_id_fkey(trade_name, legal_name),
                 individual_customers!sales_orders_individual_customer_id_fkey(first_name, last_name)
               ),
               linkme_selection_items!sales_order_items_linkme_selection_item_id_fkey(
                 selection_id,
                 linkme_selections!linkme_selection_items_selection_id_fkey(
                   affiliate_id,
                   linkme_affiliates!linkme_selections_affiliate_id_fkey(display_name)
                 )
               )`
            )
            .eq('product_id', productId)
            .in('sales_orders.status', [...VALID_SALE_STATUSES])
            .limit(2000),

          // 2. Coûts produit + prix cible
          supabase
            .from('products')
            .select(
              'id, cost_net_avg, cost_price, created_by_affiliate, affiliate_commission_rate, target_price'
            )
            .eq('id', productId)
            .single(),

          // 3. Prix LinkMe actuel
          supabase
            .from('channel_pricing')
            .select('custom_price_ht')
            .eq('product_id', productId)
            .eq('channel_id', LINKME_CHANNEL_ID)
            .maybeSingle(),

          // 4. Affiliés qui proposent le produit (sélections actives)
          supabase
            .from('linkme_selection_items')
            .select(
              `linkme_selections!linkme_selection_items_selection_id_fkey!inner(
                affiliate_id, archived_at
              )`
            )
            .eq('product_id', productId)
            .is('linkme_selections.archived_at', null)
            .limit(500),
        ]);

      if (soiResult.error) {
        console.error('[useProductSalesMargin] SOI:', soiResult.error.message);
        throw new Error(soiResult.error.message);
      }
      if (productResult.error) {
        console.error(
          '[useProductSalesMargin] Product:',
          productResult.error.message
        );
        throw new Error(productResult.error.message);
      }

      const prod = productResult.data;
      const linkmePriceHt =
        pricingResult.data?.custom_price_ht != null
          ? Number(pricingResult.data.custom_price_ht)
          : null;

      // Compter les affiliés qui proposent le produit
      const offeringAffiliateIds = new Set<string>();
      for (const item of offeringResult.data ?? []) {
        const selUnk: unknown = item.linkme_selections;
        if (Array.isArray(selUnk)) {
          for (const s of selUnk as unknown[]) {
            if (s != null && typeof s === 'object') {
              const sObj = s as Record<string, unknown>;
              if (typeof sObj.affiliate_id === 'string') {
                offeringAffiliateIds.add(sObj.affiliate_id);
              }
            }
          }
        } else if (selUnk != null && typeof selUnk === 'object') {
          const sObj = selUnk as Record<string, unknown>;
          if (typeof sObj.affiliate_id === 'string') {
            offeringAffiliateIds.add(sObj.affiliate_id);
          }
        }
      }

      const cost = resolveCost({
        costNetAvg:
          prod.cost_net_avg != null ? Number(prod.cost_net_avg) : null,
        costPrice: prod.cost_price != null ? Number(prod.cost_price) : null,
      });

      const productInput = {
        costNetAvg:
          prod.cost_net_avg != null ? Number(prod.cost_net_avg) : null,
        costPrice: prod.cost_price != null ? Number(prod.cost_price) : null,
        createdByAffiliate: Boolean(prod.created_by_affiliate),
        affiliateCommissionRate:
          prod.affiliate_commission_rate != null
            ? Number(prod.affiliate_commission_rate)
            : null,
      };

      // Mapper les lignes brutes → ComputedSaleLine
      const lines: ComputedSaleLine[] = (soiResult.data ?? [])
        .map(raw => {
          const so = raw.sales_orders;
          if (!so || typeof so !== 'object') return null;

          // Récupérer code/name du canal
          const chArray: unknown = so.sales_channels;
          const chFirst: unknown = Array.isArray(chArray)
            ? (chArray as unknown[])[0]
            : chArray;
          const chObj: Record<string, unknown> | null =
            chFirst != null && typeof chFirst === 'object'
              ? (chFirst as Record<string, unknown>)
              : null;
          const channelCode: string | null =
            chObj !== null && typeof chObj.code === 'string'
              ? chObj.code
              : null;
          const channelName: string | null =
            chObj !== null && typeof chObj.name === 'string'
              ? chObj.name
              : null;

          // Récupérer affilié depuis la sélection
          let affiliateId: string | null = null;
          let affiliateName: string | null = null;
          const siUnknown: unknown = raw.linkme_selection_items;
          const siFirst: unknown = Array.isArray(siUnknown)
            ? (siUnknown as unknown[])[0]
            : siUnknown;
          if (siFirst != null && typeof siFirst === 'object') {
            const siObj = siFirst as Record<string, unknown>;
            const selUnknown: unknown = siObj.linkme_selections;
            const selFirst: unknown = Array.isArray(selUnknown)
              ? (selUnknown as unknown[])[0]
              : selUnknown;
            if (selFirst != null && typeof selFirst === 'object') {
              const selObj = selFirst as Record<string, unknown>;
              if (typeof selObj.affiliate_id === 'string') {
                affiliateId = selObj.affiliate_id;
                const affUnknown: unknown = selObj.linkme_affiliates;
                const affFirst: unknown = Array.isArray(affUnknown)
                  ? (affUnknown as unknown[])[0]
                  : affUnknown;
                if (affFirst != null && typeof affFirst === 'object') {
                  const affObj = affFirst as Record<string, unknown>;
                  if (typeof affObj.display_name === 'string') {
                    affiliateName = affObj.display_name;
                  }
                }
              }
            }
          }

          // Coût figé à la vente (sales_order_item_costs embed)
          const lockedCost = parseLockedCost(raw.cost);

          // Nom du client
          let customerId: string | null = null;
          let customerName: string | null = null;
          const custType =
            typeof so.customer_type === 'string' ? so.customer_type : null;
          if (custType === 'organization') {
            customerId =
              typeof so.customer_id === 'string' ? so.customer_id : null;
            const orgUnk: unknown = so.organisations;
            const orgObj =
              orgUnk != null &&
              typeof orgUnk === 'object' &&
              !Array.isArray(orgUnk)
                ? (orgUnk as Record<string, unknown>)
                : null;
            if (orgObj !== null) {
              const tradeName =
                typeof orgObj.trade_name === 'string'
                  ? orgObj.trade_name
                  : null;
              const legalName =
                typeof orgObj.legal_name === 'string'
                  ? orgObj.legal_name
                  : null;
              customerName = tradeName ?? legalName;
            }
          } else if (custType === 'individual') {
            customerId =
              typeof so.individual_customer_id === 'string'
                ? so.individual_customer_id
                : null;
            const indUnk: unknown = so.individual_customers;
            const indObj =
              indUnk != null &&
              typeof indUnk === 'object' &&
              !Array.isArray(indUnk)
                ? (indUnk as Record<string, unknown>)
                : null;
            if (indObj !== null) {
              const fn =
                typeof indObj.first_name === 'string' ? indObj.first_name : '';
              const ln =
                typeof indObj.last_name === 'string' ? indObj.last_name : '';
              customerName = `${fn} ${ln}`.trim() || null;
            }
          }

          return computeSaleLine(
            {
              orderId: so.id,
              orderNumber: so.order_number,
              orderDate: so.order_date ?? so.created_at ?? null,
              channelId:
                typeof so.channel_id === 'string' ? so.channel_id : null,
              channelCode,
              channelName,
              status: so.status,
              quantity: Number(raw.quantity),
              unitPriceHt: Number(raw.unit_price_ht),
              totalHt: raw.total_ht != null ? Number(raw.total_ht) : null,
              basePriceLocked:
                raw.base_price_ht_locked != null
                  ? Number(raw.base_price_ht_locked)
                  : null,
              sellingPriceLocked:
                raw.selling_price_ht_locked != null
                  ? Number(raw.selling_price_ht_locked)
                  : null,
              retrocessionAmount:
                raw.retrocession_amount != null
                  ? Number(raw.retrocession_amount)
                  : null,
              affiliateId,
              affiliateName,
              lockedCost,
              customerId,
              customerName,
            },
            productInput,
            cost
          );
        })
        .filter((l): l is ComputedSaleLine => l !== null && isValidLine(l));

      const byChannel = summarizeByChannel(lines);
      const linkme = summarizeLinkMe(lines, {
        linkmePriceHt,
        cost,
        offeringAffiliateCount: offeringAffiliateIds.size,
      });

      return {
        lines,
        byChannel,
        linkme,
        cost,
        isAffiliateProduct: Boolean(prod.created_by_affiliate),
        linkmePriceHt,
        targetPrice:
          prod.target_price != null ? Number(prod.target_price) : null,
      };
    },
  });
}
