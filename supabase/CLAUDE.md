# Supabase - Instructions Claude Code

## Migrations

### Workflow Obligatoire

```bash
# 1. Creer le fichier
Write("supabase/migrations/YYYYMMDD_XXX_description.sql", `...`)

# 2. Appliquer
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/YYYYMMDD_XXX_description.sql

# 3. Verifier
source .mcp.env && psql "$DATABASE_URL" -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY created DESC LIMIT 10;"
```

### Convention Nommage

```
YYYYMMDD_XXX_description.sql
│        │   └── snake_case description
│        └── 001, 002, 003... (ordre du jour)
└── Date (ex: 20260110)
```

---

## Triggers

### Pattern Obligatoire

```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logic
  RETURN NEW;
END;
$$;
```

### Regles

- **TOUJOURS** : `SECURITY DEFINER` + `SET search_path`
- **JAMAIS** : modifier un trigger sans comprendre la cascade
- **VERIFIER** : pas de boucle infinie entre triggers

---

## RLS (Row Level Security)

### Helper Functions

```sql
get_user_role()               -- Role utilisateur courant
get_user_organisation_id()    -- Organisation utilisateur
has_scope(text)               -- Verification scope
```

### Tester RLS

```sql
-- Simuler un role
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid';

-- Executer la query
SELECT * FROM products;

-- Reset
RESET ALL;
```

---

## Colonnes Critiques

| Table         | Colonne attendue (FAUX) | Colonne reelle (CORRECT)           |
| ------------- | ----------------------- | ---------------------------------- |
| organisations | `name`                  | `legal_name`                       |
| products      | `primary_image_url`     | Via `product_images` table         |
| products      | `supplier.name`         | `supplier:supplier_id(legal_name)` |

---

## Regles Absolues

1. **JAMAIS** : Docker, supabase start, supabase db push
2. **TOUJOURS** : psql avec DATABASE_URL
3. **JAMAIS** : bypasser RLS avec service_role sauf necessaire
4. **1 SEULE** : Database (dev = preview = prod)

---

## References

- `docs/current/serena/migrations-workflow.md`
- `docs/current/serena/database-schema-mappings.md`
- `docs/current/serena/database-implementation.md`
