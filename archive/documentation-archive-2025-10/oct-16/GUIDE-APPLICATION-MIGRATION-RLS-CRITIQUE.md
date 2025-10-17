# 🔒 GUIDE APPLICATION MIGRATION RLS CRITIQUE

**Mission** : Corriger vulnérabilité sécurité BLOQUEUR PRODUCTION
**Tables concernées** : `variant_groups`, `sample_orders`, `sample_order_items`
**Impact** : Accès non autorisé inter-organisations possible
**Durée estimée** : 1h - 2h (avec tests validation)

---

## 🎯 OBJECTIF

Activer Row Level Security (RLS) sur 3 tables critiques qui exposent actuellement des données sans isolation organisationnelle.

**Vulnérabilités identifiées** :
- ❌ `variant_groups` : Groupes variantes visibles toutes organisations
- ❌ `sample_orders` : Commandes échantillons exposées
- ❌ `sample_order_items` : Détails commandes accessibles sans restriction

**Bonus** : Renforcement policies table `contacts` (trop permissives)

---

## ✅ PRÉREQUIS

- [x] Accès Supabase Dashboard : https://supabase.com/dashboard
- [x] Projet : `aorroydfjsrygmosnzrl`
- [x] Rôle : `admin` ou `service_role`
- [x] Migration SQL prête : `supabase/migrations/20251008_003_fix_missing_rls_policies.sql`

---

## 📋 ÉTAPE 1 : APPLICATION MIGRATION VIA DASHBOARD (15min)

### 1.1 Ouvrir SQL Editor

**URL directe** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql/new

**Navigation** :
1. Dashboard Supabase → Projet `aorroydfjsrygmosnzrl`
2. Menu gauche → **SQL Editor**
3. Bouton **New Query**

### 1.2 Copier Migration SQL

**Fichier source** : `/Users/romeodossantos/verone-back-office-V1/supabase/migrations/20251008_003_fix_missing_rls_policies.sql`

**Copier TOUT le contenu** (287 lignes) incluant :
- `BEGIN;` (ligne 6)
- Toutes les sections RLS (variant_groups, sample_orders, sample_order_items, contacts)
- `COMMIT;` (ligne 248)
- Validation queries (lignes 253-287)

**⚠️ IMPORTANT** : Copier transaction complète BEGIN → COMMIT

### 1.3 Exécuter Migration

1. **Coller** le SQL complet dans l'éditeur
2. **Vérifier** présence BEGIN/COMMIT
3. **Cliquer** bouton `Run` (ou `CTRL+Enter` / `CMD+Enter`)

**Résultat attendu** :
```
Success. No rows returned
```

**Si erreur** :
- Vérifier copier-coller complet (287 lignes)
- Vérifier pas de policies déjà existantes (noms conflictuels)
- Rollback automatique PostgreSQL (pas de données corrompues)

### 1.4 Vérifier Résultats Validation

Le script migration contient 2 queries de validation automatiques (lignes 253-287).

**Attendu dans résultats** :
```sql
-- Query 1: Vérification RLS enabled
NOTICE: SUCCÈS: Toutes les tables ont RLS enabled (100% coverage)

-- Query 2: Count policies par table
variant_groups        | 4
sample_orders         | 4
sample_order_items    | 4
contacts              | 4
```

**Si résultats différents** → STOP, analyser erreurs

---

## ✅ ÉTAPE 2 : VALIDATION POLICIES DANS UI (10min)

### 2.1 Ouvrir Policies Dashboard

**URL directe** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/auth/policies

**Navigation** : Dashboard → Authentication → Policies

### 2.2 Vérifier Policies Créées

**Pour chaque table** : `variant_groups`, `sample_orders`, `sample_order_items`, `contacts`

**Attendu : 4 policies par table**

#### variant_groups (4 policies)
1. ✅ `variant_groups_select_own_organisation` (SELECT)
2. ✅ `variant_groups_insert_catalog_managers` (INSERT)
3. ✅ `variant_groups_update_catalog_managers` (UPDATE)
4. ✅ `variant_groups_delete_admins` (DELETE)

#### sample_orders (4 policies)
1. ✅ `sample_orders_select_own_organisation` (SELECT)
2. ✅ `sample_orders_insert_authenticated` (INSERT)
3. ✅ `sample_orders_update_creator_or_managers` (UPDATE)
4. ✅ `sample_orders_delete_admins` (DELETE)

