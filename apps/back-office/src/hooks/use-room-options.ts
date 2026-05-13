'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

export type RoomOption = Database['public']['Tables']['room_options']['Row'];
export type RoomOptionInsert =
  Database['public']['Tables']['room_options']['Insert'];
export type RoomOptionUpdate =
  Database['public']['Tables']['room_options']['Update'];

const QUERY_KEY = ['room-options'] as const;
const STALE_TIME_MS = 2 * 60 * 1000;

async function fetchRoomOptions(): Promise<RoomOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_options')
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw new Error(`[useRoomOptions] fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchActiveRoomOptions(): Promise<RoomOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_options')
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error)
    throw new Error(`[useRoomOptions] fetch active failed: ${error.message}`);
  return data ?? [];
}

async function createRoomOption(input: RoomOptionInsert): Promise<RoomOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_options')
    .insert(input)
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useRoomOptions] create failed: ${error.message}`);
  if (!data) throw new Error('[useRoomOptions] create returned no data');
  return data;
}

async function updateRoomOption(
  id: string,
  updates: RoomOptionUpdate
): Promise<RoomOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('room_options')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, value, label, is_active, sort_order, created_at, updated_at')
    .single();

  if (error)
    throw new Error(`[useRoomOptions] update failed: ${error.message}`);
  if (!data) throw new Error('[useRoomOptions] update returned no data');
  return data;
}

async function deactivateRoomOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('room_options')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error)
    throw new Error(`[useRoomOptions] deactivate failed: ${error.message}`);
}

export function useRoomOptions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchRoomOptions,
    staleTime: STALE_TIME_MS,
  });

  const createMutation = useMutation({
    mutationFn: createRoomOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RoomOptionUpdate }) =>
      updateRoomOption(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateRoomOption,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    roomOptions: data ?? [],
    isLoading,
    error: error ?? null,
    createRoomOption: createMutation.mutateAsync,
    updateRoomOption: (id: string, updates: RoomOptionUpdate) =>
      updateMutation.mutateAsync({ id, updates }),
    deactivateRoomOption: deactivateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  };
}

/** Hook for dropdowns in forms — only active options */
export function useActiveRoomOptions() {
  const { data, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: fetchActiveRoomOptions,
    staleTime: STALE_TIME_MS,
  });

  return {
    roomOptions: data ?? [],
    isLoading,
    error: error ?? null,
  };
}
