# Convention Naming Migrations Database - Vérone Back Office

**Date création**: 2025-10-17  
**Source**: Consolidation migrations 2025 + Best Practices Supabase  
**Statut**: ✅ RÈGLE OBLIGATOIRE

---

## 📝 FORMAT STANDARD

### Naming Obligatoire
```
YYYYMMDD_NNN_description.sql
```

### Détails Format

| Composant | Description | Exemple |
|-----------|-------------|---------|
| `YYYYMMDD` | Date création (8 chiffres) | `20251017` |
| `NNN` | Numéro séquentiel du jour (3 chiffres) | `001`, `002`, `003` |
| `description` | Description kebab-case ou snake_case | `add_tax_rate_column` |
| `.sql` | Extension obligatoire | `.sql` |

---

## ✅ EXEMPLES CORRECTS

```
20251017_001_add_tax_rate_column.sql
20251017_002_create_invoices_rpc.sql
20251017_003_add_rls_policies_stock_movements.sql
20251018_001_remove_obsolete_column.sql
```

---

## ❌ EXEMPLES INCORRECTS

| Fichier Incorrect | Problème | Correction |
|-------------------|----------|------------|
| `20251017_add_tax_rate.sql` | Manque `_NNN_` | `20251017_001_add_tax_rate.sql` |
| `add-tax-rate.sql` | Pas de date | `20251017_001_add_tax_rate.sql` |
| `202510115_005_create_table.sql` | Date invalide (9 chiffres) | `20251015_005_create_table.sql` |
| `20251017-create-table.sql` | Séparateur incorrect (`-` au lieu de `_`) | `20251017_001_create_table.sql` |
| `20251017_create_table.sql` | Manque numérotation | `20251017_001_create_table.sql` |

---

## 📁 EMPLACEMENT & STRUCTURE

### Emplacement UNIQUE
```
supabase/migrations/
```

**⚠️ INTERDIT** : Placer migrations dans `docs/`, `scripts/`, `.claude/`, ou tout autre dossier.

### Structure Dossier
```
supabase/migrations/
├── README.md                          # Documentation process
├── 20251017_001_*.sql                 # Migrations actives (ordre chrono)
├── 20251017_002_*.sql
├── ...
│
├── archive/                           # Migrations archivées (référence)
│   ├── README.md
│   ├── 2025-10-rollbacks/             # Rollbacks + annulations
│   ├── 2025-10-debug-iterations/      # Iterations debug consolidées
│   └── 2025-phase1-initial/           # Migrations initiales
│
└── .templates/                        # Templates optionnel
    └── critical-table-template.sql
```

---

## 📋 RÈGLES OBLIGATOIRES

### 1. Fichiers SQL Purs Uniquement
- ✅ SQL pur (CREATE, ALTER, DROP, INSERT, etc.)
- ❌ Pas de bash, python, javascript dans fichiers migration
- ❌ Pas de commandes PostgreSQL-only (`\echo`, `\set`, etc.)

### 2. Idempotence Quand Possible
```sql
-- ✅ Recommandé
CREATE TABLE IF NOT EXISTS products (...);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
DROP INDEX IF EXISTS idx_old;

-- ❌ Éviter (peut causer erreurs si re-exécuté)
CREATE TABLE products (...);
ALTER TABLE products ADD COLUMN tax_rate NUMERIC(5,2);
```

### 3. Commentaires Obligatoires
```sql
-- Migration: Ajout taux TVA produits
-- Date: 2025-10-17
-- Auteur: Claude Code
-- Contexte: Support multi-taux TVA pour facturation Abby

CREATE TABLE IF NOT EXISTS product_tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  tax_rate NUMERIC(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  -- Taux en pourcentage (ex: 20.00 pour 20%)
  ...
);
```

### 4. RLS Policies Obligatoires (si table)
```sql
-- Toujours créer RLS policies pour nouvelles tables
ALTER TABLE product_tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_rates_select_policy" ON product_tax_rates
  FOR SELECT USING (true);  -- Ajuster selon business rules

CREATE POLICY "tax_rates_insert_policy" ON product_tax_rates
  FOR INSERT WITH CHECK (auth.role() IN ('owner', 'admin'));
```

### 5. Performance Indexes (si table large)
```sql
-- Créer indexes pour colonnes fréquemment utilisées WHERE/JOIN
CREATE INDEX IF NOT EXISTS idx_product_tax_rates_product_id
  ON product_tax_rates(product_id);
```

---

## ⚠️ ARCHIVAGE VS SUPPRESSION

### Règle d'Or
**ARCHIVER > SUPPRIMER**

### Quand Archiver

| Situation | Action |
|-----------|--------|
| Migration remplacée par version ultérieure | ✅ Archiver `archive/YYYY-MM-category/` |
| Rollback explicite appliqué | ✅ Archiver `archive/YYYY-MM-rollbacks/` |
| Iteration debug consolidée | ✅ Archiver `archive/YYYY-MM-debug-iterations/` |
| Experimental jamais appliqué production | ✅ Archiver `archive/experimental/` |
| Migration >12 mois et remplacée | ✅ Archiver `archive/YYYY-phase-name/` |

