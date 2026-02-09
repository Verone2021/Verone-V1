/**
 * Fix REPLICA IDENTITY for products Realtime filtering
 *
 * Context:
 * - Hook filtre sur product_status: filter: 'product_status=eq.active'
 * - REPLICA IDENTITY DEFAULT transmet seulement id (PK) au WAL
 * - Supabase ne peut pas évaluer le filtre côté serveur
 * - Pattern: Identique à sales_orders (migration 20260208_001)
 *
 * Solution:
 * - REPLICA IDENTITY FULL transmet TOUTES les colonnes au WAL
 * - Permet l'évaluation des filtres côté serveur (product_status=eq.active)
 *
 * Impact WAL:
 * - Taille WAL augmente légèrement (acceptable pour table products)
 * - Writes peu fréquents sur products (catalogue, pas transactionnel)
 *
 * References:
 * - Hook: packages/@verone/notifications/src/hooks/use-products-incomplete-count.ts:158
 * - Similar: 20260208_001_fix_realtime_sales_orders_replica_identity.sql
 * - Doc: https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-REPLICA-IDENTITY
 */

-- Change REPLICA IDENTITY to FULL for filtering support
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- Verify REPLICA IDENTITY
DO $$
DECLARE
  v_relreplident CHAR(1);
BEGIN
  SELECT relreplident INTO v_relreplident
  FROM pg_class
  WHERE oid = 'public.products'::regclass;

  IF v_relreplident = 'f' THEN
    RAISE NOTICE '✅ products REPLICA IDENTITY set to FULL';
  ELSE
    RAISE EXCEPTION '❌ products REPLICA IDENTITY not FULL (current: %)', v_relreplident;
  END IF;
END $$;
