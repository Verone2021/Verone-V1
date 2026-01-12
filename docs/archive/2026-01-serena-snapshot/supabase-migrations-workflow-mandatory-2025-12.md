# WORKFLOW OBLIGATOIRE : Migrations Supabase

**Date** : 2025-12-28
**Contexte** : Convention établie pour application automatique des migrations

---

## RÈGLE ABSOLUE

**TOUJOURS appliquer les migrations via psql avec $DATABASE_URL depuis .mcp.env**
**NE JAMAIS demander à l'utilisateur de le faire manuellement**

---

## WORKFLOW

### 1. Créer le fichier migration

```bash
Write("supabase/migrations/YYYYMMDD_XXX_description.sql", `
-- Migration content
`)
```

### 2. Appliquer DIRECTEMENT via psql

```bash
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/YYYYMMDD_XXX_description.sql
```

### 3. Vérifier application

```bash
source .mcp.env && psql "$DATABASE_URL" -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY created DESC LIMIT 10;"
```

---

## FICHIER .mcp.env

Contient `DATABASE_URL` avec connection string Supabase cloud :

- **Project ID** : aorroydfjsrygmosnzrl
- **Region** : eu-west-3 (AWS Paris)
- **Mode** : Pooler Session

---

## ERREURS À NE JAMAIS COMMETTRE

- ❌ Demander à l'utilisateur d'appliquer via Dashboard
- ❌ Dire "je n'ai pas le mot de passe"
- ❌ Utiliser localhost:54322 (Docker non utilisé)
- ❌ Utiliser supabase db push (nécessite password interactif)

---

## COMMANDES UTILES

```bash
# Appliquer migration
source .mcp.env && psql "$DATABASE_URL" -f path/to/migration.sql

# Query rapide
source .mcp.env && psql "$DATABASE_URL" -c "SELECT ..."

# Vérifier tables
source .mcp.env && psql "$DATABASE_URL" -c "\dt public.*"

# Vérifier fonctions
source .mcp.env && psql "$DATABASE_URL" -c "\df public.*"
```

---

**Auteur** : Claude Code
**Validé** : 2025-12-28
