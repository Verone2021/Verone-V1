---
globs: supabase/migrations/**, packages/@verone/types/**
---

# Database (Supabase)

## REGLES IMPERATIVES

- Ne JAMAIS editer une migration existante (append-only)
- Ne JAMAIS utiliser `select("*")` sans `.limit()`
- Ne JAMAIS faire INSERT/UPDATE/DELETE de donnees metier via SQL brut
- Ne JAMAIS recalculer `retrocession_rate` (vient de `margin_rate / 100`)
- Ne JAMAIS referencer `user_profiles.app` (n'existe pas) ni `raw_user_meta_data` (obsolete)
- TOUJOURS activer RLS sur les nouvelles tables
- TOUJOURS executer `python3 scripts/generate-docs.py --db` apres chaque migration
- TOUJOURS lire `docs/current/database/schema/` AVANT de toucher une table
- TOUJOURS regenerer les types apres chaque migration : `supabase gen types typescript`

## STANDARDS

### Migrations

1. Creer fichier `supabase/migrations/YYYYMMDDHHMMSS_nom.sql`
2. Appliquer avec `mcp__supabase__execute_sql`
3. Verifier, regenerer types, mettre a jour docs DB
4. Types centralises dans `packages/@verone/types/`

### Queries

```typescript
// TOUJOURS select explicite + limit
const { data } = await supabase.from('table').select('id, name').limit(10);
```

## RLS — Architecture Multi-App

- **Back-Office** : staff bypass via `is_backoffice_user()` (acces complet)
- **LinkMe** : isolation stricte par `enseigne_id` XOR `organisation_id`
- **Site-Internet** : lecture anonyme selections publiees uniquement

### Pattern Staff (acces complet)

```sql
CREATE POLICY "staff_full_access" ON table_name
  FOR ALL TO authenticated
  USING (is_backoffice_user());
```

### Pattern LinkMe (isolation affilies)

```sql
CREATE POLICY "affiliate_own_data" ON table_name
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme' AND uar.is_active = true
        AND la.id = table_name.affiliate_id
    )
  );
```

### Pattern Site-Internet (public)

```sql
CREATE POLICY "public_read" ON linkme_selections
  FOR SELECT TO anon USING (is_public = true AND status = 'active');
```

### Patterns INTERDITS

```sql
WHERE user_profiles.app = 'back-office'        -- COLONNE N'EXISTE PAS
WHERE user_profiles.role IN ('owner', 'admin')  -- TABLE OBSOLETE
WHERE (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin')  -- FRAGILE
WHERE raw_user_meta_data->>'role' IN ('admin')  -- OBSOLETE
```

### Fonctions Helper

- `is_backoffice_user()` — staff back-office (tout role). SECURITY DEFINER + `SET row_security = off`
- `is_back_office_admin()` — admin back-office uniquement. SECURITY DEFINER + `SET row_security = off`
- Definies dans `20260121_005_fix_user_app_roles_rls_recursion.sql`

### Performance RLS

```sql
WHERE uar.user_id = (SELECT auth.uid())  -- Evalue UNE fois (obligatoire)
WHERE uar.user_id = auth.uid()           -- Evalue N fois (INTERDIT)
```

### Checklist Nouvelle Policy

1. Staff a acces complet via `is_backoffice_user()` ?
2. Affilies LinkMe voient UNIQUEMENT leurs donnees ?
3. Aucune reference a `user_profiles.app` ou `raw_user_meta_data` ?
4. `auth.uid()` wrappe dans `(SELECT ...)` ?
5. Teste avec `mcp__supabase__get_advisors({ type: "security" })` ?
