# Workflow Migrations Supabase

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- supabase/migrations/
- .mcp.env
  Owner: Romeo Dos Santos
  Created: 2025-12-28
  Updated: 2026-01-10

---

## Regle Absolue

**TOUJOURS appliquer les migrations via psql avec $DATABASE_URL depuis .mcp.env**
**NE JAMAIS demander a l'utilisateur de le faire manuellement**

---

## Workflow

### 1. Creer le fichier migration

```bash
Write("supabase/migrations/YYYYMMDD_XXX_description.sql", `
-- Migration content
`)
```

### 2. Appliquer DIRECTEMENT via psql

```bash
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/YYYYMMDD_XXX_description.sql
```

### 3. Verifier application

```bash
source .mcp.env && psql "$DATABASE_URL" -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY created DESC LIMIT 10;"
```

---

## Fichier .mcp.env

Contient `DATABASE_URL` avec connection string Supabase cloud :

- **Project ID** : aorroydfjsrygmosnzrl
- **Region** : eu-west-3 (AWS Paris)
- **Mode** : Pooler Session

---

## Commandes Utiles

```bash
# Appliquer migration
source .mcp.env && psql "$DATABASE_URL" -f path/to/migration.sql

# Query rapide
source .mcp.env && psql "$DATABASE_URL" -c "SELECT ..."

# Verifier tables
source .mcp.env && psql "$DATABASE_URL" -c "\dt public.*"

# Verifier fonctions
source .mcp.env && psql "$DATABASE_URL" -c "\df public.*"
```

---

## Erreurs a Ne Jamais Commettre

- Demander a l'utilisateur d'appliquer via Dashboard
- Dire "je n'ai pas le mot de passe"
- Utiliser localhost (toujours cloud)
- Utiliser supabase db push (necessite password interactif)

---

## Regles Absolues

1. **TOUJOURS** utiliser Supabase Cloud
2. **TOUJOURS** utiliser psql avec DATABASE_URL
3. **JAMAIS** demander validation manuelle

---

## Historique du carnet de suivi (schema_migrations) — réaligné 2026-07-23

**Cause racine de la désynchronisation** : appliquer une migration via `psql -f`
(ou via `mcp__supabase__execute_sql`) applique bien le SQL en base mais **n'écrit
PAS** de ligne dans `supabase_migrations.schema_migrations`. Résultat : au
2026-07-23, la base contenait 770 fichiers de migration appliqués mais le carnet
de suivi n'en enregistrait que **14**. Rien n'était cassé (tous les effets étaient
en base), mais l'outil `supabase db push` aurait cru devoir tout rejouer.

**Réalignement 2026-07-23** : le carnet a été complété (14 → 435 lignes) pour
enregistrer toutes les versions de migration présentes en local (étiquetage pur,
sauvegarde `supabase_migrations.schema_migrations_backup_20260723`). Détail dans
`docs/scratchpad/dev-report-2026-07-23-migrations-realign.md`.

**Limite connue** : 418 fichiers utilisent l'ancien format `AAAAMMJJ_NNN` (au lieu
du format standard `AAAAMMJJHHMMSS`). Plusieurs fichiers d'un même jour se ramènent
au même identifiant de version pour l'outil (76 groupes). Tant que ces fichiers ne
sont pas renommés au format 14 chiffres, **`supabase db push` reste déconseillé**.
On continue d'appliquer via `execute_sql`/`psql`.

**Recommandation pour toute nouvelle migration** : (1) nommer au format standard
`AAAAMMJJHHMMSS_description.sql` ; (2) après application, enregistrer la ligne dans
le carnet :
`INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('<14 chiffres>', '<description>') ON CONFLICT (version) DO NOTHING;`

## References

- `supabase/migrations/` - Fichiers migrations
- `.mcp.env` - Variables environnement
- `docs/current/serena/vercel-workflow.md` - Workflow Vercel
