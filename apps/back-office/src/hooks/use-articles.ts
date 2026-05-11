'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Article, ArticleFormData } from '@/lib/article-types-bo';

const QUERY_KEY = ['articles'] as const;
const STALE_TIME_MS = 30 * 1000;

const ARTICLE_COLUMNS = [
  'id',
  'slug',
  'title',
  'excerpt',
  'category',
  'status',
  'is_featured',
  'view_count',
  'reading_time_minutes',
  'published_at',
  'created_at',
  'updated_at',
  'tags',
].join(', ');

const ARTICLE_DETAIL_COLUMNS = [
  'id',
  'slug',
  'title',
  'subtitle',
  'excerpt',
  'body_markdown',
  'cover_image_url',
  'cover_image_alt',
  'og_image_url',
  'og_image_alt',
  'meta_title',
  'meta_description',
  'canonical_url',
  'og_title',
  'og_description',
  'twitter_card',
  'robots_index',
  'robots_follow',
  'category',
  'tags',
  'is_featured',
  'featured_product_ids',
  'related_article_ids',
  'status',
  'published_at',
  'scheduled_at',
  'view_count',
  'author_name',
  'author_role',
  'reading_time_minutes',
  'word_count',
  'created_at',
  'updated_at',
].join(', ');

/** Client non typé — table articles absente du schéma généré (migration récente) */
function getClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function fetchArticles(params?: {
  status?: string;
  category?: string;
}): Promise<Article[]> {
  const supabase = getClient();

  let query = supabase
    .from('articles')
    .select(ARTICLE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);

  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.category) {
    query = query.eq('category', params.category);
  }

  const { data, error } = await query;
  if (error)
    throw new Error(
      `Failed to fetch articles: ${(error as { message?: string }).message ?? String(error)}`
    );
  return (data ?? []) as unknown as Article[];
}

async function fetchArticleById(id: string): Promise<Article | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_DETAIL_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    const errWithCode = error as { code?: string; message?: string };
    if (errWithCode.code !== 'PGRST116')
      throw new Error(errWithCode.message ?? String(error));
    return null;
  }
  return data as unknown as Article;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createArticle(formData: ArticleFormData): Promise<Article> {
  const supabase = getClient();

  const payload = {
    ...buildPayload(formData),
    author_name: 'Vérone',
    author_role: 'Éditorial',
    locale: 'fr',
    twitter_card: 'summary_large_image',
    schema_type: 'BlogPosting',
  };

  const { data, error } = await supabase
    .from('articles')
    .insert(payload)
    .select('id, slug, title, status')
    .single();

  if (error)
    throw new Error((error as { message?: string }).message ?? String(error));
  return data as unknown as Article;
}

async function updateArticle(
  id: string,
  formData: ArticleFormData
): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('articles')
    .update(buildPayload(formData))
    .eq('id', id);

  if (error)
    throw new Error((error as { message?: string }).message ?? String(error));
}

async function archiveArticle(id: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id);

  if (error)
    throw new Error((error as { message?: string }).message ?? String(error));
}

function buildPayload(f: ArticleFormData): Record<string, unknown> {
  const now = new Date().toISOString();
  const isPublishing = f.status === 'published';

  return {
    title: f.title.trim(),
    subtitle: f.subtitle.trim() || null,
    excerpt: f.excerpt.trim(),
    body_markdown: f.body_markdown,
    slug: f.slug || slugify(f.title),
    cover_image_url: f.cover_image_url.trim() || null,
    cover_image_alt: f.cover_image_alt.trim(),
    og_image_url: f.og_image_url.trim() || null,
    og_image_alt: f.og_image_alt.trim() || null,
    meta_title: f.meta_title.trim() || null,
    meta_description: f.meta_description.trim() || null,
    canonical_url: f.canonical_url.trim() || null,
    category: f.category || 'Inspiration',
    tags: f.tags,
    is_featured: f.is_featured,
    featured_product_ids: f.featured_product_ids,
    related_article_ids: f.related_article_ids,
    status: f.status,
    published_at: isPublishing ? now : null,
    scheduled_at: f.status === 'scheduled' ? f.scheduled_at || null : null,
    robots_index: f.robots_index,
    robots_follow: f.robots_follow,
  };
}

// ─── Hooks React Query ────────────────────────────────────────────────────────

export function useArticles(params?: { status?: string; category?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => fetchArticles(params),
    staleTime: STALE_TIME_MS,
  });

  return { articles: data ?? [], isLoading, error: error ?? null };
}

export function useArticleById(id: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchArticleById(id) : null),
    enabled: Boolean(id),
    staleTime: STALE_TIME_MS,
  });

  return { article: data ?? null, isLoading, error: error ?? null };
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArticle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: ArticleFormData) => updateArticle(id, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveArticle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