### Quand Supprimer

| Situation | Action |
|-----------|--------|
| Migration appliquée production | ❌ **JAMAIS SUPPRIMER** |
| Migration test local uniquement | ✅ Supprimer OK (si jamais commit) |
| Migration avec dépendances actives | ❌ **JAMAIS SUPPRIMER** |

---

## 🔧 PROCESS AJOUT MIGRATION

### 1. Trouver Dernier Numéro
```bash
# Lister migrations du jour
ls supabase/migrations/$(date +%Y%m%d)_*.sql 2>/dev/null

# Trouver dernier NNN
ls supabase/migrations/$(date +%Y%m%d)_*.sql 2>/dev/null | tail -1
```

### 2. Créer Fichier
```bash
# Exemple: Si dernier = 20251017_002_*.sql
# Créer 20251017_003_nouvelle_migration.sql
touch supabase/migrations/$(date +%Y%m%d)_003_description.sql
```

### 3. Écrire Migration
- SQL pur
- Commentaires explicatifs
- Idempotent (IF NOT EXISTS)
- RLS policies (si table)
- Indexes (si nécessaire)

### 4. Tester Localement
```bash
supabase db reset   # Reset DB locale
supabase db push    # Appliquer migration
npm run dev         # Vérifier console errors
```

### 5. Commit
```bash
git add supabase/migrations/YYYYMMDD_NNN_*.sql
git commit -m "feat(db): Add DESCRIPTION"
git push
```

---

## 📊 BEST PRACTICES 2025

### Sources Consultées
1. **Supabase Official Docs** : Migration files in supabase/migrations directory
2. **Andrea Leopardi Blog** : "Migrations >12 mois completely irrelevant"
3. **Stack Overflow Senior Devs** : "Archive dans dossier legacy, ne jamais delete"
4. **GitHub Discussions** : Version control + environment separation

### Principes Clés
- **One-way migrations** : Pas de migrations "down" (git rollback suffit)
- **Archive > Delete** : Préserver historique pour audit
- **Cleanup périodique** : Mensuel (migrations >3 mois remplacées)
- **Documentation inline** : Commentaires explicatifs obligatoires
- **Idempotence** : IF NOT EXISTS pour éviter erreurs re-exécution

---

## 🚨 ERREURS COURANTES

### Erreur 1: Fichiers Non-SQL dans migrations/
```bash
# ❌ INTERDIT
supabase/migrations/cleanup-script.sh
supabase/migrations/seed-data.js
supabase/migrations/_TEMPLATE.md

# ✅ CORRECT
scripts/maintenance/cleanup-script.sh
scripts/seeds/seed-data.sql
docs/templates/migration-template.sql
```

### Erreur 2: Naming Inconsistant
```bash
# ❌ INTERDIT (mélange formats)
20251017_001_add_column.sql
20251017_add_another_column.sql      # Manque NNN
20251017-003-fix-issue.sql           # Séparateur incorrect

# ✅ CORRECT (format uniforme)
20251017_001_add_column.sql
20251017_002_add_another_column.sql
20251017_003_fix_issue.sql
```

### Erreur 3: Suppression Migrations Appliquées
```bash
# ❌ DANGER - JAMAIS FAIRE
git rm supabase/migrations/20251015_001_create_table.sql
# Migration déjà appliquée production → perte traçabilité

# ✅ CORRECT - Archiver
git mv supabase/migrations/20251015_001_create_table.sql \
       supabase/migrations/archive/2025-10-obsolete/
```

---

## 📝 CHECKLIST PRE-COMMIT

Avant de commit une nouvelle migration :

- [ ] Naming conforme `YYYYMMDD_NNN_description.sql`
- [ ] Fichier dans `supabase/migrations/` (pas ailleurs)
- [ ] SQL pur (pas de bash/python)
- [ ] Idempotent (IF NOT EXISTS)
- [ ] Commentaires explicatifs
- [ ] RLS policies (si table)
- [ ] Indexes performance (si nécessaire)
- [ ] Testé localement (`supabase db reset && supabase db push`)
- [ ] Aucune erreur console (`npm run dev`)
- [ ] Rollback plan documenté (commentaires)

---

## 🔗 VOIR AUSSI

- **CLAUDE.md** : Section "Database Migrations Convention (Supabase)"
- **supabase/migrations/README.md** : Documentation complète process
- **docs/migrations/ANALYSE-MIGRATIONS-OBSOLETES-2025-10-14.md** : Audit historique

---

**✅ Convention appliquée depuis**: 2025-10-17  
**🎯 Objectif**: Repository maintenable, migrations traçables, best practices 2025

*Vérone Back Office - Professional Database Management*
