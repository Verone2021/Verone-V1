/**
 * Requêtes Supabase pour les articles du journal.
 * Server-side uniquement (Server Components + generateStaticParams).
 *
 * Utilise un client non typé car la table `articles` n'est pas encore
 * dans le fichier de types généré (ajout récent — migration Phase A).
 */

import { createClient } from '@supabase/supabase-js';

import type { Article } from './article-types';

// Colonnes sélectionnées — jamais select('*')
const ARTICLE_COLUMNS = [
  'id',
  'slug',
  'title',
  'subtitle',
  'excerpt',
  'body_markdown',
  'cover_image_url',
  'cover_image_alt',
  'category',
  'tags',
  'is_featured',
  'author_name',
  'author_role',
  'author_avatar_url',
  'reading_time_minutes',
  'word_count',
  'status',
  'published_at',
  'meta_title',
  'meta_description',
  'canonical_url',
  'og_image_url',
  'og_image_alt',
  'og_title',
  'og_description',
  'twitter_card',
  'robots_index',
  'robots_follow',
  'related_article_ids',
  'featured_product_ids',
  'view_count',
  'locale',
].join(', ');

const ARTICLE_CARD_COLUMNS = [
  'id',
  'slug',
  'title',
  'excerpt',
  'cover_image_url',
  'cover_image_alt',
  'category',
  'tags',
  'is_featured',
  'reading_time_minutes',
  'published_at',
  'author_name',
].join(', ');

/** Client non typé — la table articles n'est pas encore dans Database */
function getUntypedClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getPublishedArticles(params?: {
  category?: string;
}): Promise<Article[]> {
  const supabase = getUntypedClient();

  let query = supabase
    .from('articles')
    .select(ARTICLE_CARD_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (params?.category && params.category !== 'Tous') {
    query = query.eq('category', params.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[article-queries] getPublishedArticles error:', error);
    return [];
  }

  return (data ?? []) as unknown as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getUntypedClient();

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if ((error as { code?: string }).code !== 'PGRST116') {
      console.error('[article-queries] getArticleBySlug error:', error);
    }
    return null;
  }

  return data as unknown as Article;
}

export async function getRelatedArticles(params: {
  relatedIds: string[];
  currentId: string;
  limit?: number;
}): Promise<Article[]> {
  if (params.relatedIds.length === 0) return [];

  const supabase = getUntypedClient();

  const ids = params.relatedIds
    .filter(id => id !== params.currentId)
    .slice(0, params.limit ?? 3);

  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_CARD_COLUMNS)
    .in('id', ids)
    .eq('status', 'published')
    .limit(params.limit ?? 3);

  if (error) {
    console.error('[article-queries] getRelatedArticles error:', error);
    return [];
  }

  return (data ?? []) as unknown as Article[];
}
