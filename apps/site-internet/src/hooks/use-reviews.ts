import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  created_at: string;
}

interface SubmitReviewInput {
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title?: string;
  comment?: string;
}

export function useProductReviews(productId: string | undefined) {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_reviews')
        .select(
          'id, product_id, user_id, author_name, rating, title, comment, status, created_at'
        )
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useProductReviews] fetch error:', error);
        throw error;
      }

      return (data ?? []) as ProductReview[];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewStats(productId: string | undefined) {
  const { data: reviews = [] } = useProductReviews(productId);

  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return { average: Math.round(average * 10) / 10, count };
}

export function useSubmitReview() {
  const supabase = createUntypedClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: input.product_id,
        user_id: input.user_id,
        author_name: input.author_name,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
      });

      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['product-reviews', variables.product_id],
      });
    },
    onError: (error: unknown) => {
      console.error('[useSubmitReview] error:', error);
    },
  });
}
