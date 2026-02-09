/**
 * Enable Supabase Realtime for products table
 *
 * Context:
 * - Hook useProductsIncompleteCount (back-office) utilise Realtime
 * - Actuellement: CHANNEL_ERROR → fallback polling 60s
 * - Pattern: Identique à sales_orders (migration 20260203_001)
 *
 * Impact:
 * - Badge "Produits incomplets" se met à jour instantanément
 * - Élimine l'erreur console
 * - Cohérence avec autres hooks (orders, linkme, expeditions, stock-alerts)
 *
 * References:
 * - Hook: packages/@verone/notifications/src/hooks/use-products-incomplete-count.ts
 * - Similar: 20260203_001_enable_realtime_sales_orders.sql
 */

-- Add products table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Verify publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'products'
  ) THEN
    RAISE NOTICE '✅ products table added to supabase_realtime publication';
  ELSE
    RAISE EXCEPTION '❌ Failed to add products to publication';
  END IF;
END $$;
