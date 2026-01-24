# /db - Opérations Supabase Rapides

Shortcuts pour opérations database courantes : queries, migrations, logs, advisors.

## Usage

```bash
/db <operation> [args]
```

## Operations Disponibles

### 1. Query Rapide

```bash
/db query "SELECT * FROM products LIMIT 10"
```

**Exécution:**

- Connection string pooler Supabase (IPv4 + IPv6)
- `psql "${DATABASE_URL}" -c "SELECT ..."` (DATABASE_URL depuis .mcp.env)
- Résultat formaté en table lisible

**Use Cases:**

- Vérifier données rapidement
- Debug valeurs database
- Tester queries avant intégration

### 2. Logs Analysis

```bash
/db logs [service] [limit]
```

**Services disponibles:**

- `api` - Erreurs API backend (default)
- `postgres` - Erreurs PostgreSQL
- `auth` - Erreurs authentification
- `realtime` - Erreurs subscriptions temps réel
- `storage` - Erreurs upload/download fichiers

**Exemples:**

```bash
/db logs api 50         # 50 derniers logs API
/db logs postgres       # Logs PostgreSQL (default 20)
/db logs auth 100       # 100 derniers logs auth
```

**Output:**

- Timestamp + Severity + Message
- Erreurs groupées par type
- Suggestions fix si patterns connus

### 3. Migrations Management

```bash
/db migrations [action]
```

**Actions:**

- `list` - Liste toutes migrations (applied + pending)
- `status` - Statut migrations (up-to-date ou pending)
- `latest` - Afficher dernière migration appliquée
- `plan` - Dry-run prochaine migration

**Exemples:**

```bash
/db migrations list     # Toutes migrations
/db migrations status   # Statut synchronisation
/db migrations latest   # Dernière appliquée
```

**Safety Checks:**

- ⚠️ Warning si migrations pending
- 🚨 Alert si schema drift détecté
- ✅ Confirmation si up-to-date

### 4. Security & Performance Advisors

```bash
/db advisors [focus]
```

**Focus areas:**

- `security` - RLS policies, auth, permissions
- `performance` - Indexes, queries, optimizations
- `all` - Complet (default)

**Exécution:**

```bash
# Security advisors
psql "${DATABASE_URL}" -c "
SELECT * FROM pg_policies WHERE schemaname = 'public';
"

# Performance advisors
psql "${DATABASE_URL}" -c "
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
"
```

**Output:**

```
🔒 SECURITY ADVISORS
  ⚠️ Table 'orders' missing RLS policy
  → Recommendation: Add policy for authenticated users

⚡ PERFORMANCE ADVISORS
  🐌 Query slow: SELECT * FROM products (2.3s)
  → Recommendation: Add index on products(category_id)

✅ Total: 2 recommendations
```

### 5. Schema Inspection

```bash
/db schema [table]
```

**Sans argument:**

- Liste toutes les tables public schema
- Nombre de colonnes par table
- RLS enabled status

**Avec table spécifique:**

```bash
/db schema products
```

**Output:**

```
Table: products
Columns: 15
RLS: ✅ Enabled

Columns:
- id (uuid, primary key)
- name (text, not null)
- sku (text, unique)
- price (numeric)
- created_at (timestamp)
[...]

Indexes:
- products_pkey (id)
- products_sku_key (sku)
- idx_products_category (category_id)

RLS Policies:
- allow_read_authenticated
- allow_insert_owner
- allow_update_owner
```

### 6. Types Generation

```bash
/db types
```

**Exécution:**

```bash
# Méthode officielle Supabase
# Token disponible dans .mcp.env (non committé)
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}" \
npx supabase@latest gen types typescript --project-id aorroydfjsrygmosnzrl \
> apps/back-office/src/types/supabase.ts

# Copier vers packages
cp apps/back-office/src/types/supabase.ts packages/@verone/types/src/supabase.ts
```

**Actions:**

- Génère types TypeScript depuis schema
- Sauvegarde dans `src/types/supabase.ts`
- Update imports si nécessaire

**Output:**

