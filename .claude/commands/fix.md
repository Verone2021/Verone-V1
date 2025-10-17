# /fix - Debug Guidé Multi-Agents

Debug intelligent avec orchestration automatique : Console + Serena + Supabase + Playwright.

## Usage
```bash
/fix [error-description]
```

## Debug Workflow Intelligent

### 1. Error Detection & Classification

**Sans description fournie:**
- Lancer `/error-check` automatiquement
- Détecter erreurs console actives
- Prioriser par severity (CRITICAL > HIGH > MEDIUM)

**Avec description fournie:**
- Parser description pour identifier type erreur
- Catégoriser : Frontend | Backend | Database | Network

**Error Types:**
```typescript
type ErrorCategory =
  | 'javascript'      // Console errors, React errors
  | 'api'            // 400/500 errors, fetch failed
  | 'database'       // SQL errors, RLS denials
  | 'performance'    // Slow queries, timeout
  | 'ui'             // Layout bugs, rendering issues
  | 'auth'           // Login failed, permissions
```

### 2. Multi-Agent Orchestration

**Frontend Errors (JavaScript/React):**
```typescript
// 1. Playwright: Reproduire erreur
mcp__playwright__browser_navigate(url)
mcp__playwright__browser_console_messages()

// 2. Serena: Localiser source
mcp__serena__find_symbol(errorStacktrace)
mcp__serena__get_symbols_overview(errorFile)

// 3. Serena: Analyser context
mcp__serena__find_referencing_symbols(buggyFunction)
```

**Backend/API Errors:**
```typescript
// 1. Supabase Logs: Identifier root cause
mcp__supabase__get_logs('api', 50)

// 2. Serena: Analyser API route
mcp__serena__find_symbol('/api/products')
mcp__serena__get_symbols_overview('src/app/api/products/route.ts')

// 3. Database: Vérifier queries
mcp__supabase__execute_sql('EXPLAIN ANALYZE ...')
```

**Database Errors:**
```typescript
// 1. Supabase Logs: SQL errors
mcp__supabase__get_logs('postgres', 30)

// 2. RLS Issues: Test policies
mcp__supabase__execute_sql(`
  SET ROLE authenticated;
  SELECT * FROM products LIMIT 1;
`)

// 3. Advisors: Security/Performance
mcp__supabase__get_advisors()
```

**Performance Issues:**
```typescript
// 1. Playwright: Mesurer temps chargement
mcp__playwright__browser_navigate(url)
// Mesurer performance.timing

// 2. Supabase: Queries lentes
mcp__supabase__get_logs('postgres', 100)
// Filter slow queries >500ms

// 3. Serena: Analyser hooks/components
mcp__serena__find_symbol('useProducts')
// Vérifier useMemo, useCallback usage
```

### 3. Root Cause Analysis

**Analyse Patterns Communs:**

#### Pattern 1: Missing RLS Policy
```
Error: "permission denied for table products"

Root Cause Detection:
→ mcp__supabase__get_advisors('security')
→ Détecte: "Table products missing RLS policy"

Fix Suggestion:
→ Créer policy dans migration:
CREATE POLICY "allow_read_products" ON products
FOR SELECT TO authenticated
USING (true);
```

#### Pattern 2: Infinite Loop / Re-render
```
Error: "Maximum update depth exceeded"

Root Cause Detection:
→ mcp__serena__find_symbol(componentName)
→ Analyser useEffect dependencies
→ Détecter: useEffect sans deps array

Fix Suggestion:
→ Ajouter deps array correct
→ Ou utiliser useCallback pour fonctions
```

#### Pattern 3: Race Condition
```
Error: "Cannot read property 'id' of undefined"

Root Cause Detection:
→ mcp__playwright__browser_console_messages()
→ mcp__serena__find_symbol(componentName)
→ Détecter: data?.id sans loading state

Fix Suggestion:
→ Ajouter loading state check
→ Optional chaining correct: data?.id
```

#### Pattern 4: N+1 Query Problem
```
Performance: Page loads in 5s (Target: <3s)

Root Cause Detection:
→ mcp__supabase__get_logs('postgres')
→ Détecter: 50+ queries SELECT FROM product_images
→ Pattern: Query dans loop

Fix Suggestion:
→ Utiliser JOIN dans query principale
→ Ou useQueries batch avec React Query
```

### 4. Automated Fix Application

**Si fix simple et safe:**
```typescript
// Serena: Apply fix directly
mcp__serena__replace_symbol_body(
  symbolName,
  filePath,
  fixedCode
)
```

**Si fix complexe:**
```typescript
// Générer suggestion détaillée
const suggestion = {
  file: 'src/hooks/use-products.ts',
  line: 42,
  current: `const { data } = await supabase.from('products').select('*')`,
  proposed: `const { data } = await supabase
    .from('products')
    .select(\`
      id, name, sku,
      product_images!left (public_url, is_primary)
    \`)`,
  reason: 'Product Images Pattern (BR-TECH-002)',
  impact: 'Fixes missing images + follows business rules'
}
```

### 5. Validation Post-Fix

**Tests Automatiques:**
```bash
# 1. Console check
mcp__playwright__browser_navigate(url)
mcp__playwright__browser_console_messages()
# Vérifier: error disparu

