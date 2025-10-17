# Migrations Supabase - Vérone Back Office

**Dernière mise à jour**: 2025-10-17
**Migrations actives**: ~114 (après cleanup Octobre 2025)
**Migrations archivées**: 23 (10 phase1-initial + 13 octobre-2025)

---

## 📝 Convention Naming

### Format Obligatoire
```
YYYYMMDD_NNN_description.sql
```

**Composants**:
- `YYYYMMDD` : Date création (8 chiffres) - ex: `20251017`
- `NNN` : Numéro séquentiel du jour (3 chiffres) - ex: `001`, `002`, `003`
- `description` : Description kebab-case ou snake_case - ex: `add_tax_rate_column`
- `.sql` : Extension obligatoire

### Exemples Corrects
```
✅ 20251017_001_add_tax_rate_column.sql
✅ 20251017_002_create_invoices_rpc.sql
✅ 20251017_003_add_rls_policies_stock_movements.sql
✅ 20251018_001_remove_obsolete_column.sql
```

### Exemples Incorrects
```
❌ 20251017_add_tax_rate.sql              // Manque _NNN_
❌ add-tax-rate.sql                       // Pas de date
❌ 202510115_005_create_table.sql         // Date invalide (9 chiffres)
❌ 20251017-create-table.sql              // Séparateur incorrect
```

---

## 🚀 Process Ajout Migration

### 1. Trouver Dernier Numéro

```bash
# Lister migrations du jour
ls supabase/migrations/$(date +%Y%m%d)_*.sql 2>/dev/null

# Trouver dernier NNN
ls supabase/migrations/$(date +%Y%m%d)_*.sql 2>/dev/null | tail -1
```

### 2. Créer Fichier

```bash
# Si dernier = 20251017_002_*.sql
# Créer 20251017_003_nouvelle_migration.sql
touch supabase/migrations/$(date +%Y%m%d)_003_description.sql
```

### 3. Écrire Migration

**Template minimal**:
```sql
-- Migration: [Description courte]
-- Date: 2025-10-17
-- Auteur: [Nom]
-- Contexte: [Pourquoi cette migration]

-- Exemple: Ajout colonne tax_rate
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);

-- Commentaire colonne
COMMENT ON COLUMN products.tax_rate IS
  'Taux TVA en pourcentage (ex: 20.00 pour 20%)';
```

**Checklist**:
- [ ] SQL pur (pas de `\echo`, `\set` PostgreSQL-only)
- [ ] Idempotent (`IF NOT EXISTS`, `IF EXISTS`)
- [ ] Commentaires explicatifs
- [ ] RLS policies (si table)
- [ ] Indexes performance (si table large)

### 4. Tester Localement

```bash
# Reset DB locale
supabase db reset

# Appliquer migration
supabase db push

# Vérifier console errors
npm run dev
# Ouvrir http://localhost:3000
```

### 5. Commit

```bash
git add supabase/migrations/YYYYMMDD_NNN_*.sql
git commit -m "feat(db): Add DESCRIPTION"
git push
```

Supabase appliquera automatiquement via GitHub Actions.

---

## 📦 Règles Archivage

### Principe d'Or
**ARCHIVER > SUPPRIMER**

### Quand Archiver

| Situation | Action | Destination |
|-----------|--------|-------------|
| Migration remplacée par version ultérieure | ✅ Archiver | `archive/YYYY-MM-category/` |
| Rollback explicite appliqué | ✅ Archiver | `archive/YYYY-MM-rollbacks/` |
| Iteration debug consolidée | ✅ Archiver | `archive/YYYY-MM-debug-iterations/` |
| Experimental jamais appliqué production | ✅ Archiver | `archive/experimental/` |
| Migration >12 mois et remplacée | ✅ Archiver | `archive/YYYY-phase-name/` |

### Quand Supprimer

| Situation | Action |
|-----------|--------|
| Migration appliquée production | ❌ **JAMAIS SUPPRIMER** |
| Migration test local uniquement | ✅ Supprimer OK (si jamais commit) |
| Migration avec dépendances actives | ❌ **JAMAIS SUPPRIMER** |

### Commande Archivage

```bash
# Archiver migration
git mv supabase/migrations/YYYYMMDD_NNN_*.sql \
       supabase/migrations/archive/YYYY-MM-category/

# Commit archivage
git commit -m "chore(migrations): Archive DESCRIPTION (raison)"
```

---

## 📊 Index Migrations par Module

