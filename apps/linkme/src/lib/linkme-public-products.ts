/**
 * Récupération des produits LinkMe en vitrine publique (homepage + catalogue).
 *
 * Lit la vue `linkme_public_products` (lecture anonyme) via un client Supabase
 * anonyme SANS cookies, pour garder la homepage en rendu statique (SSG/ISR).
 * Les produits proviennent des drapeaux par canal `channel_pricing`
 * (is_public_showcase / is_featured) — voir migration LINKME-DB-001.
 *
 * @module lib/linkme-public-products
 * @since 2026-06-05 - LINKME-DB-001
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';

export interface PublicProduct {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Clé anon (publique par design). Variable serveur si dispo, sinon la publique.
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

/**
 * Retourne les N premiers produits de la vitrine publique LinkMe
 * (mis en avant d'abord). Retourne [] en cas d'erreur (la homepage
 * affiche alors ses exemples par défaut).
 */
export async function getLinkmePublicProducts(
  limit = 8
): Promise<PublicProduct[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('linkme_public_products')
      .select('id, name, category, image_url, is_featured')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error || !data) {
      if (error) console.error('[linkme-public-products] view error:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id ?? '',
      name: row.name ?? '',
      category: row.category,
      imageUrl: row.image_url,
      isFeatured: row.is_featured ?? false,
    }));
  } catch (err) {
    console.error('[linkme-public-products] fetch failed:', err);
    return [];
  }
}
