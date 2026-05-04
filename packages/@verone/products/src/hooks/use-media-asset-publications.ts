'use client';

import { useCallback, useEffect, useState } from 'react';

import logger from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/utils/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export type MediaAssetPublicationChannel =
  | 'site_verone'
  | 'site_bohemia'
  | 'site_solar'
  | 'site_flos'
  | 'meta'
  | 'pinterest'
  | 'tiktok'
  | 'linkedin'
  | 'newsletter'
  | 'ads'
  | 'blog'
  | 'other';

export const PUBLICATION_CHANNELS: ReadonlyArray<{
  value: MediaAssetPublicationChannel;
  label: string;
}> = [
  { value: 'site_verone', label: 'Site Vérone' },
  { value: 'site_bohemia', label: 'Site Bohemia' },
  { value: 'site_solar', label: 'Site Solar' },
  { value: 'site_flos', label: 'Site Flos' },
  { value: 'meta', label: 'Meta (FB / Instagram)' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'ads', label: 'Ads payantes' },
  { value: 'blog', label: 'Blog' },
  { value: 'other', label: 'Autre' },
];

export type MediaAssetPublication =
  Database['public']['Tables']['media_asset_publications']['Row'];

export interface AddPublicationInput {
  channel: MediaAssetPublicationChannel;
  externalUrl?: string | null;
  notes?: string | null;
  publishedAt?: string;
}

interface UseMediaAssetPublicationsReturn {
  publications: MediaAssetPublication[];
  loading: boolean;
  error: string | null;
  addPublication: (
    input: AddPublicationInput
  ) => Promise<MediaAssetPublication>;
  unpublish: (publicationId: string) => Promise<void>;
  removePublication: (publicationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

const SELECT_COLS =
  'id, asset_id, channel, external_url, notes, published_at, unpublished_at, created_by, created_at, updated_at';

export function useMediaAssetPublications(
  assetId: string | null
): UseMediaAssetPublicationsReturn {
  const supabase = createClient();
  const [publications, setPublications] = useState<MediaAssetPublication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublications = useCallback(async () => {
    if (!assetId) {
      setPublications([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('media_asset_publications')
        .select(SELECT_COLS)
        .eq('asset_id', assetId)
        .order('published_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPublications((data ?? []) as unknown as MediaAssetPublication[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur publications';
      logger.error('fetch publications failed', err as Error, {
        operation: 'fetch_media_asset_publications',
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [assetId, supabase]);

  useEffect(() => {
    void fetchPublications();
  }, [fetchPublications]);

  const addPublication = useCallback(
    async (input: AddPublicationInput): Promise<MediaAssetPublication> => {
      if (!assetId) throw new Error('Aucune image sélectionnée');
      const { data, error: insertError } = await supabase
        .from('media_asset_publications')
        .insert({
          asset_id: assetId,
          channel: input.channel,
          external_url: input.externalUrl ?? null,
          notes: input.notes ?? null,
          published_at: input.publishedAt ?? new Date().toISOString(),
        })
        .select(SELECT_COLS)
        .single();

      if (insertError) throw insertError;
      const row = data as unknown as MediaAssetPublication;
      setPublications(prev => [row, ...prev]);
      return row;
    },
    [assetId, supabase]
  );

  const unpublish = useCallback(
    async (publicationId: string): Promise<void> => {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('media_asset_publications')
        .update({ unpublished_at: now })
        .eq('id', publicationId);
      if (updateError) throw updateError;
      setPublications(prev =>
        prev.map(p =>
          p.id === publicationId ? { ...p, unpublished_at: now } : p
        )
      );
    },
    [supabase]
  );

  const removePublication = useCallback(
    async (publicationId: string): Promise<void> => {
      const { error: deleteError } = await supabase
        .from('media_asset_publications')
        .delete()
        .eq('id', publicationId);
      if (deleteError) throw deleteError;
      setPublications(prev => prev.filter(p => p.id !== publicationId));
    },
    [supabase]
  );

  return {
    publications,
    loading,
    error,
    addPublication,
    unpublish,
    removePublication,
    refetch: fetchPublications,
  };
}

// ============================================================================
// HELPER : compteur publications par asset (utile pour les badges DAM)
// ============================================================================

export interface PublicationCount {
  asset_id: string;
  active_count: number;
  total_count: number;
}

export async function fetchPublicationCounts(
  assetIds: string[]
): Promise<Map<string, PublicationCount>> {
  const result = new Map<string, PublicationCount>();
  if (assetIds.length === 0) return result;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('media_asset_publications')
    .select('asset_id, unpublished_at')
    .in('asset_id', assetIds);

  if (error) {
    logger.error('fetch publication counts failed', error, {
      operation: 'fetch_publication_counts',
    });
    return result;
  }

  for (const row of data ?? []) {
    const existing = result.get(row.asset_id) ?? {
      asset_id: row.asset_id,
      active_count: 0,
      total_count: 0,
    };
    existing.total_count += 1;
    if (!row.unpublished_at) existing.active_count += 1;
    result.set(row.asset_id, existing);
  }
  return result;
}