#### sample_order_items (4 policies)
1. ✅ `sample_order_items_select_via_order` (SELECT)
2. ✅ `sample_order_items_insert_via_order` (INSERT)
3. ✅ `sample_order_items_update_via_order` (UPDATE)
4. ✅ `sample_order_items_delete_admins` (DELETE)

#### contacts (4 policies)
1. ✅ `contacts_select_own_organisation` (SELECT)
2. ✅ `contacts_insert_own_organisation` (INSERT)
3. ✅ `contacts_update_own_organisation` (UPDATE)
4. ✅ `contacts_delete_managers` (DELETE)

### 2.3 Validation Target Role

**Pour CHAQUE policy** :
- Target role : `authenticated` ✓
- USING clause : Contient filtre `organisation_id` ou `created_by = auth.uid()`

---

## 🧪 ÉTAPE 3 : TESTS ISOLATION MULTI-ORGANISATIONS (1h)

### 3.1 Exécuter Script Tests Automatisés

**Fichier** : `scripts/security/test-rls-isolation.sql`

**Exécution** :
1. Ouvrir SQL Editor : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql/new
2. Copier contenu `scripts/security/test-rls-isolation.sql`
3. Exécuter (Run)

**Résultats attendus** :

```sql
-- Test 1: variant_groups isolation
test_variant_groups_isolation | PASSED (0 rows accessible cross-org)

-- Test 2: sample_orders isolation
test_sample_orders_isolation  | PASSED (0 rows accessible cross-org)

-- Test 3: sample_order_items isolation
test_sample_order_items_isolation | PASSED (0 rows accessible cross-org)
```

**Si 1+ tests FAILED** → STOP, analyser policies

### 3.2 Validation Manuelle (Optionnel)

**Si script automatisé échoue**, exécuter tests manuels :

#### Test 1 - variant_groups

```sql
-- Créer organisations test
INSERT INTO organisations (id, name, type, is_active)
VALUES
  ('org-test-a', 'Test Organisation A', 'internal', true),
  ('org-test-b', 'Test Organisation B', 'internal', true);

-- Créer variant_group organisation A
INSERT INTO variant_groups (id, name, organisation_id)
VALUES ('vg-test-a', 'Variant Group A', 'org-test-a');

-- Simuler user organisation B
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-test-b';

-- Tenter accès (ATTENDU: 0 rows)
SELECT * FROM variant_groups WHERE id = 'vg-test-a';
-- RÉSULTAT ATTENDU: 0 rows (accès bloqué par RLS)
```

#### Test 2 - sample_orders

```sql
-- Créer commande organisation A
INSERT INTO sample_orders (id, organisation_id, status)
VALUES ('so-test-a', 'org-test-a', 'pending');

-- Simuler user organisation B
SET LOCAL request.jwt.claims.sub TO 'user-test-b';

-- Tenter accès (ATTENDU: 0 rows)
SELECT * FROM sample_orders WHERE id = 'so-test-a';
-- RÉSULTAT ATTENDU: 0 rows (accès bloqué)
```

#### Test 3 - sample_order_items

```sql
-- Créer item organisation A
INSERT INTO sample_order_items (id, sample_order_id, product_id)
VALUES ('soi-test-a', 'so-test-a', 'prod-123');

-- Simuler user organisation B
SET LOCAL request.jwt.claims.sub TO 'user-test-b';

-- Tenter accès (ATTENDU: 0 rows)
SELECT * FROM sample_order_items WHERE id = 'soi-test-a';
-- RÉSULTAT ATTENDU: 0 rows (accès bloqué)
```

### 3.3 Nettoyage Données Test

```sql
-- Supprimer données test (si tests manuels exécutés)
DELETE FROM sample_order_items WHERE id = 'soi-test-a';
DELETE FROM sample_orders WHERE id = 'so-test-a';
DELETE FROM variant_groups WHERE id = 'vg-test-a';
DELETE FROM organisations WHERE id IN ('org-test-a', 'org-test-b');
```

---

## ✅ ÉTAPE 4 : VALIDATION COVERAGE GLOBAL (15min)

### 4.1 Exécuter Script Validation RLS

**Fichier** : `scripts/security/validate-rls-coverage.sh`

**Exécution** :
```bash
cd /Users/romeodossantos/verone-back-office-V1
chmod +x scripts/security/validate-rls-coverage.sh
./scripts/security/validate-rls-coverage.sh
```

