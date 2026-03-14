# RLS Helper Functions Reference

**Derniere mise a jour** : 2026-03-14
**Source** : Migration `20260121_005_fix_user_app_roles_rls_recursion.sql`

---

## Les 4 Fonctions Helper

Toutes les fonctions sont `SECURITY DEFINER` avec `SET row_security = off` pour eviter la recursion RLS infinie.

### 1. `is_backoffice_user()`

**Usage** : Verifier si l'utilisateur a un role back-office actif (n'importe lequel).

```sql
CREATE OR REPLACE FUNCTION is_backoffice_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
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

| Roles inclus | `owner`, `admin`, `sales`, `catalog_manager` |
| Utilisation | **RLS policies** (pattern principal pour acces staff complet) |

**C'est la fonction la plus utilisee dans les RLS policies back-office.**

---

### 2. `is_back_office_admin()`

**Usage** : Verifier si l'utilisateur a le role `admin` back-office **specifiquement**.

```sql
CREATE OR REPLACE FUNCTION is_back_office_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
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

| Roles inclus | `admin` uniquement |
| N'inclut PAS | `owner` (contrairement a ce que le nom pourrait suggerer) |
| Utilisation | RPC functions, triggers (PAS les RLS policies standard) |

**Attention** : Le nom est trompeur. Pour verifier `admin` + `owner`, utiliser `is_back_office_privileged()`.

---

### 3. `is_back_office_privileged()`

**Usage** : Verifier si l'utilisateur est admin OU owner back-office.

```sql
CREATE OR REPLACE FUNCTION is_back_office_privileged()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('admin', 'owner')
      AND is_active = true
  );
$$;
```

| Roles inclus | `admin`, `owner` |
| Utilisation | Operations privilegiees qui doivent inclure le owner |

---

### 4. `is_back_office_owner()`

**Usage** : Verifier si l'utilisateur est le owner back-office.

```sql
CREATE OR REPLACE FUNCTION is_back_office_owner()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role = 'owner'
      AND is_active = true
  );
$$;
```

| Roles inclus | `owner` uniquement |
| Utilisation | Routes `/admin/**`, operations systeme |

---

## Matrice de Comparaison

| Fonction                      | owner | admin | sales | catalog_manager |
| ----------------------------- | ----- | ----- | ----- | --------------- |
| `is_backoffice_user()`        | oui   | oui   | oui   | oui             |
| `is_back_office_admin()`      | —     | oui   | —     | —               |
| `is_back_office_privileged()` | oui   | oui   | —     | —               |
| `is_back_office_owner()`      | oui   | —     | —     | —               |

**Regle** : Pour les RLS policies, toujours utiliser `is_backoffice_user()` (acces staff complet). Les autres fonctions sont pour des cas specifiques (RPC, triggers, guards).

---

## Historique : Renommage `org_independante` -> `organisation_admin`

### Contexte

Le role LinkMe `org_independante` a ete renomme en `organisation_admin` via la migration `20260212134431_rename_org_independante_to_organisation_admin.sql`.

### Ce que la migration fait

1. **UPDATE data** : Tous les `user_app_roles` avec `role = 'org_independante'` deviennent `role = 'organisation_admin'`
2. **UPDATE CHECK constraint** : La contrainte `valid_linkme_role` accepte `('enseigne_admin', 'organisation_admin')` (plus tard etendu a `'enseigne_collaborateur'`)
3. **Recreate RLS policies** : Policies mises a jour avec le nouveau nom

### References obsoletes dans les anciennes migrations

Les migrations anterieures au 2026-02-12 contiennent encore des references a `org_independante`. C'est **normal et inoffensif** :

- Les migrations sont append-only (jamais editees apres application)
- Le renommage en BD est applique par la migration 20260212
- Les RLS policies actuelles utilisent uniquement `organisation_admin`

### Etat actuel des roles LinkMe

| Role                     | Statut    | Depuis                                       |
| ------------------------ | --------- | -------------------------------------------- |
| `enseigne_admin`         | Actif     | 2025-12-01                                   |
| `organisation_admin`     | Actif     | 2026-02-12 (ex `org_independante`)           |
| `enseigne_collaborateur` | Actif     | 2026-03-14                                   |
| `org_independante`       | Obsolete  | Renomme en `organisation_admin`              |
| `client`                 | Abandonne | Jamais implemente, supprime de la contrainte |

### Code TypeScript

Le type `LinkMeRole` dans `apps/linkme/src/contexts/AuthContext.tsx` est correctement defini :

```typescript
export type LinkMeRole =
  | 'enseigne_admin'
  | 'organisation_admin'
  | 'enseigne_collaborateur';
```

Aucune reference a `org_independante` dans le code TypeScript.

---

**Derniere mise a jour** : 2026-03-14 par Claude (audit RLS)
