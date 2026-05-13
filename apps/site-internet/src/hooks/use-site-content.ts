import { useQuery } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface SiteContentRow {
  content_key: string;
  content_value: Record<string, unknown>;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string | null;
}

export interface ReassuranceContent {
  items: Array<{
    title: string;
    description: string;
  }>;
}

export interface BannerContent {
  enabled: boolean;
  text: string;
  link: string | null;
  bg_color: string;
  text_color: string;
}

export interface AboutHeroContent {
  title: string;
  subtitle: string;
  image_url: string | null;
}

export interface AboutStoryContent {
  paragraphs: string[];
}

export function useSiteContent<T>(contentKey: string) {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['site-content', contentKey],
    queryFn: async (): Promise<T | null> => {
      // maybeSingle pour gérer le cas où la clé n'existe pas encore
      // (ex: about_hero/about_story créés à la volée depuis le BO).
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content_value')
        .eq('content_key', contentKey)
        .maybeSingle();

      if (error) {
        console.error(`[useSiteContent] fetch ${contentKey} error:`, error);
        return null;
      }

      return (data as SiteContentRow | null)?.content_value as T | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHeroContent() {
  return useSiteContent<HeroContent>('hero');
}

export function useReassuranceContent() {
  return useSiteContent<ReassuranceContent>('reassurance');
}

export function useBannerContent() {
  return useSiteContent<BannerContent>('banner');
}

export function useAboutHero() {
  return useSiteContent<AboutHeroContent>('about_hero');
}

export function useAboutStory() {
  return useSiteContent<AboutStoryContent>('about_story');
}

/**
 * Résout une valeur d'image qui peut être soit une URL complète,
 * soit un ID/path Cloudflare (sans domaine).
 */
export function resolveImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const cleaned = value.replace(/^\/+/, '').replace(/\/public$/, '');
  return `https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/${cleaned}/public`;
}
