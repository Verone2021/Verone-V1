---
name: database-aware
description: Vérification automatique du schéma DB réel avant toute modification de code qui interagit avec Supabase.
autoApply: true
---

# Connaissance base de données

## Quand s'applique

- Code qui utilise `supabase.from('table')`
- Code qui utilise `.select()`, `.insert()`, `.update()`, `.delete()`
- Hooks qui fetchent des données
- Types qui représentent des lignes de table

## Avant de modifier : vérifier le schéma réel

```sql
-- Colonnes d'une table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME'
ORDER BY ordinal_position;
```

```sql
-- RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'TABLE_NAME';
```

```sql
-- Relations (foreign keys)
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'TABLE_NAME' AND tc.constraint_type = 'FOREIGN KEY';
```

## Erreurs courantes à éviter

- Supposer qu'une colonne existe → VÉRIFIER avec la requête ci-dessus
- Utiliser `select('*')` → TOUJOURS lister les colonnes explicitement
- Supposer qu'un champ est NOT NULL → vérifier `is_nullable`
- Oublier les RLS policies → une requête peut retourner 0 résultats à cause des policies

## Types Supabase

Les types générés sont dans `packages/@verone/types/src/supabase.ts`.
Utiliser `Database['public']['Tables']['table']['Row']` pour typer les données.
