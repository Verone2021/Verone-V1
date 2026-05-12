/**
 * Types locaux pour la table `articles` — non encore dans supabase.ts généré.
 * À supprimer quand la prochaine regen types inclura la table.
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
export type ArticleCategory =
  | 'Inspiration'
  | 'Guide'
  | 'Tendance'
  | 'Manifeste'
  | 'Matière';
