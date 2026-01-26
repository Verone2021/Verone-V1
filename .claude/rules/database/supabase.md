# Règles Supabase

## Workflow Migrations

1. Créer migration locale : `supabase migration new nom`
2. Écrire SQL dans `supabase/migrations/YYYYMMDDHHMMSS_nom.sql`
3. Tester local : `supabase db reset`
4. Push cloud : `supabase db push`
5. Jamais éditer migrations existantes (append-only)

## RLS Policies

- TOUJOURS activer RLS sur nouvelles tables
- 1 policy par action (SELECT, INSERT, UPDATE, DELETE)
- Tester avec différents rôles : `/db rls-test <table> <role>`
- Documenter dans `docs/current/database.md`

### Pattern Standard

```sql
-- SELECT: Authenticated users can read
CREATE POLICY "allow_read_authenticated" ON "public"."table_name"
FOR SELECT TO authenticated USING (true);

-- INSERT: Users can insert their own data
CREATE POLICY "allow_insert_own" ON "public"."table_name"
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own data
CREATE POLICY "allow_update_own" ON "public"."table_name"
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- DELETE: Users can delete their own data
CREATE POLICY "allow_delete_own" ON "public"."table_name"
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

## Query Patterns

### Correct Usage

```typescript
// ✅ Utiliser le client Supabase
const { data, error } = await supabase
  .from("products")
  .select("id, name, price")
  .eq("category_id", categoryId)
  .order("created_at", { ascending: false })
  .limit(10)

// ✅ Avec relations
const { data } = await supabase
  .from("orders")
  .select(`
    id,
    status,
    customer:customers(name, email),
    items:order_items(product_id, quantity)
  `)
```

### Éviter

```typescript
// ❌ Select * (trop de données)
.select("*")

// ❌ Sans limit sur grandes tables
.from("products").select()

// ❌ SQL brut sans raison
await supabase.rpc("raw_sql_query")
```

## Error Handling

```typescript
const { data, error } = await supabase.from("table").select()

if (error) {
  console.error("Supabase error:", error.message)
  // Handle gracefully, don't throw
  return { error: error.message }
}
```

## Types

- Générer types : `supabase gen types typescript` ou `/db types`
- Centraliser dans `packages/@verone/types/`
- Jamais éditer types générés manuellement
- Regénérer après chaque migration

## Indexes

- Index sur colonnes fréquemment filtrées
- Index sur foreign keys
- Vérifier avec `/db advisors performance`
