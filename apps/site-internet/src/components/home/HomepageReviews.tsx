'use client';

import { useQuery } from '@tanstack/react-query';

import { Star } from 'lucide-react';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface HomepageReview {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product_name: string | null;
}

function useLatestReviews() {
  const supabase = createUntypedClient();

  return useQuery({
    queryKey: ['homepage-reviews'],
    queryFn: async (): Promise<HomepageReview[]> => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(
          'id, author_name, rating, comment, created_at, products!inner(name)'
        )
        .eq('status', 'approved')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('[useLatestReviews] fetch error:', error);
        return [];
      }

      return ((data ?? []) as Record<string, unknown>[]).map(row => ({
        id: row.id as string,
        author_name: row.author_name as string,
        rating: row.rating as number,
        comment: row.comment as string | null,
        created_at: row.created_at as string,
        product_name: (row.products as Record<string, unknown>)?.name as
          | string
          | null,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const INITIAL_COLORS = [
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800',
];

export function HomepageReviews() {
  const { data: reviews = [] } = useLatestReviews();

  if (reviews.length === 0) return null;

  return (
    <section className="bg-verone-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-3">
            Ils nous font confiance
          </p>
          <h2 className="font-playfair text-4xl font-bold text-verone-black">
            Ce que disent nos clients
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-verone-white border border-verone-gray-200 p-6 lg:p-8"
            >
              {/* Header: avatar + name + stars */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${INITIAL_COLORS[index % INITIAL_COLORS.length]}`}
                  >
                    {getInitial(review.author_name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-verone-black">
                      {review.author_name}
                    </p>
                    <p className="text-xs text-verone-gray-400">
                      {formatDate(review.created_at)}
                      {review.product_name && ` · ${review.product_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-verone-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-verone-gray-600 leading-relaxed line-clamp-4">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