### Auth & Users
- `20250113_002_create_auth_tables.sql`
- `20250114_001_extend_user_profiles.sql`
- `20250114_002_admin_user_management.sql`
- `20250916_011_fix_owner_admin_full_access.sql`
- `20251016_003_align_owner_admin_policies.sql`

### Catalogue & Products
- `20250113_001_create_catalogue_tables.sql`
- `20250916_001_create_product_drafts.sql`
- `20250916_007_create_product_images_table.sql`
- `20250917_002_products_system_consolidated.sql`
- `20251007_001_product_colors_table.sql`
- `20251016_001_add_rejection_reason_column.sql`
- `20251016_004_fix_display_order_columns.sql`
- `20251017_001_remove_price_ht_column.sql`

### Stock & Inventory
- `20250918_001_stock_professional_system.sql`
- `20250922_001_orders_stock_traceability_automation.sql`
- `20251012_001_smart_stock_alerts_system.sql`
- `20251013_021_add_rls_policies_stock_movements.sql`
- `20251014_005_allow_negative_stock.sql`

### Orders (Sales & Purchase)
- `20250916_004_create_stock_and_orders_tables.sql`
- `20250925_001_sample_orders_grouping.sql`
- `20250925_002_sourcing_workflow_validation.sql`
- `20251010_001_sales_channels_pricing_system.sql`
- `20251013_014_remove_direct_products_update_handle_sales_order_stock.sql`
- `20251013_023_create_individual_customers_table.sql`

### Billing & Invoicing
- `20251011_001_create_invoices_table.sql`
- `20251011_002_create_payments_table.sql`
- `20251011_006_create_rpc_invoice_functions.sql`
- `20251011_009_create_rls_policies_invoicing.sql`

### Integrations (Abby, Feeds)
- `20250113_004_create_feeds_tables.sql`
- `20251011_003_create_abby_sync_queue_table.sql`
- `20251011_004_create_abby_webhook_events_table.sql`

### Dashboard & Metrics
- `20250114_003_dashboard_metrics_functions.sql`
- `20251015_001_dashboard_activity_triggers.sql`
- `20251015_002_notification_triggers.sql`

### Organisations & Branding
- `20251015_003_add_logo_url_to_organisations.sql`
- `20251015_004_rls_organisation_logos_storage.sql`
- `20251015_006_create_organisation_logos_bucket.sql`

---

## 🔧 Troubleshooting

### Migration Failed to Apply

**Symptômes** : Migration échoue lors de `supabase db push`

**Solutions** :
1. Vérifier logs Supabase Dashboard
2. Tester migration localement : `supabase db reset && supabase db push`
3. Vérifier dépendances (tables, colonnes, fonctions)
4. Si bloqué : Créer migration rollback

**Exemple rollback**:
```sql
-- 20251017_004_rollback_tax_rate.sql
ALTER TABLE products DROP COLUMN IF EXISTS tax_rate;
```

### Naming Conflict

**Symptômes** : Fichier même nom existe déjà

**Solution** :
```bash
# Trouver dernier NNN du jour
ls supabase/migrations/20251017_*.sql | \
  sed 's/.*_\([0-9]\{3\}\)_.*/\1/' | \
  sort -n | tail -1

# Incrémenter NNN
# Si dernier = 003, utiliser 004
```

### Migration Déjà Appliquée

**Symptômes** : Erreur "table already exists", "column already exists"

**Cause** : Migration pas idempotent

**Solution** : Utiliser `IF NOT EXISTS`, `IF EXISTS`
```sql
-- ✅ Idempotent
CREATE TABLE IF NOT EXISTS products (...);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
DROP INDEX IF EXISTS idx_old;

-- ❌ Pas idempotent (erreur si re-exécuté)
CREATE TABLE products (...);
ALTER TABLE products ADD COLUMN tax_rate NUMERIC(5,2);
```

### Performance Lente

**Symptômes** : Migration prend >30s

**Causes** :
- Table large sans index
- Scan complet table
- RLS policies complexes

**Solutions** :
```sql
-- Créer index AVANT migration données
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category
  ON products(category_id);

-- Utiliser batch updates
UPDATE products SET tax_rate = 20.00
WHERE category_id = '...' AND tax_rate IS NULL
LIMIT 1000;
```

---

## 📚 Best Practices 2025

### Sources Consultées
1. **Supabase Official Docs** : https://supabase.com/docs/guides/deployment/database-migrations
2. **Andrea Leopardi Blog** : "Migrations >12 mois completely irrelevant"
3. **Stack Overflow** : "Archive dans dossier legacy, ne jamais delete"
4. **GitHub Discussions** : Version control + environment separation

