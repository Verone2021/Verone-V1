import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Untyped Supabase client for tables not yet in generated types
 * (wishlist_items, product_reviews, site_content)
 *
 * Use this until types are regenerated after migrations.
 */
export function createUntypedClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
