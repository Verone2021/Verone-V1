# RLS Patterns Standards Verone

**Version** : 2026-01-30
**Status** : DOCUMENTATION CANONIQUE (source de vérité unique)

## Architecture Multi-Application

Verone utilise une architecture multi-app avec isolation RLS :

- **Back-Office** : Staff Verone (accès complet)
- **LinkMe** : Affiliés (isolation stricte)
- **Site-Internet** : Public (accès lecture seule sélections publiées)

---

## Back-Office Staff (ACCÈS COMPLET)

### Principe

Le staff Back-Office **BYPASS** les restrictions RLS pour avoir un accès complet aux données.

### Tables de référence

- `user_app_roles` (app='back-office', role='owner'|'admin'|'sales'|'catalog_manager')
- Fonctions helper : `is_backoffice_user()`, `is_back_office_admin()`

### Pattern Standard (OBLIGATOIRE)

```sql
-- Pour accès complet staff (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "staff_full_access" ON table_name
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Pour accès limité aux admins uniquement
CREATE POLICY "admin_only" ON table_name
  FOR DELETE TO authenticated
  USING (is_back_office_admin());
```

### ❌ Patterns INTERDITS

```sql
-- ❌ COLONNE N'EXISTE PAS
WHERE user_profiles.app = 'back-office'

-- ❌ TABLE OBSOLÈTE POUR RÔLES
WHERE user_profiles.role IN ('owner', 'admin')

-- ❌ NON STANDARD, FRAGILE
WHERE (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin')

-- ❌ NON STANDARD, FRAGILE
WHERE raw_user_meta_data->>'role' IN ('admin', 'staff')
```

---

## LinkMe Affiliés (ISOLATION STRICTE)

### Principe

Chaque affilié LinkMe voit **UNIQUEMENT** ses propres données via `enseigne_id` XOR `organisation_id`.

### Tables de référence

- `user_app_roles` (app='linkme', role='enseigne_admin'|'org_independante')
- `linkme_affiliates` (enseigne_id XOR organisation_id)

### Pattern Standard (OBLIGATOIRE)

```sql
-- Affiliés voient uniquement LEURS données
CREATE POLICY "affiliate_own_data" ON table_name
  FOR SELECT TO authenticated
  USING (
    -- Staff back-office voit tout
    is_backoffice_user()
    OR
    -- Affilié voit ses données via enseigne_id OU organisation_id
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN linkme_affiliates la ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR
        (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND la.id = table_name.affiliate_id  -- Lien avec la table
    )
  );
```

### Cas Spéciaux

#### Sélections publiques (lecture anonyme)

```sql
CREATE POLICY "public_read_published" ON linkme_selections
  FOR SELECT TO anon, authenticated
  USING (is_public = true AND status = 'active');
```

#### Organisations (enseigne_admin voit toutes ses orgs)

```sql
CREATE POLICY "enseigne_sees_all_orgs" ON organisations
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          -- Enseigne admin voit toutes les orgs de son enseigne
          (uar.role = 'enseigne_admin'
           AND uar.enseigne_id IS NOT NULL
           AND uar.enseigne_id = organisations.enseigne_id)
          OR
          -- Org indépendante voit uniquement sa propre org
          (uar.role = 'org_independante'
           AND uar.organisation_id IS NOT NULL
           AND uar.organisation_id = organisations.id)
        )
    )
  );
```

---

## Site-Internet Public (LECTURE SEULE)

### Principe

Accès anonyme limité aux sélections publiées et produits associés.

### Pattern Standard

```sql
CREATE POLICY "public_read_active_selections" ON linkme_selections
  FOR SELECT TO anon
  USING (is_public = true AND status = 'active');

CREATE POLICY "public_read_selection_items" ON linkme_selection_items
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM linkme_selections ls
      WHERE ls.id = linkme_selection_items.selection_id
        AND ls.is_public = true
        AND ls.status = 'active'
    )
  );
```

---

## Fonctions Helper (Référence)

### is_backoffice_user()

**Définition** : `supabase/migrations/20260121_005_fix_user_app_roles_rls_recursion.sql`

```sql
CREATE OR REPLACE FUNCTION is_backoffice_user()
RETURNS BOOLEAN
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND is_active = true
  );
$$;
```

**Usage** : Vérifier si user est staff back-office (n'importe quel rôle).

### is_back_office_admin()

**Définition** : `supabase/migrations/20260121_005_fix_user_app_roles_rls_recursion.sql`

```sql
CREATE OR REPLACE FUNCTION is_back_office_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role = 'admin'
      AND is_active = true
  );
$$;
```

**Usage** : Vérifier si user est admin back-office spécifiquement.

---

## Performance & Sécurité

### Wrapper auth.uid()

**Pattern obligatoire** :

```sql
WHERE uar.user_id = (SELECT auth.uid())  -- ✅ Évalué UNE fois
WHERE uar.user_id = auth.uid()           -- ❌ Évalué N fois (lent)
```

### SECURITY DEFINER

Toutes les fonctions helper doivent utiliser :

```sql
SECURITY DEFINER
SET row_security = off  -- Évite récursion RLS infinie
```

---

## Validation

### Checklist Nouvelle Policy

Avant de créer une policy RLS :

- [ ] Staff back-office a accès complet (`is_backoffice_user()`) ?
- [ ] Affiliés LinkMe voient uniquement LEURS données ?
- [ ] Aucune référence à `user_profiles.app` (n'existe pas) ?
- [ ] Aucune référence à `raw_user_meta_data` (obsolète) ?
- [ ] Performance : `auth.uid()` wrappé dans `(SELECT ...)` ?
- [ ] Testé avec `mcp__supabase__get_advisors({ type: "security" })` ?

---

## Exemples Complets

Voir migrations de référence :

- `20260121_005_fix_user_app_roles_rls_recursion.sql` - Helper functions
- `20260126_001_fix_rls_pattern_staff.sql` - Pattern staff correct
- `20251205_002_rls_linkme_selections.sql` - Pattern LinkMe (après correction)
