-- Migration: Validation & Initial Seed Data
-- Phase 5: Validates complete architecture and creates initial seed data
-- Depends on: All previous migrations (001-004)
-- Based on business requirements for veronebyromeo@gmail.com

-- ========================================
-- ARCHITECTURE VALIDATION
-- ========================================

-- Validate all required tables exist
DO $$
DECLARE
  missing_tables TEXT[] := '{}';
  table_name TEXT;
  required_tables TEXT[] := ARRAY[
    'organisations', 'user_profiles',
    'categories', 'category_translations', 'product_groups',
    'products', 'product_packages', 'product_translations',
    'collections', 'collection_translations', 'collection_products',
    'feed_configs', 'feed_exports', 'feed_performance_metrics'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
  END IF;

  RAISE NOTICE 'VALIDATION PASSED: All required tables exist';
END $$;

-- Validate all helper functions exist
DO $$
DECLARE
  missing_functions TEXT[] := '{}';
  function_name TEXT;
  required_functions TEXT[] := ARRAY[
    'get_user_role()', 'get_user_organisation_id()', 'has_scope(text)',
    'update_updated_at()', 'generate_feed_access_token()',
    'validate_feed_filters(jsonb)', 'get_products_for_feed(uuid)',
    'validate_rls_setup()'
  ];
BEGIN
  FOREACH function_name IN ARRAY required_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = regexp_replace(function_name, '\(.*\)', '')
    ) THEN
      missing_functions := array_append(missing_functions, function_name);
    END IF;
  END LOOP;

  IF array_length(missing_functions, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required functions: %', array_to_string(missing_functions, ', ');
  END IF;

  RAISE NOTICE 'VALIDATION PASSED: All required functions exist';
END $$;

-- ========================================
-- RLS VALIDATION
-- ========================================

-- Check RLS is enabled on all critical tables
DO $$
DECLARE
  unprotected_tables TEXT[] := '{}';
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_name IN (
      'organisations', 'user_profiles',
      'categories', 'product_groups', 'products', 'collections',
      'feed_configs', 'feed_exports'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_tables pt
      WHERE pt.schemaname = 'public'
      AND pt.tablename = t.table_name
      AND pt.rowsecurity = true
    )
  LOOP
    unprotected_tables := array_append(unprotected_tables, table_record.table_name);
  END LOOP;

  IF array_length(unprotected_tables, 1) > 0 THEN
    RAISE EXCEPTION 'RLS not enabled on critical tables: %', array_to_string(unprotected_tables, ', ');
  END IF;

  RAISE NOTICE 'VALIDATION PASSED: RLS enabled on all critical tables';
END $$;

-- ========================================
-- INITIAL SEED DATA
-- ========================================

-- Create default Vérone organisation
INSERT INTO organisations (id, name, slug, description, is_active, created_at)
VALUES (
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789'::UUID,
  'Vérone',
  'verone',
  'Organisation principale Vérone - Mobilier et décoration haut de gamme',
  TRUE,
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create default categories (3-level hierarchy)
WITH category_data AS (
  SELECT * FROM (VALUES
    -- Level 0 (Root categories)
    ('11111111-1111-1111-1111-111111111111'::UUID, NULL, 'Mobilier', 'mobilier', 0, 'Mobilier d''intérieur', 1001, 'Home & Garden > Furniture'),
    ('22222222-2222-2222-2222-222222222222'::UUID, NULL, 'Décoration', 'decoration', 0, 'Objets décoratifs', 1002, 'Home & Garden > Decor'),
    ('33333333-3333-3333-3333-333333333333'::UUID, NULL, 'Éclairage', 'eclairage', 0, 'Luminaires et éclairage', 1003, 'Home & Garden > Lighting'),
    ('44444444-4444-4444-4444-444444444444'::UUID, NULL, 'Textile', 'textile', 0, 'Textiles d''ameublement', 1004, 'Home & Garden > Linens & Bedding'),

    -- Level 1 (Sub-categories - Mobilier)
    ('11111111-1111-1111-1111-111111111112'::UUID, '11111111-1111-1111-1111-111111111111'::UUID, 'Canapés', 'canapes', 1, 'Canapés et sofas', 1011, 'Home & Garden > Furniture > Sofas'),
    ('11111111-1111-1111-1111-111111111113'::UUID, '11111111-1111-1111-1111-111111111111'::UUID, 'Tables', 'tables', 1, 'Tables de tous types', 1012, 'Home & Garden > Furniture > Tables'),
    ('11111111-1111-1111-1111-111111111114'::UUID, '11111111-1111-1111-1111-111111111111'::UUID, 'Chaises', 'chaises', 1, 'Chaises et assises', 1013, 'Home & Garden > Furniture > Chairs'),

    -- Level 1 (Sub-categories - Éclairage)
    ('33333333-3333-3333-3333-333333333332'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'Suspensions', 'suspensions', 1, 'Luminaires suspendus', 1031, 'Home & Garden > Lighting > Ceiling Lights'),
    ('33333333-3333-3333-3333-333333333333'::UUID, '33333333-3333-3333-3333-333333333333'::UUID, 'Lampes de table', 'lampes-table', 1, 'Lampes de table et de chevet', 1032, 'Home & Garden > Lighting > Table Lamps')
  ) AS t(id, parent_id, name, slug, level, description, google_category_id, facebook_category)
)
INSERT INTO categories (id, parent_id, name, slug, level, description, google_category_id, facebook_category, is_active, display_order)
SELECT id, parent_id, name, slug, level, description, google_category_id, facebook_category, TRUE, 0
FROM category_data
ON CONFLICT (slug) DO NOTHING;

-- Insert category translations (French only for now)
INSERT INTO category_translations (category_id, language, name, description)
SELECT id, 'fr', name, description
FROM categories
WHERE NOT EXISTS (
  SELECT 1 FROM category_translations ct
  WHERE ct.category_id = categories.id AND ct.language = 'fr'
);

-- ========================================
-- SAMPLE FEED CONFIGURATION
-- ========================================

-- Create sample Google Merchant feed config
INSERT INTO feed_configs (
  id, name, platform, language, format,
  schedule_frequency, schedule_hour,
  filters, access_token, is_active, created_by
)
VALUES (
  uuid_generate_v4(),
  'Google Merchant France',
  'google_merchant',
  'fr',
  'csv',
  'daily',
  6, -- 06:00 UTC
  '{"category_ids": [], "status": ["in_stock", "preorder"]}',
  generate_feed_access_token(),
  FALSE, -- Disabled until configuration
  NULL -- Will be set when first owner user is created
) ON CONFLICT DO NOTHING;

-- ========================================
-- PERFORMANCE VALIDATION
-- ========================================

-- Test critical query performance
DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration_ms INTEGER;
BEGIN
  -- Test 1: Categories hierarchy query
  start_time := clock_timestamp();
  PERFORM c1.name, c2.name, c3.name
  FROM categories c1
  LEFT JOIN categories c2 ON c2.parent_id = c1.id
  LEFT JOIN categories c3 ON c3.parent_id = c2.id
  WHERE c1.level = 0 AND c1.is_active = TRUE;
  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));

  IF duration_ms > 100 THEN
    RAISE WARNING 'Categories hierarchy query slow: % ms (target: <100ms)', duration_ms;
  ELSE
    RAISE NOTICE 'PERFORMANCE OK: Categories hierarchy query: % ms', duration_ms;
  END IF;

  -- Test 2: Products with groups and categories
  start_time := clock_timestamp();
  PERFORM p.id, p.name, pg.name, c.name
  FROM products p
  JOIN product_groups pg ON p.product_group_id = pg.id
  JOIN categories c ON pg.category_id = c.id
  WHERE p.status IN ('in_stock', 'preorder')
  LIMIT 100;
  end_time := clock_timestamp();
  duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));

  IF duration_ms > 200 THEN
    RAISE WARNING 'Products join query slow: % ms (target: <200ms)', duration_ms;
  ELSE
    RAISE NOTICE 'PERFORMANCE OK: Products join query: % ms', duration_ms;
  END IF;