# 2. Si performance fix
# Mesurer amélioration temps chargement

# 3. Si database fix
mcp__supabase__get_logs('postgres')
# Vérifier: plus d'erreurs SQL
```

**Regression Tests:**
- Tester pages impactées
- Vérifier features adjacentes
- Confirm zero new errors introduits

### 6. Documentation Fix

**Memory Update:**
```typescript
mcp__serena__write_memory(`
# Fix Applied: [DATE]

## Error
[Description erreur originale]

## Root Cause
[Cause identifiée]

## Solution Applied
[Description fix]

## Validation
- Console: ✅ Zero errors
- Tests: ✅ Passed
- Performance: ✅ Improved from 5s → 2.1s

## Prevention
[Comment éviter à l'avenir]
`)
```

## Debug Strategies par Type

### JavaScript Errors
1. Reproduire avec Playwright
2. Stack trace → Serena find symbol
3. Analyser context code
4. Fix + validate console clean

### API Errors
1. Supabase API logs
2. Identifier endpoint + status code
3. Serena analyser route handler
4. Test RLS si 403/permission
5. Fix + re-test API call

### Database Errors
1. Postgres logs analysis
2. Query EXPLAIN ANALYZE
3. Check indexes (advisors)
4. Test RLS policies
5. Migration si schema fix needed

### Performance Issues
1. Mesurer baseline performance
2. Identify bottleneck (queries/rendering)
3. Optimize (indexes/memoization)
4. Validate improvement >30%

### UI/Layout Bugs
1. Screenshot état actuel
2. Inspect element accessibility tree
3. Verify Design System usage
4. Fix CSS/component
5. Screenshot validation

## Examples

### Example 1: Console Error
```bash
/fix "TypeError: Cannot read property 'name' of undefined in ProductCard"

# Output:
🔍 Detecting error...
  ✅ Reproduced with Playwright
  📁 Located in: src/components/business/product-card.tsx:42

🧠 Root Cause Analysis (Serena)
  → Missing null check for product prop
  → Product data loading asynchronously

💡 Solution Suggested:
  Current:  <h3>{product.name}</h3>
  Proposed: <h3>{product?.name || 'Loading...'}</h3>

  Or better: Add loading state check before render

✏️ Applying fix...
  ✅ Code updated

✅ Validating...
  ✅ Console: 0 errors
  ✅ Playwright: ProductCard renders correctly

🎉 Fix completed successfully!

📝 Memory updated: MEMORY-BANK/fixes/2025-10-16-product-card-undefined.md
```

### Example 2: Performance Issue
```bash
/fix "Catalogue page loading 5 seconds, target <3s"

# Output:
🔍 Performance Analysis...
  ⏱️ Current: 5.2s
  🎯 Target: <3s

🔬 Bottleneck Detection (Supabase Logs)
  → 127 queries detected
  → Pattern: N+1 problem on product_images
  → Each product = 1 query images

🧠 Root Cause (Serena)
  📁 File: src/hooks/use-products.ts
  💡 Missing: LEFT JOIN product_images

✏️ Solution Applied:
  Added: product_images!left (public_url, is_primary)
  Result: 127 queries → 1 query

✅ Performance Validation:
  ⏱️ Before: 5.2s
  ⏱️ After:  2.1s
  ✅ Target achieved! (-59% improvement)

📊 Metrics:
  - Queries: 127 → 1 (-99%)
  - Load time: 5.2s → 2.1s (-59%)
  - DB load: High → Low

🎉 Performance fix successful!
```

### Example 3: Database Permission Error
```bash
/fix "permission denied for table orders"

# Output:
🔍 Error Detection...
  🔒 Type: Database Permission (RLS)
  📊 Table: orders

🔬 RLS Analysis (Supabase Advisors)
  ⚠️ Missing policy: allow_select_orders
  ✅ Has policy: allow_insert_owner

💡 Solution:
  Create RLS policy for SELECT on orders table

📝 Migration Generated:
  supabase/migrations/20251016_fix_orders_rls.sql

  CREATE POLICY "allow_select_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

✅ Apply this migration via Supabase Studio

🧪 RLS Test (after applying):
  /db rls-test orders authenticated

📝 Next steps:
  1. Review migration
  2. Apply via Studio
  3. Run /db rls-test orders authenticated
  4. Validate with /error-check
```

## Success Metrics
✅ Error root cause identified <2 min
✅ Fix applied automatically (si safe)
✅ Validation tests passed
✅ Zero regression errors
✅ Documentation updated (memory)
✅ Prevention strategy documented

**AVANTAGE : Debug 5x plus rapide avec orchestration multi-agents !**
