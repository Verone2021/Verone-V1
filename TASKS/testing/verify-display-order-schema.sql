-- 🔍 VÉRIFICATION SCHÉMA display_order - GROUPE 2 RE-TEST
-- Date: 2025-10-16
-- Objectif: Valider migration sort_order → display_order dans DB
-- Criticité: CRITIQUE (Erreur #8 - PGRST204)

-- ============================================================
-- TEST 1: Vérifier colonne display_order existe
-- ============================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_categories'
  AND column_name = 'display_order';

-- Résultat attendu:
-- column_name   | data_type | is_nullable | column_default
-- display_order | integer   | YES         | NULL ou 0

-- ❌ Si 0 rows: ERREUR - Colonne display_order manquante
-- ✅ Si 1 row: OK - Colonne existe

-- ============================================================
-- TEST 2: Vérifier absence colonne sort_order (ancienne)
-- ============================================================

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_categories'
  AND column_name = 'sort_order';

-- Résultat attendu:
-- 0 rows (vide)

-- ❌ Si ≥1 row: ERREUR - Colonne sort_order toujours présente
-- ✅ Si 0 rows: OK - Migration complète

-- ============================================================
-- TEST 3: Vérifier toutes colonnes product_categories
-- ============================================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_categories'
ORDER BY ordinal_position;

-- Colonnes attendues (incluant display_order):
-- id, name, description, family_id, parent_category_id, display_order,
-- created_at, updated_at, deleted_at, etc.

-- ============================================================
-- TEST 4: Vérifier données display_order cohérentes
-- ============================================================

SELECT
  id,
  name,
  display_order,
  family_id
FROM product_categories
WHERE deleted_at IS NULL
ORDER BY family_id, display_order NULLS LAST
LIMIT 20;

-- Validation:
-- ✅ display_order contient valeurs (NULL acceptable)
-- ✅ Pas d'erreur "column sort_order does not exist"
-- ❌ Si erreur SQL: PGRST204 toujours présent

-- ============================================================
-- TEST 5: Test création catégorie avec display_order
-- ============================================================

-- TRANSACTION TEST (rollback pour ne pas polluer)
BEGIN;

INSERT INTO product_categories (
  name,
  description,
  family_id,
  display_order,
  created_at,
  updated_at
)
VALUES (
  'test-categorie-schema-validation',
  'Test validation colonne display_order',
  (SELECT id FROM product_families WHERE deleted_at IS NULL LIMIT 1),
  999,
  NOW(),
  NOW()
)
RETURNING id, name, display_order;

-- Résultat attendu:
-- id | name | display_order
-- X  | test-categorie-schema-validation | 999

-- ✅ Si INSERT réussit: display_order fonctionnel
-- ❌ Si erreur "column sort_order": Migration DB incomplète

ROLLBACK;

-- ============================================================
-- RÉSUMÉ VALIDATION
-- ============================================================

-- ✅ TEST 1 PASS: display_order existe
-- ✅ TEST 2 PASS: sort_order absent
-- ✅ TEST 3 PASS: Schéma complet cohérent
-- ✅ TEST 4 PASS: Données display_order valides
-- ✅ TEST 5 PASS: INSERT avec display_order OK

-- STATUT GLOBAL: ✅ MIGRATION COMPLÈTE
-- → Continuer tests GROUPE 2 (re-test)

-- ❌ Si ≥1 TEST FAIL: STOP - Migration DB incomplète
-- → Appliquer migration manuelle ou rollback commits

-- ============================================================
-- EXÉCUTION
-- ============================================================

-- Option 1: Via MCP Supabase
-- mcp__supabase__execute_sql(query)

-- Option 2: Via psql
-- psql $DATABASE_URL -f verify-display-order-schema.sql

-- Option 3: Via Supabase Dashboard
-- https://supabase.com/dashboard/project/[PROJECT_ID]/sql

-- ============================================================
-- NOTES
-- ============================================================

-- 1. Ce script est NON-DESTRUCTIF (SELECT + ROLLBACK)
-- 2. Exécution recommandée AVANT tests GROUPE 2
-- 3. Si tests PASS: Probabilité succès GROUPE 2 = 95%
-- 4. Si tests FAIL: Bloquer tests, analyser migrations
