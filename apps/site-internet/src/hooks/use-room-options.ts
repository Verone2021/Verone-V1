import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

export interface RoomOption {
  id: string;
  value: string;
  label: string;
  sort_order: number;
}

/**
 * Hook public site-internet : pièces actives du vocabulaire contrôlé.
 * Lit room_options où is_active = true (RLS anon read).
 */
export function useRoomOptions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['site-room-options'],
    queryFn: async (): Promise<RoomOption[]> => {
      const { data, error } = await supabase
        .from('room_options')
        .select('id, value, label, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });

      if (error) {
        console.error('[useRoomOptions] fetch failed:', error);
        throw new Error(`Failed to fetch room options: ${error.message}`);
      }

      return (data ?? []) as RoomOption[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
