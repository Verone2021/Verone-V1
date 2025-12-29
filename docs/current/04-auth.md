---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - apps/back-office/src/lib/supabase/
  - apps/back-office/src/middleware.ts
  - supabase/migrations/*rls*.sql
references:
  - docs/auth/roles-permissions-matrix.md
  - docs/auth/rls-policies.md
  - docs/database/rls-policies.md
---

# Authentification Verone

Supabase Auth + Row Level Security (RLS).

## Roles

| Role | Description | Acces |
|------|-------------|-------|
| `owner` | Proprietaire tenant | Complet + gestion users |
| `admin` | Administrateur | Complet sauf gestion users |
| `catalog_manager` | Gestionnaire catalogue | Produits, categories |
| `sales` | Commercial | Commandes, clients |

### Owner vs Admin (95% identiques)

**Differences uniquement:**
- Owner peut creer/modifier/supprimer utilisateurs
- Owner voit metriques equipe et activite users
- Owner accede a `/admin/users` et `/admin/activite-utilisateurs`

**Tout le reste est identique** (CRUD organisations, products, orders, stocks, exports, delete price_lists).

## Permissions par module

| Module | Owner | Admin | Sales | Catalog |
|--------|-------|-------|-------|---------|
| **Users** | CRUD | Read own | - | - |
| **Organisations** | CRUD | CRUD | Read | Read |
| **Products** | CRUD | CRUD | Read | CRUD |
| **Sales Orders** | CRUD | CRUD | CRUD | Read |
| **Purchase Orders** | CRUD | CRUD | Read | Read |
| **Stock** | CRUD | CRUD | Read | Read |
| **Price Lists** | CRUD | CRUD | Read | Read |
| **Finance** | CRUD | CRUD | Read | - |

## Row Level Security (RLS)

**239 policies** actives sur toutes les tables.

### Principe
```sql
-- Chaque requete est filtree par organisation_id du user
SELECT * FROM products
WHERE organisation_id = auth.jwt() -> 'user_metadata' ->> 'organisation_id'
```

### Tables critiques
- `products`: 12 policies (select, insert, update, delete par role)
- `sales_orders`: 8 policies
- `organisations`: 6 policies
- `user_profiles`: 4 policies (Owner-only pour modifications)

Voir [rls-policies.md](../auth/rls-policies.md) pour details.

## Authentication flow

### Login
```
Email/Password → Supabase Auth → JWT Token → Cookie httpOnly → Middleware check → Dashboard
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

## Tables auth

| Table | Description |
|-------|-------------|
| `auth.users` | Users Supabase (gere par Supabase) |
| `user_profiles` | Profils custom (role, organisation_id, preferences) |
| `user_activity_logs` | Logs activite (Owner-only) |

## Trigger protection Owner

```sql
-- Empeche suppression du dernier Owner
CREATE TRIGGER prevent_last_owner_deletion
BEFORE DELETE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION check_not_last_owner();
```

## Liens

- [Database](./03-database.md) - Schema tables auth
- [Roles/Permissions details](../auth/roles-permissions-matrix.md)
- [RLS Policies](../auth/rls-policies.md)

---

*Derniere verification: 2025-12-17*