**Résultat attendu** :
```
✅ RLS Coverage: 24/24 tables (100%)
✅ All policies validated
✅ No tables without RLS

Tables avec RLS enabled (24):
- categories
- subcategories
- products
- variant_groups ✓ (FIXÉ)
- sample_orders ✓ (FIXÉ)
- sample_order_items ✓ (FIXÉ)
- contacts ✓ (RENFORCÉ)
- [... autres tables ...]
```

**Si <100% coverage** → Identifier tables manquantes, créer migration supplémentaire

---

## 📊 ÉTAPE 5 : GÉNÉRATION RAPPORT SÉCURITÉ FINAL (15min)

### 5.1 Checklist Validation Complète

**Cocher chaque élément avant production** :

- [ ] Migration SQL appliquée sans erreur (Success)
- [ ] Validation queries : 100% RLS coverage confirmé
- [ ] Policies UI : 4 policies par table visible
- [ ] Tests isolation : 3/3 tests PASSED (0 rows cross-org)
- [ ] Script validation RLS : 100% coverage (24/24 tables)
- [ ] Aucune régression fonctionnelle détectée
- [ ] Backup base données effectué (recommandé)

### 5.2 Décision GO/NO-GO Production

**SI TOUS LES ÉLÉMENTS COCHÉS ✅** :

```
🎉 MIGRATION RLS RÉUSSIE - PRODUCTION READY

Vulnérabilités corrigées:
✅ variant_groups : RLS enabled + 4 policies
✅ sample_orders : RLS enabled + 4 policies
✅ sample_order_items : RLS enabled + 4 policies
✅ contacts : Policies renforcées (4 policies strictes)

Tests validation:
✅ Isolation multi-organisations : 3/3 PASSED
✅ Coverage RLS : 100% (24/24 tables)
✅ Aucune régression fonctionnelle

DÉCISION : ✅ DÉPLOIEMENT PRODUCTION AUTORISÉ
```

**SI 1+ ÉLÉMENT NON COCHÉ ❌** :

```
⚠️ MIGRATION INCOMPLÈTE - PRODUCTION BLOQUÉE

Éléments manquants:
- [Liste éléments non cochés]

ACTIONS REQUISES:
1. Analyser logs erreurs
2. Corriger problèmes identifiés
3. Re-exécuter validations
4. Re-tester isolation

DÉCISION : ❌ DÉPLOIEMENT PRODUCTION BLOQUÉ
```

---

## 🚨 TROUBLESHOOTING

### Erreur : Policy already exists

**Cause** : Policies déjà créées précédemment

**Solution** :
```sql
-- Supprimer policies existantes
DROP POLICY IF EXISTS "variant_groups_select_own_organisation" ON variant_groups;
-- ... répéter pour toutes les policies conflictuelles

-- Re-exécuter migration
```

### Erreur : Transaction rollback

**Cause** : Erreur SQL dans migration (syntaxe, contraintes)

**Solution** :
1. Vérifier logs erreurs PostgreSQL (détails précis)
2. Corriger problème identifié
3. Re-exécuter migration complète (BEGIN → COMMIT)

### Tests isolation FAILED

**Cause** : Policies trop permissives ou incorrectes

**Solution** :
1. Vérifier policies dans Dashboard UI
2. Vérifier USING clause contient filtre `organisation_id`
3. Corriger policies via SQL ou UI
4. Re-tester isolation

---

## 📚 RESSOURCES

- **Migration SQL** : `/Users/romeodossantos/verone-back-office-V1/supabase/migrations/20251008_003_fix_missing_rls_policies.sql`
- **Tests isolation** : `/Users/romeodossantos/verone-back-office-V1/scripts/security/test-rls-isolation.sql`
- **Validation RLS** : `/Users/romeodossantos/verone-back-office-V1/scripts/security/validate-rls-coverage.sh`
- **Supabase Dashboard** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl
- **Policies UI** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/auth/policies
- **Documentation Supabase RLS** : https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ SUCCÈS VALIDATION

**Critères déploiement production** :
1. Migration appliquée sans erreur
2. 100% RLS coverage (24/24 tables)
3. 4 policies par table critique
4. Tests isolation : 3/3 PASSED
5. Aucune régression fonctionnelle

**Si tous critères validés** → **PRODUCTION READY** ✅

---

*Date création : 8 octobre 2025*
*Version : 1.0*
*Auteur : Vérone Security Team*
