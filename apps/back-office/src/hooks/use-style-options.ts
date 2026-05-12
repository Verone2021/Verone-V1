'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export type StyleOption = Database['public']['Tables']['style_options']['Row'];
export type StyleOptionInsert =
  Database['public']['Tables']['style_options']['Insert'];
export type StyleOptionUpdate =
  Database['public']['Tables']['style_options']['Update'];

const QUERY_KEY = ['style-options'] as const;
const STALE_TIME_MS = 2 * 60 * 1000;

async function fetchStyleOptions(): Promise<StyleOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('style_options')
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error)
    throw new Error(`[useStyleOptions] fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchActiveStyleOptions(): Promise<StyleOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('style_options')
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error)
    throw new Error(`[useStyleOptions] fetch active failed: ${error.message}`);
  return data ?? [];
}

async function createStyleOption(
  input: StyleOptionInsert
): Promise<StyleOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('style_options')
    .insert(input)
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useStyleOptions] create failed: ${error.message}`);
  if (!data) throw new Error('[useStyleOptions] create returned no data');
  return data;
}

async function updateStyleOption(
  id: string,
  updates: StyleOptionUpdate
): Promise<StyleOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('style_options')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useStyleOptions] update failed: ${error.message}`);
  if (!data) throw new Error('[useStyleOptions] update returned no data');
  return data;
}

async function deactivateStyleOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('style_options')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error)
    throw new Error(`[useStyleOptions] deactivate failed: ${error.message}`);
}

export function useStyleOptions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchStyleOptions,
    staleTime: STALE_TIME_MS,
  });

  const createMutation = useMutation({
    mutationFn: createStyleOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: StyleOptionUpdate }) =>
      updateStyleOption(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStyleOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    styleOptions: data ?? [],
    isLoading,
    error: error ?? null,
    createStyleOption: createMutation.mutateAsync,
    updateStyleOption: (id: string, updates: StyleOptionUpdate) =>
      updateMutation.mutateAsync({ id, updates }),
    deactivateStyleOption: deactivateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
}

/** Hook for dropdowns in forms — only active options */
export function useActiveStyleOptions() {
  const { data, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: fetchActiveStyleOptions,
    staleTime: STALE_TIME_MS,
  });

  return {
    styleOptions: data ?? [],
    isLoading,
    error: error ?? null,
  };
}
