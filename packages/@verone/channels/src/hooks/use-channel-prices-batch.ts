'use client';

/**
 * Hook : useChannelPricesBatch
 *
 * Charge en DEUX requêtes le prix de vente réel de plusieurs produits sur les canaux
 * Site Internet et LinkMe, pour afficher les marges dans une liste sans faire une
 * requête par ligne.
 *
 * Reproduit exactement la cascade de la fonction `get_site_internet_products`, seule
 * source de vérité du prix public :
 *
 *   prix site = channel_pricing.custom_price_ht (canal site, actif)
 *               sinon price_list_items.price_ht (liste « base » la plus prioritaire)
 *
 * La provenance est renvoyée telle quelle (`source`), parce qu'elle change tout :
 * un prix `channel_pricing` a été posé sur ce produit, un prix `base_price` est le
 * repli automatique à `prix d'achat × 1,5` qui n'a jamais été décidé par personne.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { CHANNEL_IDS } from '../constants/channel-ids';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** D'où vient le prix affiché sur le site. */
export type SitePriceSource = 'channel_pricing' | 'base_price' | 'none';

export interface ProductChannelPrices {
  /** Prix HT réellement servi sur le site, cascade comprise. null si aucun. */
  sitePriceHt: number | null;
  sitePriceSource: SitePriceSource;
  /** Renseigné quand un humain a enregistré ce prix depuis un écran. */
  sitePriceValidatedAt: string | null;
  /** Prix HT du canal LinkMe (prix Vérone proposé aux affiliés). */
  linkmePriceHt: number | null;
  linkmePriceValidatedAt: string | null;
  /** Éco-participation portée par la ligne de prix du canal site. */
  siteEcoParticipationHt: number | null;
}

export type ChannelPricesMap = ReadonlyMap<string, ProductChannelPrices>;

const EMPTY: ProductChannelPrices = {
  sitePriceHt: null,
  sitePriceSource: 'none',
  sitePriceValidatedAt: null,
  linkmePriceHt: null,
  linkmePriceValidatedAt: null,
  siteEcoParticipationHt: null,
};

interface ChannelPricingRow {
  product_id: string;
  channel_id: string;
  custom_price_ht: number | null;
  eco_participation_amount: number | null;
  price_validated_at: string | null;
}

interface BasePriceRow {
  product_id: string;
  price_ht: number | null;
  price_lists:
    | { priority: number | null }
    | { priority: number | null }[]
    | null;
}

function toNumber(value: number | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Une jointure Supabase peut arriver en objet ou en tableau selon la cardinalité. */
function priorityOf(row: BasePriceRow): number {
  const list = Array.isArray(row.price_lists)
    ? row.price_lists[0]
    : row.price_lists;
  return list?.priority ?? Number.MAX_SAFE_INTEGER;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChannelPricesBatch(productIds: readonly string[]) {
  const supabase = createClient();

  // Clé stable : l'ordre d'affichage ne doit pas provoquer un rechargement.
  const ids = Array.from(
    new Set(productIds.filter(id => id && id.trim() !== ''))
  );
  ids.sort();

  const query = useQuery<ChannelPricesMap>({
    queryKey: ['channel-prices-batch', ids],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const [pricingResult, baseResult] = await Promise.all([
        supabase
          .from('channel_pricing')
          .select(
            'product_id, channel_id, custom_price_ht, eco_participation_amount, price_validated_at'
          )
          .in('product_id', ids)
          .in('channel_id', [CHANNEL_IDS.site_internet, CHANNEL_IDS.linkme])
          .eq('is_active', true),
        supabase
          .from('price_list_items')
          .select('product_id, price_ht, price_lists!inner(priority)')
          .in('product_id', ids)
          .eq('is_active', true)
          .eq('price_lists.is_active', true)
          .eq('price_lists.list_type', 'base'),
      ]);

      if (pricingResult.error) throw pricingResult.error;
      if (baseResult.error) throw baseResult.error;

      const map = new Map<string, ProductChannelPrices>();
      const ensure = (productId: string): ProductChannelPrices => {
        const existing = map.get(productId);
        if (existing) return existing;
        const created = { ...EMPTY };
        map.set(productId, created);
        return created;
      };

      // 1. Prix explicites par canal : ils gagnent sur le repli.
      for (const raw of (pricingResult.data ?? []) as ChannelPricingRow[]) {
        const entry = ensure(raw.product_id);
        const price = toNumber(raw.custom_price_ht);

        if (raw.channel_id === CHANNEL_IDS.site_internet) {
          entry.siteEcoParticipationHt = toNumber(raw.eco_participation_amount);
          if (price != null && price > 0) {
            entry.sitePriceHt = price;
            entry.sitePriceSource = 'channel_pricing';
            entry.sitePriceValidatedAt = raw.price_validated_at;
          }
        } else if (raw.channel_id === CHANNEL_IDS.linkme) {
          if (price != null && price > 0) {
            entry.linkmePriceHt = price;
            entry.linkmePriceValidatedAt = raw.price_validated_at;
          }
        }
      }

      // 2. Repli sur la liste de base, uniquement là où le canal ne dit rien.
      //    À priorité égale on garde la première rencontrée, comme le fait
      //    `ORDER BY pl.priority ASC LIMIT 1` côté base.
      const bestBase = new Map<string, { price: number; priority: number }>();
      for (const raw of (baseResult.data ?? []) as BasePriceRow[]) {
        const price = toNumber(raw.price_ht);
        if (price == null || price <= 0) continue;
        const priority = priorityOf(raw);
        const current = bestBase.get(raw.product_id);
        if (current == null || priority < current.priority) {
          bestBase.set(raw.product_id, { price, priority });
        }
      }

      for (const [productId, base] of bestBase) {
        const entry = ensure(productId);
        if (entry.sitePriceSource === 'none') {
          entry.sitePriceHt = base.price;
          entry.sitePriceSource = 'base_price';
          // Un prix de repli n'a par définition jamais été validé par personne.
          entry.sitePriceValidatedAt = null;
        }
      }

      return map;
    },
  });

  return {
    pricesMap: query.data ?? (new Map() as ChannelPricesMap),
    /** Prix d'un produit, jamais undefined : un produit sans prix renvoie des null. */
    getPrices: (productId: string): ProductChannelPrices =>
      query.data?.get(productId) ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
