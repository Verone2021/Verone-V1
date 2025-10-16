# Migrations Database - Documentation Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

---

## Vue d'Ensemble

Guide complet pour gérer les migrations de base de données Supabase dans le système Vérone. Couvre la création, l'application, le rollback, et les best practices pour maintenir l'intégrité du schéma en production.

---

## Fichiers de cette Section

### Guides Pratiques

- **[applying-changes.md](./applying-changes.md)**
  Procédures détaillées pour appliquer changements schéma (ajout colonne, modification type, etc.)

---

## Workflow Migration Standard

### 1. Créer Migration

```bash
# Générer fichier migration avec timestamp
supabase migration new <nom-descriptif>

# Exemple
supabase migration new add_display_order_to_products
```

### 2. Écrire SQL

```sql
-- Migration: supabase/migrations/20251016_add_display_order.sql

-- Add column
ALTER TABLE products
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing rows
UPDATE products
SET display_order = ROW_NUMBER() OVER (ORDER BY created_at);

-- Add constraint
ALTER TABLE products
ALTER COLUMN display_order SET NOT NULL;
```

### 3. Tester Localement

```bash
# Appliquer migration local
supabase db reset

# Vérifier schéma
supabase db diff
```

### 4. Appliquer Production

```bash
# Via Supabase Dashboard SQL Editor
# OU via CLI (si configuré)
supabase db push
```

---

## Best Practices

### Nomenclature

- **Format** : `YYYYMMDD_description_courte.sql`
- **Exemples** :
  - `20251016_add_display_order_products.sql`
  - `20251015_create_rls_policies_families.sql`
  - `20251014_fix_sort_order_rename.sql`

### Ordre Opérations

1. **Ajouts** (colonnes, tables) AVANT modifications
2. **Migrations données** (UPDATE) en milieu
3. **Contraintes** (NOT NULL, CHECK) À LA FIN
4. **Indexes** en dernier (performance)

### Rollback Strategy

Toujours prévoir migration inverse :

```sql
-- Migration UP
ALTER TABLE products ADD COLUMN new_field text;

-- Migration DOWN (dans commentaire ou fichier séparé)
-- ALTER TABLE products DROP COLUMN new_field;
```

---

## Liens Connexes

- [Schéma Database](/Users/romeodossantos/verone-back-office-V1/docs/database/schema-overview.md)
- [Appliquer Changements](./applying-changes.md)
- [MEMORY-BANK Sessions Migrations](/Users/romeodossantos/verone-back-office-V1/MEMORY-BANK/sessions/)

---

**Retour** : [Documentation Database](/Users/romeodossantos/verone-back-office-V1/docs/database/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
