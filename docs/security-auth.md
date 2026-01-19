# Securite & Authentification Verone

**Derniere mise a jour:** 2026-01-09

Supabase Auth + Row Level Security (RLS).

---

## Roles

| Role              | Description            | Acces                      |
| ----------------- | ---------------------- | -------------------------- |
| `owner`           | Proprietaire tenant    | Complet + gestion users    |
| `admin`           | Administrateur         | Complet sauf gestion users |
| `catalog_manager` | Gestionnaire catalogue | Produits, categories       |
| `sales`           | Commercial             | Commandes, clients         |

### Owner vs Admin (95% identiques)

**Differences uniquement:**

- Owner peut creer/modifier/supprimer utilisateurs
- Owner voit metriques equipe et activite users
- Owner accede a `/admin/users` et `/admin/activite-utilisateurs`

---

## Permissions par Module

| Module          | Owner | Admin    | Sales | Catalog |
| --------------- | ----- | -------- | ----- | ------- |
| Users           | CRUD  | Read own | -     | -       |
| Organisations   | CRUD  | CRUD     | Read  | Read    |
| Products        | CRUD  | CRUD     | Read  | CRUD    |
| Sales Orders    | CRUD  | CRUD     | CRUD  | Read    |
| Purchase Orders | CRUD  | CRUD     | Read  | Read    |
| Stock           | CRUD  | CRUD     | Read  | Read    |
| Price Lists     | CRUD  | CRUD     | Read  | Read    |
| Finance         | CRUD  | CRUD     | Read  | -       |

---

## Row Level Security (RLS)

**239 policies** actives sur toutes les tables.

### Principe

```sql
-- Chaque requete est filtree par organisation_id du user
SELECT * FROM products
WHERE organisation_id = auth.jwt() -> 'user_metadata' ->> 'organisation_id'
```

### Tables Critiques

- `products` - 12 policies (select, insert, update, delete par role)
- `sales_orders` - 8 policies
- `organisations` - 6 policies
- `user_profiles` - 4 policies (Owner-only pour modifications)

---

## Authentication Flow

### Login

```
Email/Password -> Supabase Auth -> JWT Token -> Cookie httpOnly -> Middleware -> Dashboard
```

### Structure JWT

```json
{
  "sub": "user-uuid",
  "role": "authenticated",
  "user_metadata": {
    "role": "owner|admin|sales|catalog_manager",
    "organisation_id": "org-uuid",
    "full_name": "..."
  }
}
```

### Middleware

```typescript
// apps/back-office/src/middleware.ts
// Verifie session Supabase sur chaque requete
// Redirige vers /login si non authentifie
```

---

## Tables Auth

| Table                | Description                            |
| -------------------- | -------------------------------------- |
| `auth.users`         | Users Supabase (gere par Supabase)     |
| `user_profiles`      | Profils custom (role, organisation_id) |
| `user_activity_logs` | Logs activite (Owner-only)             |
| `user_app_roles`     | Roles multi-app (LinkMe)               |

---

## LinkMe Auth (Multi-App)

### Roles LinkMe

| Role               | Description                     |
| ------------------ | ------------------------------- |
| `enseigne_admin`   | Admin d'une chaine (ex: Pokawa) |
| `org_independante` | Organisation autonome           |

### Table user_app_roles

```sql
CREATE TABLE user_app_roles (
  user_id UUID REFERENCES auth.users,
  app TEXT CHECK (app IN ('back-office', 'linkme')),
  role TEXT,
  enseigne_id UUID,
  organisation_id UUID,
  PRIMARY KEY (user_id, app)
);
```

### Sessions Isolees

- Back-office et LinkMe ont des cookies separes
- Un user peut etre connecte aux deux apps simultanement

---

## Protection Owner

```sql
-- Empeche suppression du dernier Owner
CREATE TRIGGER prevent_last_owner_deletion
BEFORE DELETE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION check_not_last_owner();
```

---

## Bonnes Pratiques Securite

1. **Jamais** stocker credentials en clair
2. **Toujours** utiliser les variables d'environnement
3. **Verifier** les RLS avant chaque nouvelle table
4. **Tester** les policies avec differents roles

---

*Source de verite: `supabase/migrations/*rls*.sql`*
