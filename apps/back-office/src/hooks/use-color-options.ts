'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export type ColorOption = Database['public']['Tables']['color_options']['Row'];
export type ColorOptionInsert =
  Database['public']['Tables']['color_options']['Insert'];
export type ColorOptionUpdate =
  Database['public']['Tables']['color_options']['Update'];

const QUERY_KEY = ['color-options'] as const;
const STALE_TIME_MS = 2 * 60 * 1000;

async function fetchColorOptions(): Promise<ColorOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('color_options')
    .select('id, name, hex_code, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error)
    throw new Error(`[useColorOptions] fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchActiveColorOptions(): Promise<ColorOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('color_options')
    .select('id, name, hex_code, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error)
    throw new Error(`[useColorOptions] fetch active failed: ${error.message}`);
  return data ?? [];
}

async function createColorOption(
  input: ColorOptionInsert
): Promise<ColorOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('color_options')
    .insert(input)
    .select('id, name, hex_code, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useColorOptions] create failed: ${error.message}`);
  if (!data) throw new Error('[useColorOptions] create returned no data');
  return data;
}

async function updateColorOption(
  id: string,
  updates: ColorOptionUpdate
): Promise<ColorOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('color_options')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, hex_code, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useColorOptions] update failed: ${error.message}`);
  if (!data) throw new Error('[useColorOptions] update returned no data');
  return data;
}

async function deactivateColorOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('color_options')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error)
    throw new Error(`[useColorOptions] deactivate failed: ${error.message}`);
}

export function useColorOptions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchColorOptions,
    staleTime: STALE_TIME_MS,
  });

  const createMutation = useMutation({
    mutationFn: createColorOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ColorOptionUpdate }) =>
      updateColorOption(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateColorOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    colorOptions: data ?? [],
    isLoading,
    error: error ?? null,
    createColorOption: createMutation.mutateAsync,
    updateColorOption: (id: string, updates: ColorOptionUpdate) =>
      updateMutation.mutateAsync({ id, updates }),
    deactivateColorOption: deactivateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
}

/** Hook for dropdowns in forms — only active options */
export function useActiveColorOptions() {
  const { data, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: fetchActiveColorOptions,
    staleTime: STALE_TIME_MS,
  });

  return {
    colorOptions: data ?? [],
    isLoading,
    error: error ?? null,
  };
}