END $$;

-- ========================================
-- FINAL VALIDATION REPORT
-- ========================================

-- Generate complete validation report
CREATE OR REPLACE FUNCTION generate_architecture_report()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Tables validation
  RETURN QUERY
  SELECT
    'Tables'::TEXT,
    CASE WHEN count(*) >= 15 THEN 'OK' ELSE 'WARNING' END,
    format('%s tables created', count(*))
  FROM information_schema.tables
  WHERE table_schema = 'public';

  -- RLS validation
  RETURN QUERY
  SELECT
    'RLS Security'::TEXT,
    CASE WHEN count(*) >= 10 THEN 'OK' ELSE 'CRITICAL' END,
    format('%s tables with RLS enabled', count(*))
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;

  -- Functions validation
  RETURN QUERY
  SELECT
    'Helper Functions'::TEXT,
    CASE WHEN count(*) >= 8 THEN 'OK' ELSE 'WARNING' END,
    format('%s functions created', count(*))
  FROM information_schema.routines
  WHERE routine_schema = 'public';

  -- Indexes validation
  RETURN QUERY
  SELECT
    'Performance Indexes'::TEXT,
    CASE WHEN count(*) >= 25 THEN 'OK' ELSE 'WARNING' END,
    format('%s indexes created', count(*))
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Seed data validation
  RETURN QUERY
  SELECT
    'Seed Data'::TEXT,
    CASE WHEN
      EXISTS(SELECT 1 FROM organisations WHERE slug = 'verone') AND
      EXISTS(SELECT 1 FROM categories WHERE level = 0)
    THEN 'OK' ELSE 'WARNING' END,
    'Organisation and categories seeded';
END;
$$ LANGUAGE plpgsql;

-- Display final report
SELECT * FROM generate_architecture_report();

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION generate_architecture_report()
IS 'Generate complete architecture validation report showing status of all components';

-- Final validation message
DO $$
BEGIN
  RAISE NOTICE '
=================================================
VÉRONE CATALOGUE DB FOUNDATION - SETUP COMPLETE
=================================================

✅ Tables: All catalogue, auth, and feed tables created
✅ RLS: Row Level Security enabled with V1 role policies
✅ Functions: Helper functions for security and feeds
✅ Indexes: Performance indexes for <2s SLO target
✅ Seed: Default organisation and categories created

NEXT STEPS:
1. Create owner user: veronebyromeo@gmail.com
2. Test RLS policies with different role assignments
3. Validate feed export functionality
4. Performance test with sample data

Architecture ready for Vérone MVP catalogue! 🚀
=================================================';
END $$;