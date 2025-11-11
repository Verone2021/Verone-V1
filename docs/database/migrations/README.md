# Migrations Database - Documentation Vérone

**Dernière mise à jour** : 2025-10-25
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

---

## Vue d'Ensemble

Guide complet pour gérer les migrations de base de données Supabase dans le système Vérone. Couvre la création, l'application, le rollback, et les best practices pour maintenir l'intégrité du schéma en production.

---

## Migrations Récentes (Novembre 2025)

### 2025-11-10 : CASCADE DELETE Notifications (001)

**Fichier** : `20251110_001_notifications_cascade_delete_system.sql`

**Objectif** : Suppression automatique notifications orphelines lorsque l'entité liée est supprimée

**Modifications** :

- `notifications` : +3 colonnes FK optionnelles (`related_product_id`, `related_sales_order_id`, `related_purchase_order_id`)
- **Contrainte** : `check_single_related_entity` - Une notification = max UNE entité
- **Indexes** : 3 indexes partiels (WHERE column IS NOT NULL)
- **Fonction** : `create_notification_for_owners()` - Mise à jour avec paramètres FK
- **Fonction** : `cleanup_old_notifications()` - Nettoyage notifications lues >30j + orphelines legacy >7j
- **ON DELETE CASCADE** : Suppression automatique PostgreSQL

**Impact** :

- +3 colonnes database
- +3 indexes partiels
- +1 contrainte CHECK
- 2 fonctions mises à jour

**Application** :

⚠️ **Application manuelle requise** (sync issues avec migrations remote)

- Via Supabase Dashboard SQL Editor (recommandé)
- Guide complet : [`20251110_001_README_CASCADE_DELETE.md`](../../../supabase/migrations/20251110_001_README_CASCADE_DELETE.md)

**Documentation** :

- [cascade-delete-notifications.md](../cascade-delete-notifications.md) - Architecture technique
- [Business Rules: CASCADE DELETE](../../business-rules/15-notifications/cascade-delete-system.md) - Règles métier
- [Triggers Commandes](../../business-rules/07-commandes/notifications-workflow.md) - Workflow notifications commandes

---

## Migrations Récentes (Octobre 2025)

### 2025-10-25 : Système Ristourne B2B (002)

**Fichier** : `20251025_002_add_retrocession_system.sql`

**Objectif** : Ajout système de commission (ristourne) calculée par ligne de commande

**Modifications** :

- `customer_pricing` : +1 colonne (`retrocession_rate`)
- `sales_order_items` : +2 colonnes (`retrocession_rate`, `retrocession_amount`)
- **Trigger** : `trg_calculate_retrocession` - Calcul automatique du montant
- **Fonction** : `calculate_retrocession_amount()` - Logique de calcul
- **RPC** : `get_order_total_retrocession(order_id)` - Commission totale commande

**Impact** :

- +3 colonnes database (total: 1342)
- +1 trigger (total: 159)
- +1 fonction RPC (total: 256)

**Documentation** :

- [pricing-architecture.md](../pricing-architecture.md) - Règle 6
- [triggers.md](../triggers.md) - trg_calculate_retrocession
- [functions-rpc.md](../functions-rpc.md) - get_order_total_retrocession()

### 2025-10-22 : Identité Légale Organisations (001)

**Fichier** : `20251022_001_legal_trade_names_siren.sql`

**Objectif** : Conformité factures avec obligation SIREN (loi juillet 2024)

**Modifications** :

- Ajout `legal_name`, `trade_name`, `has_different_trade_name`
- Ajout `siren` (9 chiffres), `siret` (14 chiffres)
- Migration données automatique : `legal_name` ← ancien `name`

**Documentation** : [note-migration-legal-name-2025-10-22.md](./note-migration-legal-name-2025-10-22.md)

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
