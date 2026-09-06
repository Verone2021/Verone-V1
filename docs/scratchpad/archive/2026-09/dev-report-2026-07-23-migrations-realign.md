# Dev report — Réalignement du carnet de migrations Supabase

Date : 2026-07-23
Contexte : `supabase_migrations.schema_migrations` ne contenait que **14 lignes** alors que 770 fichiers de migration sont appliqués en base. Cause racine : application via `psql -f` / `execute_sql` qui n'écrit pas dans le carnet (cf. `docs/current/serena/migrations-workflow.md`). Rien de cassé — base saine, tous les effets appliqués. Décision Roméo : « réaligner en une fois » (étiquetage pur, réversible).

## Constat mesuré

- 770 fichiers `supabase/migrations/*.sql`. **352** au format standard 14 chiffres, **418** à l'ancien format `AAAAMMJJ_NNN`.
- Dérivation version façon CLI (`^(\d+)_`) → **431 versions distinctes** (76 groupes de collision, ex. `20251124_001..012` → `20251124`).
- Carnet avant : 14 lignes (dont 4 sans fichier local dérivant exactement : `20260211002`, `20260213_001`, `20260505100000`, `20260505200000`).

## Opération (mcp**supabase**execute_sql)

1. Sauvegarde : `CREATE TABLE supabase_migrations.schema_migrations_backup_20260723 AS SELECT * FROM ...` (14 lignes).
2. `INSERT ... (version, name)` de **421 lignes** manquantes, `ON CONFLICT (version) DO NOTHING`.
3. Vérif : carnet = **435 lignes** (431 versions dérivées + 4 remote-only). Backup intact (14).

Script générateur : `scratchpad/build-migration-repair.mjs` + `migration-repair-insert.sql` (jetables).

## Limite connue (honnête)

`supabase db push` **n'est pas rendu pleinement utilisable** : les 418 fichiers ancien format (76 collisions) empêchent une correspondance 1-à-1. Le rendre utilisable exigerait de renommer ~418 fichiers au format 14 chiffres (lourd, risqué, append-only) — non fait, non recommandé (workflow réel = `execute_sql`, pas `push`). La règle « pas de `db push` en aveugle » reste valable ; le gain ici = carnet fidèle à la réalité + suppression du risque « rejeu de tout depuis zéro ».

## Rollback

`DELETE` des versions insérées puis restauration depuis `schema_migrations_backup_20260723`. Aucune donnée métier concernée.

## Suite recommandée

Toute nouvelle migration : nom au format 14 chiffres + enregistrement immédiat dans le carnet (cf. note ajoutée à `migrations-workflow.md`).
