'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export type ScheduledPublicationStatus =
  | 'pending'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export interface ScheduledPublicationRow {
  id: string;
  asset_id: string;
  channel_code: string;
  scheduled_at: string;
  caption: string | null;
  hashtags: string[] | null;
  status: ScheduledPublicationStatus;
  published_at: string | null;
  external_url: string | null;
  error_message: string | null;
  retry_count: number;
  asset_public_url: string;
  asset_filename: string;
  asset_alt_text: string | null;
  product_id: string | null;
}

export interface UseScheduledPublicationsOptions {
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export function useScheduledPublications({
  startDate,
  endDate,
  enabled = true,
}: UseScheduledPublicationsOptions) {
  return useQuery<ScheduledPublicationRow[]>({
    queryKey: ['scheduled-publications', startDate, endDate],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_scheduled_publications_calendar' as never,
        {
          p_start_date: startDate,
          p_end_date: endDate,
        } as never
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as ScheduledPublicationRow[];
    },
    enabled,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  });
}

export interface CreateScheduledPublicationInput {
  assetId: string;
  channelCode: string;
  scheduledAt: string;
  caption?: string;
  hashtags?: string[];
}

export function useCreateScheduledPublication() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, CreateScheduledPublicationInput>({
    mutationFn: async input => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('scheduled_publications')
        .insert({
          asset_id: input.assetId,
          channel_code: input.channelCode,
          scheduled_at: input.scheduledAt,
          caption: input.caption ?? null,
          hashtags: input.hashtags ?? null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      return { id: data.id };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['scheduled-publications'],
      });
    },
  });
}

export function useCancelScheduledPublication() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('scheduled_publications')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['scheduled-publications'],
      });
    },
  });
}
