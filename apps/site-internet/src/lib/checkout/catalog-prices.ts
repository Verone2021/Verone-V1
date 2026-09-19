/**
 * Prix de référence du catalogue site internet — lus en base, jamais reçus.
 *
 * Source unique : la fonction `get_site_internet_products`, exactement celle
 * qui alimente la fiche produit et le catalogue. Utiliser la même source des
 * deux côtés garantit que le prix affiché et le prix encaissé ne peuvent pas
 * diverger : s'ils divergent, c'est que la requête a été modifiée en chemin.
 *
 * La fonction ne renvoie QUE les produits réellement vendables en ligne
 * (publiés, avec un prix > 0 et au moins une image). Un `product_id` absent
 * de la réponse est donc soit inconnu, soit non vendable : dans les deux cas
 * la commande doit être refusée.
 *
 * Sprint SI-CHECKOUT-PRICE-001 — 2026-09-19
 */

import { createClient } from '@supabase/supabase-js';

/** Marque du site public. La fonction SQL exige un slug de marque connu. */
const SITE_BRAND_SLUG = 'verone';

export interface CatalogPrice {
  product_id: string;
  /** Libellé officiel : c'est lui qui part sur la facture Stripe. */
  name: string;
  price_ttc: number;
  eco_participation: number;
  assembly_price: number;
  requires_assembly: boolean;
}

interface CatalogRow {
  product_id: string;
  name: string | null;
  price_ttc: number | string | null;
  eco_participation_amount: number | string | null;
  assembly_price: number | string | null;
  requires_assembly: boolean | null;
}

function toNumber(value: number | string | null): number {
  if (value === null) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Lit en base le prix de référence des produits demandés.
 *
 * @returns une table indexée par `product_id`. Les identifiants inconnus ou
 *          non vendables en ligne en sont simplement absents.
 * @throws  si la base est injoignable — l'appelant doit alors refuser la
 *          commande plutôt que de retomber sur les valeurs du navigateur.
 */
export async function fetchCatalogPrices(
  productIds: string[],
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<Map<string, CatalogPrice>> {
  const uniqueIds = Array.from(new Set(productIds));
  if (uniqueIds.length === 0) return new Map();

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .rpc('get_site_internet_products', { p_brand_slug: SITE_BRAND_SLUG })
    .select(
      'product_id, name, price_ttc, eco_participation_amount, assembly_price, requires_assembly'
    )
    .in('product_id', uniqueIds);

  if (error) {
    throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  }

  const rows = (data ?? []) as CatalogRow[];
  const prices = new Map<string, CatalogPrice>();

  for (const row of rows) {
    prices.set(row.product_id, {
      product_id: row.product_id,
      name: row.name ?? '',
      price_ttc: toNumber(row.price_ttc),
      eco_participation: toNumber(row.eco_participation_amount),
      assembly_price: toNumber(row.assembly_price),
      requires_assembly: row.requires_assembly === true,
    });
  }

  return prices;
}
