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
- Utiliser localhost:54322 (Docker non utilise)
- Utiliser supabase db push (necessite password interactif)

---

## Regles Absolues

1. **JAMAIS** utiliser Docker pour Supabase
2. **TOUJOURS** utiliser psql avec DATABASE_URL
3. **JAMAIS** demander validation manuelle

---

## References

- `supabase/migrations/` - Fichiers migrations
- `.mcp.env` - Variables environnement
- `docs/current/serena/vercel-no-docker.md` - Workflow Vercel
