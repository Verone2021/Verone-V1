---
name: schema-sync
description: Reference rapide du schema DB Supabase. Interroge la DB pour afficher tables, colonnes, FK, RLS d'un domaine. Consultation sans modification.
---

# Schema Sync — Reference DB Rapide

**Quand utiliser** : Avant d'implementer une feature, pour connaitre le schema exact d'un domaine sans fouiller les migrations.

## NOUVEAU : Documentation DB pre-generee disponible

Avant d'executer des requetes SQL, verifier si la documentation existe deja :

- `docs/current/database/schema/00-SUMMARY.md` — resume global
- `docs/current/database/schema/01-organisations.md` a `04-autres.md` — documentation par domaine

Si la doc existe et est a jour, la LIRE au lieu d'executer des requetes SQL. N'executer des requetes que si la doc est absente ou si tu as besoin de donnees temps reel.

## Usage

Specifier un domaine ou une table :

- `schema-sync commandes` → tables sales_orders, order_items, order_status_history
- `schema-sync linkme` → tables linkme\_\*, user_app_roles, organisations
- `schema-sync products` → tables products, product_images, product_variants

## Queries a executer (via mcp**supabase**execute_sql)

### 1. Tables du domaine

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%<PATTERN>%'
ORDER BY table_name;
```

### 2. Schema detaille (pour chaque table trouvee)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABLE>'
ORDER BY ordinal_position;
```

### 3. Foreign Keys

```sql
SELECT tc.constraint_name, kcu.column_name,
       ccu.table_name AS fk_table, ccu.column_name AS fk_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '<TABLE>';
```

### 4. RLS Policies

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies WHERE tablename = '<TABLE>';
```

### 5. Triggers

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = '<TABLE>';
```

## Format de sortie

```
## <table_name>
Colonnes: id (uuid PK), name (text), created_at (timestamptz), ...
FK: organisation_id → organisations.id, product_id → products.id
RLS: staff_full_access (ALL), affiliate_own_data (SELECT)
Triggers: update_updated_at, calculate_totals
```

## Regles

- **READ-ONLY** : aucune modification de donnees ou de schema
- **Parallele** : lancer toutes les queries en parallele pour chaque table
- **Compact** : presenter un resume, pas un dump brut
