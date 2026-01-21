# Règles Supabase

## Workflow Migrations

1. Créer migration locale : `supabase migration new nom`
2. Écrire SQL dans `supabase/migrations/YYYYMMDDHHMMSS_nom.sql`
3. Tester local : `supabase db reset`
4. Push cloud : `supabase db push`
5. Jamais éditer migrations existantes (append-only)

## RLS Policies

- TOUJOURS activer RLS sur nouvelles tables
- 1 policy par action (SELECT, INSERT, UPDATE, DELETE)
- Tester avec différents rôles
- Documenter dans `docs/current/database.md`

## Types

- Générer types : `supabase gen types typescript`
- Centraliser dans `packages/verone-types/`
- Jamais éditer types générés manuellement
