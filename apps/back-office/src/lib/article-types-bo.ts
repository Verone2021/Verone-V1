/**
 * Types locaux pour la table `articles` — back-office.
 * Miroir de apps/site-internet/src/lib/article-types.ts.
 * Mutualisable via un package si la table est ajoutée aux types générés.
 */

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body_markdown: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  author_name: string;
  author_role: string | null;
  author_avatar_url: string | null;
  reading_time_minutes: number;
  word_count: number | null;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  og_image_alt: string | null;
  og_title: string | null;
  og_description: string | null;
  twitter_card: string;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string;
  related_article_ids: string[];
  featured_product_ids: string[];
  view_count: number;
  share_count: number;
  last_viewed_at: string | null;
  locale: string;
  translation_group_id: string | null;
}

export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export const ARTICLE_CATEGORIES = [
  'Inspiration',
  'Guide',
  'Tendance',
  'Manifeste',
  'Matière',
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export interface ArticleFormData {
  title: string;
  subtitle: string;
  excerpt: string;
  body_markdown: string;
  slug: string;
  cover_image_url: string;
  cover_image_alt: string;
  og_image_url: string;
  og_image_alt: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  focus_keyword: string;
  category: ArticleCategory | '';
  tags: string[];
  is_featured: boolean;
  featured_product_ids: string[];
  related_article_ids: string[];
  status: ArticleStatus;
  scheduled_at: string;
  robots_index: boolean;
  robots_follow: boolean;
}