```typescript
// src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          sku: string | null;
          // ...
        };
        Insert: {
          id?: string;
          name: string;
          // ...
        };
        Update: {
          name?: string;
          // ...
        };
      };
      // ...
    };
  };
}
```

**Use Cases:**

- Après migration database
- Quand types désynchronisés
- Setup initial projet

### 7. RLS Testing

```bash
/db rls-test <table> <role>
```

**Roles:**

- `anon` - Utilisateur non-authentifié
- `authenticated` - Utilisateur authentifié
- `owner` - Owner role
- `admin` - Admin role

**Exemples:**

```bash
/db rls-test products anon
```

**Test Execution:**

- SELECT test avec role
- INSERT test avec role
- UPDATE test avec role
- DELETE test avec role

**Output:**

```
RLS Test: products (role: anon)

SELECT: ✅ PASS (10 rows returned)
INSERT: ❌ FAIL (Permission denied)
UPDATE: ❌ FAIL (Permission denied)
DELETE: ❌ FAIL (Permission denied)

✅ RLS policies working as expected for anon
```

### 8. Quick Stats

```bash
/db stats
```

**Metrics:**

```sql
-- Nombre total par table
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;
```

**Output:**

```
📊 Database Quick Stats

Tables (Top 10 by rows):
1. products: 2,847 rows
2. orders: 1,234 rows
3. customers: 892 rows
4. product_images: 645 rows
[...]

Storage:
- Total size: 45.2 MB
- Largest table: products (18.3 MB)

Activity (Last 24h):
- Queries: ~12,450
- Inserts: 234
- Updates: 567
- Deletes: 12
```

## Auto-Connection Logic

**Priority Order:**

1. Read `DATABASE_URL` from `.env.local` (line 19)
2. Parse connection string
3. Try Session Pooler (port 5432) first
4. Fallback Direct Connection (port 6543) if timeout
5. Cache credentials for session

**Connection String (TOUJOURS utiliser celle-ci):**

```bash
# Connection disponible dans .mcp.env (non committé)
${DATABASE_URL}

# Format complet (si besoin)
postgresql://postgres.aorroydfjsrygmosnzrl:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

**Détails:**

- **Mode**: Pooler Session (IPv4 + IPv6)
- **Project**: aorroydfjsrygmosnzrl
- **Region**: eu-west-3 (AWS Paris)
- **TOUJOURS** Supabase Cloud

## Error Handling

### Connection Failed

```
❌ Database connection failed
→ Check .env.local exists
→ Verify DATABASE_URL correct
→ Test network connectivity
→ Try direct connection (6543) if pooler fails
```

### Query Error

```
❌ Query failed: syntax error at "FORM"
→ Fix SQL syntax
→ Verify table/column names
→ Check permissions (RLS)
```

### Migration Pending

```
⚠️ 3 migrations pending
→ Review migrations in supabase/migrations/
→ Apply via Supabase Studio or CLI
→ Generate types after: /db types
```

## Best Practices

### ✅ DO

- Use `/db query` pour vérifications rapides
- Run `/db advisors` après migrations
- Generate types après schema changes
- Test RLS policies avant production
- Monitor logs régulièrement

### ❌ DON'T

- Jamais DROP tables en production via /db query
- Pas de queries destructives sans backup
- Éviter SELECT \* sur large tables sans LIMIT
- Ne pas ignorer security advisors
- Pas de hardcoded credentials

## Examples

### Debug Produit Manquant

```bash
/db query "SELECT id, name, sku FROM products WHERE sku = 'PROD-123'"
```

### Vérifier RLS Orders

```bash
/db rls-test orders authenticated
```

### Check Performance Catalogue

```bash
/db advisors performance
# Résultat: "Add index on products(category_id)"

/db query "CREATE INDEX idx_products_category ON products(category_id)"
/db advisors performance
# ✅ Recommendation resolved
```

### Après Migration

```bash
/db migrations status
# ⚠️ 1 migration pending

# Appliquer via Supabase Studio/CLI
# Puis:

/db types
# ✅ Types generated

/db advisors
# ✅ Check security/performance
```

**AVANTAGE : Opérations database en 1 commande au lieu de 5+ étapes !**
