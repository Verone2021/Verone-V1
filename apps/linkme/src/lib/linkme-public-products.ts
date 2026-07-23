/**
 * Récupération des produits LinkMe en vitrine publique (homepage + catalogue).
 *
 * Lit la vue `linkme_public_products` (lecture anonyme) via un client Supabase
 * anonyme SANS cookies, pour garder les pages en rendu statique (SSG/ISR).
 * Les produits proviennent des drapeaux par canal `channel_pricing`
 * (is_public_showcase / is_featured) — voir migration LINKME-DB-001.
 *
 * La vue expose UNIQUEMENT des champs publics (nom, slug, catégorie, image,
 * description, méta). AUCUN prix, coût ou marge — réservés aux comptes connectés.
 *
 * @module lib/linkme-public-products
 * @since 2026-06-05 - LINKME-DB-001
 * @updated 2026-07-23 - LM-PUB-CATALOG-001 : description + slug + cloudflareImageId,
 *                       lecture complète (catalogue) + lecture par slug (fiche produit).
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';

/** Produit tel qu'affiché dans une grille (carte, sans prix). */
export interface PublicProduct {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  imageUrl: string | null;
  cloudflareImageId: string | null;
  isFeatured: boolean;
}

/** Produit complet pour la fiche produit publique (avec description). */
export interface PublicProductDetail extends PublicProduct {
  description: string | null;
  metaDescription: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Clé anon (publique par design). Variable serveur si dispo, sinon la publique.
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

function getClient(): ReturnType<typeof createClient<Database>> | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/** Colonnes de carte (sans prix). Sélection explicite — jamais `select('*')`. */
const CARD_COLUMNS =
  'id, name, slug, category, image_url, cloudflare_image_id, is_featured';

/**
 * Retourne les N premiers produits de la vitrine publique LinkMe
 * (mis en avant d'abord). Utilisé par l'aperçu de la page d'accueil.
 * Retourne [] en cas d'erreur.
 */
export async function getLinkmePublicProducts(
  limit = 8
): Promise<PublicProduct[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('linkme_public_products')
      .select(CARD_COLUMNS)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error || !data) {
      if (error) console.error('[linkme-public-products] view error:', error);
      return [];
    }

    return data.map(mapCard);
  } catch (err) {
    console.error('[linkme-public-products] fetch failed:', err);
    return [];
  }
}

/**
 * Retourne TOUS les produits cochés en vitrine publique (sans limite),
 * mis en avant d'abord puis par ordre d'affichage. Utilisé par la page
 * catalogue publique `/produits`. Retourne [] en cas d'erreur ou si aucun
 * produit n'est coché (la page affiche alors son état vide).
 */
export async function getAllLinkmePublicProducts(): Promise<PublicProduct[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('linkme_public_products')
      .select(CARD_COLUMNS)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) {
      if (error) console.error('[linkme-public-products] view error:', error);
      return [];
    }

    return data.map(mapCard);
  } catch (err) {
    console.error('[linkme-public-products] fetch all failed:', err);
    return [];
  }
}

/**
 * Retourne le détail d'un produit public par son slug, ou null s'il n'existe
 * pas / n'est plus coché en vitrine. Utilisé par la fiche `/produits/[slug]`.
 */
export async function getLinkmePublicProductBySlug(
  slug: string
): Promise<PublicProductDetail | null> {
  const supabase = getClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('linkme_public_products')
      .select(`${CARD_COLUMNS}, description, meta_description`)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('[linkme-public-products] slug error:', error);
      return null;
    }

    return {
      ...mapCard(data),
      description: data.description,
      metaDescription: data.meta_description,
    };
  } catch (err) {
    console.error('[linkme-public-products] fetch by slug failed:', err);
    return null;
  }
}

interface CardRow {
  id: string | null;
  name: string | null;
  slug: string | null;
  category: string | null;
  image_url: string | null;
  cloudflare_image_id: string | null;
  is_featured: boolean | null;
}

function mapCard(row: CardRow): PublicProduct {
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    slug: row.slug,
    category: row.category,
    imageUrl: row.image_url,
    cloudflareImageId: row.cloudflare_image_id,
    isFeatured: row.is_featured ?? false,
  };
}
