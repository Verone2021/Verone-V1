'use client';

/**
 * Hook : useProductCostBasisBatch
 *
 * Charge en UNE requête, pour plusieurs produits, ce qu'il faut pour juger un
 * prix de vente : le prix d'achat, le prix de revient (manuel ou moyenne des
 * achats), l'éco-participation, et les coefficients conseillés des trois
 * niveaux du catalogue (sous-catégorie, catégorie, famille).
 *
 * Existe parce que `get_site_internet_products()` ne renvoie rien de tout ça —
 * et qu'on ne touche PAS à cette fonction : c'est elle qui décide ce que la
 * boutique publique affiche. La liste du canal Site Internet lit donc ces
 * colonnes à côté, sans rien changer au chemin du site.
 *
 * Sprint : BO-PRICING-GOV-001.
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { coefficientHierarchyOf } from '../utils/pricing-view';
import type { CoefficientHierarchy } from '../utils/pricing-governance';

export interface ProductCostBasis {
  costPrice: number | null;
  costNetAvg: number | null;
  costNetManual: number | null;
  ecoTaxHt: number | null;
  isPublishedOnline: boolean;
  hierarchy: CoefficientHierarchy | null;
}

const EMPTY: ProductCostBasis = {
  costPrice: null,
  costNetAvg: null,
  costNetManual: null,
  ecoTaxHt: null,
  isPublishedOnline: false,
  hierarchy: null,
};

interface RawLevel {
  retail_coefficient: number | null;
  wholesale_coefficient: number | null;
}

interface RawRow {
  id: string;
  cost_price: number | null;
  cost_net_avg: number | null;
  cost_net_manual: number | null;
  eco_tax_default: number | null;
  is_published_online: boolean | null;
  subcategories:
    | (RawLevel & {
        category: (RawLevel & { family: RawLevel | null }) | null;
      })
    | null;
}

/** Colonnes explicites : jamais `select('*')`. */
const COST_BASIS_SELECT = `
  id, cost_price, cost_net_avg, cost_net_manual, eco_tax_default, is_published_online,
  subcategories!subcategory_id(
    retail_coefficient, wholesale_coefficient,
    category:categories!category_id(
      retail_coefficient, wholesale_coefficient,
      family:families!family_id(retail_coefficient, wholesale_coefficient)
    )
  )
`;

function toNumber(value: number | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function useProductCostBasisBatch(productIds: readonly string[]) {
  const supabase = createClient();

  // Clé stable : l'ordre d'affichage ne doit pas provoquer un rechargement.
  const ids = Array.from(
    new Set(productIds.filter(id => id && id.trim() !== ''))
  );
  ids.sort();

  const query = useQuery<ReadonlyMap<string, ProductCostBasis>>({
    queryKey: ['product-cost-basis-batch', ids],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(COST_BASIS_SELECT)
        .in('id', ids);

      if (error) throw error;

      const map = new Map<string, ProductCostBasis>();
      for (const raw of (data ?? []) as unknown as RawRow[]) {
        const subcategory = raw.subcategories ?? null;
        const category = subcategory?.category ?? null;
        const family = category?.family ?? null;

        map.set(raw.id, {
          costPrice: toNumber(raw.cost_price),
          costNetAvg: toNumber(raw.cost_net_avg),
          costNetManual: toNumber(raw.cost_net_manual),
          ecoTaxHt: toNumber(raw.eco_tax_default),
          isPublishedOnline: raw.is_published_online === true,
          hierarchy: coefficientHierarchyOf({ subcategory, category, family }),
        });
      }
      return map;
    },
  });

  return {
    /** Base de coût d'un produit, jamais undefined. */
    getCostBasis: (productId: string): ProductCostBasis =>
      query.data?.get(productId) ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
