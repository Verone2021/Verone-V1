#!/bin/bash
# 🚀 GROUPE 2 - COMMANDES DIAGNOSTIC RAPIDES
# Copier-coller direct dans terminal

# ============================================
# CONFIGURATION
# ============================================
export PGPASSWORD="ADFVKDJCJDNC934"
export PGHOST="aws-1-eu-west-3.pooler.supabase.com"
export PGPORT="5432"
export PGUSER="postgres.aorroydfjsrygmosnzrl"
export PGDATABASE="postgres"

# Alias pratique
alias psql-verone='psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE'

# ============================================
# VÉRIFICATIONS PRÉ-TESTS (30s)
# ============================================

# 1. Vérifier serveur dev
echo "📡 Vérification serveur dev..."
curl -s -o /dev/null -w "Serveur: HTTP %{http_code} | Temps: %{time_total}s\n" http://localhost:3000
# ✅ HTTP 200 = OK | ❌ HTTP 000 = OFF → npm run dev

# 2. Vérifier connexion Supabase
echo "🗄️ Vérification connexion DB..."
psql-verone -c "SELECT NOW() as heure_serveur, version() as pg_version;" -t
# ✅ Timestamp affiché = OK | ❌ Timeout = Problème réseau

# 3. Vérifier schéma display_order
echo "🔍 Vérification schéma display_order..."
psql-verone -c "
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE column_name = 'display_order'
AND table_name IN ('families', 'categories', 'subcategories', 'collections')
ORDER BY table_name;" -q
# ✅ 4 lignes = OK | ❌ Moins = Migration KO

# ============================================
# DIAGNOSTIC ERREURS
# ============================================

# Scénario #1 - Démarrer serveur dev
cd /Users/romeodossantos/verone-back-office-V1 && npm run dev

# Scénario #4A - Vérifier DB display_order
psql-verone -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'display_order';"

# Scénario #4B - Réappliquer migration (si display_order absent)
psql-verone -f /Users/romeodossantos/verone-back-office-V1/supabase/migrations/20251016_fix_display_order_columns.sql

# Scénario #5 - Tester connexion Supabase
curl -I https://aorroydfjsrygmosnzrl.supabase.co

# Scénario #5 - Fallback Direct Connection (si pooler timeout)
PGPORT=6543 psql-verone -c "SELECT NOW();"

# ============================================
# TESTS VALIDATION
# ============================================

# Créer famille test via SQL
psql-verone -c "
INSERT INTO families (name, slug, description, display_order)
VALUES (
  'test-debug-$(date +%s)',
  'test-debug-$(date +%s)',
  'Test automatique debugger $(date)',
  999
)
RETURNING id, name, display_order, created_at;" -q

# Lister toutes familles triées par display_order
psql-verone -c "
SELECT id, name, display_order, is_active, created_at
FROM families
ORDER BY display_order, name
LIMIT 10;" -x

# Compter familles actives
psql-verone -c "SELECT COUNT(*) as total_familles, COUNT(*) FILTER (WHERE is_active) as familles_actives FROM families;" -t

# Vérifier dernière famille créée
psql-verone -c "
SELECT id, name, display_order, created_at
FROM families
ORDER BY created_at DESC
LIMIT 1;" -x

# ============================================
# NETTOYAGE DONNÉES TEST
# ============================================

# Supprimer toutes familles test-*
psql-verone -c "
DELETE FROM families
WHERE name LIKE 'test-%'
OR name LIKE 'debug-%'
RETURNING id, name;" -q

# ============================================
# MONITORING TEMPS RÉEL
# ============================================

# Voir logs Supabase (nécessite Dashboard)
# https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/logs/api-logs
# Filter: "families" OR "categories"

# Vérifier migrations appliquées
psql-verone -c "
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version >= '20251016'
ORDER BY version DESC
LIMIT 5;"

# ============================================
# FIXES URGENTS
# ============================================

# Kill serveur dev zombie + restart
lsof -ti:3000 | xargs kill -9 && cd /Users/romeodossantos/verone-back-office-V1 && npm run dev

# Vérifier aucun sort_order résiduel dans code
grep -r "sort_order" /Users/romeodossantos/verone-back-office-V1/src/ --include="*.ts" --include="*.tsx" | grep -v "display_order"
# ✅ Aucun résultat = OK | ❌ Matches = Fichiers à corriger

# Régénérer types TypeScript Supabase
cd /Users/romeodossantos/verone-back-office-V1 && npx supabase gen types typescript --project-id aorroydfjsrygmosnzrl > src/lib/supabase/types.ts

# ============================================
# VÉRIFICATIONS POST-FIX
# ============================================

# Schéma complet table families
psql-verone -c "\d families"

# Constraints et indexes families
psql-verone -c "\d+ families"

# Policies RLS families
psql-verone -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'families';"

# ============================================
# STATISTIQUES DB
# ============================================

# Statistiques complètes catalogue
psql-verone -c "
SELECT
  'Families' as table_name, COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as actifs
FROM families
UNION ALL
SELECT
  'Categories', COUNT(*), COUNT(*) FILTER (WHERE is_active)
FROM categories
UNION ALL
SELECT
  'Subcategories', COUNT(*), COUNT(*) FILTER (WHERE is_active)
FROM subcategories
UNION ALL
SELECT
  'Collections', COUNT(*), COUNT(*) FILTER (WHERE is_active)
FROM collections
ORDER BY table_name;"

# ============================================
# AIDE & DOCUMENTATION
# ============================================

echo "
📚 DOCUMENTATION DISPONIBLE

- GROUPE-2-DIAGNOSTIC-ERREURS.md    → Guide complet diagnostic
- GROUPE-2-QUICK-REFERENCE.md       → Référence 1 page
- GROUPE-2-TOP-5-SCENARIOS.md       → Top 5 erreurs + solutions
- GROUPE-2-COMMANDES-RAPIDES.sh     → Ce fichier

🔧 COMMANDES UTILES

# Alias psql-verone configuré ✅
# Usage: psql-verone -c \"SELECT * FROM families;\"

# Export variables PGPASSWORD, PGHOST, etc. ✅
# Pas besoin retaper credentials

📞 SUPPORT

Disponibilité: Temps réel pendant tests GROUPE 2
Réponse: <2 min pour erreurs P0/P1 bloquantes
Mode: Claude Code conversation active

🚀 DÉMARRAGE TESTS

1. npm run dev
2. open http://localhost:3000
3. F12 (DevTools) → Console
4. Naviguer Catalogue Produits
5. Commencer Test 2.1 (Création Famille)

Bon courage ! 💪
"
