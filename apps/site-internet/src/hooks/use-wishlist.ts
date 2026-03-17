import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
}

export function useWishlist(userId: string | undefined) {
  const supabase = createUntypedClient();
  const queryClient = useQueryClient();

  const { data: items = [], ...query } = useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, product_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useWishlist] fetch error:', error);
        throw error;
      }

      return (data ?? []) as WishlistItem[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: userId, product_id: productId });

      if (error) {
        // Duplicate is ok — already in wishlist
        if (error.code === '23505') return;
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist', userId] });
    },
    onError: (error: unknown) => {
      console.error('[useWishlist] add error:', error);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist', userId] });
    },
    onError: (error: unknown) => {
      console.error('[useWishlist] remove error:', error);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      const isInWishlist = items.some(item => item.product_id === productId);
      if (isInWishlist) {
        await removeMutation.mutateAsync(productId);
      } else {
        await addMutation.mutateAsync(productId);
      }
    },
  });

  const isInWishlist = (productId: string) =>
    items.some(item => item.product_id === productId);

  return {
    items,
    itemCount: items.length,
    isInWishlist,
    add: addMutation.mutate,
    remove: removeMutation.mutate,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    ...query,
  };
}