### Principes Clés

#### 1. One-Way Migrations
- **Pas de migrations "down"**
- Git rollback suffit pour revenir en arrière
- Créer nouvelle migration pour rollback

#### 2. Archive > Delete
- Préserver historique pour audit
- Git blame reste fonctionnel
- Rollback manuel possible si nécessaire

#### 3. Cleanup Périodique
- **Fréquence** : Mensuel (premier vendredi)
- **Critères** : Migrations >3 mois remplacées
- **Process** : Archiver vers `archive/YYYY-MM-category/`

#### 4. Documentation Inline
```sql
-- ✅ Bon
-- Migration: Support multi-taux TVA
-- Contexte: Facturation Abby nécessite taux TVA par produit
-- Impact: Aucun (colonne nullable)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);

-- ❌ Mauvais (pas de contexte)
ALTER TABLE products ADD COLUMN tax_rate NUMERIC(5,2);
```

#### 5. Idempotence
- Toujours `IF NOT EXISTS`, `IF EXISTS`
- Migration doit pouvoir être re-exécutée sans erreur
- Facilite rollback + debug

---

## ⚠️ Erreurs Courantes

### Erreur 1: Fichiers Non-SQL

```bash
# ❌ INTERDIT
supabase/migrations/cleanup-script.sh
supabase/migrations/seed-data.js

# ✅ CORRECT
scripts/maintenance/cleanup-script.sh
scripts/seeds/seed-data.sql
```

### Erreur 2: Naming Inconsistant

```bash
# ❌ INTERDIT (mélange formats)
20251017_001_add_column.sql
20251017_add_another_column.sql
20251017-003-fix-issue.sql

# ✅ CORRECT (format uniforme)
20251017_001_add_column.sql
20251017_002_add_another_column.sql
20251017_003_fix_issue.sql
```

### Erreur 3: Suppression Migrations Appliquées

```bash
# ❌ DANGER
git rm supabase/migrations/20251015_001_*.sql
# → Perte traçabilité, historique cassé

# ✅ CORRECT
git mv supabase/migrations/20251015_001_*.sql \
       supabase/migrations/archive/2025-10-obsolete/
```

---

## 📋 Checklist Pre-Commit

Avant de commit une nouvelle migration :

- [ ] Naming conforme `YYYYMMDD_NNN_description.sql`
- [ ] Fichier dans `supabase/migrations/` (pas ailleurs)
- [ ] SQL pur (pas de bash/python/JS)
- [ ] Idempotent (`IF NOT EXISTS`)
- [ ] Commentaires explicatifs
- [ ] RLS policies (si table)
- [ ] Indexes performance (si nécessaire)
- [ ] Testé localement (`supabase db reset && supabase db push`)
- [ ] Aucune erreur console (`npm run dev`)
- [ ] Rollback plan documenté (commentaires)

---

## 🔗 Ressources

### Documentation Interne
- **CLAUDE.md** : Section "Database Migrations Convention (Supabase)"
- **Mémoire Serena** : `database-migrations-convention`
- **Archive README** : `supabase/migrations/archive/README.md`
- **Audit historique** : `docs/migrations/ANALYSE-MIGRATIONS-OBSOLETES-2025-10-14.md`

### Documentation Externe
- **Supabase Docs** : https://supabase.com/docs/guides/deployment/database-migrations
- **Supabase CLI** : https://supabase.com/docs/reference/cli
- **PostgreSQL Docs** : https://www.postgresql.org/docs/current/sql-commands.html

### Outils
- **Supabase CLI** : `supabase db reset`, `supabase db push`
- **pgAdmin** : Visualiser schema après migrations
- **Git** : `git log -- supabase/migrations/` pour historique

---

## 📞 Support

### Questions Fréquentes

**Q: Puis-je modifier une migration déjà appliquée ?**
A: ❌ Non, créer nouvelle migration pour modifications

**Q: Comment rollback une migration ?**
A: Créer nouvelle migration qui annule les changements

**Q: Quelle différence entre supabase/migrations/ et scripts/seeds/ ?**
A: `migrations/` = Changements schema DB, `seeds/` = Données de test/dev

**Q: Faut-il archiver migrations >12 mois ?**
A: Oui si remplacées, non si encore référencées

---

**✅ Convention appliquée depuis** : 2025-10-17
**📊 Dernière consolidation** : 2025-10-17 (10 migrations archivées, 5 naming corrigés)
**🎯 Objectif** : Repository maintenable, migrations traçables, best practices 2025

*Vérone Back Office - Professional Database Management*
