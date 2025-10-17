# /review - Pre-Commit Quality Check

Code review automatique avant commit : Quality + Security + Performance + Best Practices.

## Usage
```bash
/review [file-or-module]
```

## Review Checklist Complet

### 1. Code Quality Analysis (Serena)

**Files Changed Detection:**
```bash
git status --porcelain
git diff --name-only
```

**Symbol-Level Analysis:**
```typescript
// Pour chaque fichier modifié
mcp__serena__get_symbols_overview(filePath)
mcp__serena__find_symbol(symbolName, { include_body: true })
```

**Quality Checks:**
- ✅ Naming conventions (camelCase, PascalCase, kebab-case)
- ✅ Fonction complexité <15 lignes (idéal <10)
- ✅ Pas de code commenté/debug
- ✅ Pas de console.log oubliés
- ✅ Pas de TODO/FIXME sans issue tracking
- ✅ DRY principle (pas de duplication)
- ✅ Single Responsibility par fonction

### 2. TypeScript Type Safety

**Strict Type Checks:**
```typescript
// ❌ REJECT
const data: any = await fetch()
let product: any = {}
function process(input: any) {}

// ✅ APPROVE
const data: Product[] = await fetch()
let product: Product | null = null
function process(input: Product): ProcessedProduct {}
```

**Type Coverage:**
- ✅ Pas de `any` (sauf edge cases justifiés)
- ✅ Interface/Type définis pour objets complexes
- ✅ Enums pour valeurs fixes
- ✅ Generics si réutilisable
- ✅ Strict null checks (`strictNullChecks: true`)

### 3. Design System Vérone V2 Compliance

**Colors Check:**
```typescript
// ❌ REJECT: Hardcoded colors
style={{ color: '#3b82f6', background: '#ef4444' }}
className="text-blue-500 bg-red-600"

// ✅ APPROVE: Design System tokens
style={{ color: 'var(--verone-primary)' }}
className="text-verone-primary bg-verone-danger"
```

**Component Usage:**
```typescript
// ❌ REJECT: Legacy components
import { Button } from '@/components/ui/button'

// ✅ APPROVE: V2 components
import { ButtonV2 } from '@/components/ui-v2/button'
```

**Design System Tokens:**
- ✅ Colors: `--verone-*` variables
- ✅ Spacing: Theme spacing scale
- ✅ Typography: Design System font sizes
- ✅ Components: ui-v2/ directory

### 4. Business Rules Compliance

**Product Images Pattern (BR-TECH-002):**
```typescript
// ❌ REJECT: Direct column (supprimée)
.select('id, name, primary_image_url')

// ✅ APPROVE: Jointure product_images
.select(`
  id, name,
  product_images!left (public_url, is_primary)
`)

// ✅ APPROVE: Enrichissement
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null
}))
```

**Other Business Rules:**
- Check `manifests/business-rules/` pour règles applicables
- Valider conformité selon module touché
- Alert si déviation détectée

### 5. React Best Practices

**Hooks Usage:**
```typescript
// ❌ REJECT: Dependencies incorrectes
useEffect(() => {
  fetchData(productId)
}, []) // Missing productId!

// ✅ APPROVE: Dependencies complètes
useEffect(() => {
  fetchData(productId)
}, [productId, fetchData])
```

**Memoization:**
```typescript
// ⚠️ WARNING: Re-render à chaque render parent
const expensiveValue = heavyComputation(data)
const handler = () => handleClick(data)

// ✅ APPROVE: Memoized
const expensiveValue = useMemo(
  () => heavyComputation(data),
  [data]
)
const handler = useCallback(
  () => handleClick(data),
  [data]
)
```

**Component Structure:**
- ✅ Props destructuring au top
- ✅ Hooks appelés avant conditions
- ✅ Early returns pour loading/error
- ✅ JSX lisible (<200 lignes)

### 6. Performance Review

**Database Queries:**
```typescript
// ❌ REJECT: N+1 queries
for (const product of products) {
  const images = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
}

// ✅ APPROVE: Single query with JOIN
const { data } = await supabase
  .from('products')
  .select(`
    *,
    product_images (*)
  `)
```

**React Performance:**
- ✅ Listes avec `key` unique stable
- ✅ Éviter inline functions dans JSX (si lourd)
- ✅ useMemo pour computed values expensive
- ✅ React.memo pour pure components

**Supabase Advisors:**
```typescript
mcp__supabase__get_advisors('performance')
```
- Vérifier recommendations indexes
- Query optimization suggestions

### 7. Security Review

**Supabase Security:**
```typescript
mcp__supabase__get_advisors('security')
```

**RLS Policies Check:**
- ✅ Nouvelles tables ont RLS enabled
- ✅ Policies correctes par role (owner/admin/user)
- ✅ Pas de bypass RLS côté client

**Secrets Management:**
```typescript
// ❌ REJECT: Hardcoded secrets
const apiKey = 'sk_live_abc123'
const dbPassword = 'mypassword123'

// ✅ APPROVE: Environment variables
const apiKey = process.env.STRIPE_API_KEY
const dbPassword = process.env.DATABASE_PASSWORD
```

**Input Validation:**
- ✅ Server-side validation toujours
- ✅ Sanitize user input
- ✅ Zod schemas pour validation

### 8. Accessibility Check

**Semantic HTML:**
```typescript
// ❌ REJECT
<div onClick={handleClick}>Click me</div>

// ✅ APPROVE
<button onClick={handleClick}>Click me</button>
```

**ARIA Labels:**
```typescript
// ✅ Required pour icons/actions
<button aria-label="Supprimer produit">
  <TrashIcon />
</button>
```

**Keyboard Navigation:**
- ✅ Tous éléments interactifs keyboard accessible
- ✅ Focus visible (outline)
- ✅ Logical tab order

**Playwright Accessibility:**
```typescript
mcp__playwright__browser_snapshot()
// Vérifier accessibility tree
```

### 9. Testing Coverage

**Tests Requis Pour:**
- ✅ Nouvelles features (business logic)
- ✅ Bug fixes (regression test)
- ✅ Utilities/helpers (unit tests)
- ✅ Critical paths (E2E tests)

**Test Quality:**
```typescript
// ❌ REJECT: Test fragile
expect(element).toHaveClass('px-4 py-2 bg-blue-500')

// ✅ APPROVE: Test comportement
expect(button).toBeEnabled()
expect(button).toHaveAccessibleName('Ajouter au panier')
```

### 10. Documentation Check

**Code Comments:**
```typescript
// ✅ Complex logic expliquée
/**
 * Calculate B2B pricing with quantity-based tiers
 * Tiers: 1-9 (base), 10-49 (-10%), 50+ (-20%)
 */
function calculateB2BPrice(quantity: number, basePrice: number) {
  // ...
}
```

**JSDoc pour fonctions publiques:**
```typescript
/**
 * Fetch products with images and stock info
 * @param filters - Category, price range, stock status
 * @returns Products enriched with primary image
 */
export async function fetchProducts(filters: ProductFilters) {}
```

**README updates si nécessaire:**
- Nouvelle feature → Update README
- Breaking change → Migration guide
- API change → Update API docs

## Review Report Format

```markdown
# Code Review Report - [DATE]

## Files Reviewed
- src/hooks/use-products.ts (Modified)
- src/components/business/product-card.tsx (Modified)
- src/app/produits/catalogue/page.tsx (Modified)

## ✅ APPROVED (8 checks)
- [x] TypeScript strict types
- [x] Design System V2 usage
- [x] React hooks dependencies
- [x] Performance optimizations
- [x] RLS policies correct
- [x] Accessibility compliant
- [x] Tests coverage adequate
- [x] Documentation updated

## ⚠️ WARNINGS (2 non-blocking)
1. **use-products.ts:42**
   - Issue: useMemo sans dependencies
   - Impact: Re-compute à chaque render
   - Suggestion: `useMemo(() => ..., [data])`

2. **product-card.tsx:87**
   - Issue: Inline function dans map()
   - Impact: Performance si liste >100 items
   - Suggestion: useCallback ou extract function

## ❌ BLOCKERS (1 must fix)
1. **catalogue/page.tsx:156**
   - Issue: Missing product_images jointure
   - Impact: Violation BR-TECH-002
   - Fix Required:
     ```typescript
     .select(`
       id, name,
       product_images!left (public_url, is_primary)
     `)
     ```

## 📊 Metrics
- Files: 3
- Lines Changed: +127 / -43
- Type Safety: 98% (2 anys found, justified)
- Test Coverage: 85% (+5% vs before)
- Performance: No regressions detected

## 🎯 Next Actions
1. Fix BLOCKER: Add product_images join
2. Address WARNING 1: Add useMemo deps
3. Consider WARNING 2: Extract callback (optional)
4. Re-run: /review after fixes

## Status
⚠️ **CHANGES REQUESTED** - Fix 1 blocker before commit
```

## Automated Actions

### Auto-Fix Safe Issues
```typescript
// Si fix trivial et safe
mcp__serena__replace_symbol_body(
  symbolName,
  filePath,
  autoFixedCode
)

// Exemples auto-fix:
// - Ajouter missing dependencies
// - Fix import order
// - Remove console.log
// - Fix obvious type errors
```

### Manual Review Required
- Business logic changes
- Database schema modifications
- Security-sensitive code
- Performance-critical paths

## Integration Workflow

```bash
# Standard workflow
git add .
/review                    # Pre-commit review
# Fix issues si nécessaires
/review                    # Re-check
git commit -m "..."        # Commit si ✅ APPROVED
```

**Best Practice:**
```bash
# Automated pre-commit hook
.git/hooks/pre-commit:
#!/bin/bash
claude-code /review
if [ $? -ne 0 ]; then
  echo "❌ Code review failed. Fix issues before commit."
  exit 1
fi
```

## Success Metrics
✅ Zero type errors (TypeScript strict)
✅ 100% Business Rules compliance
✅ Design System V2 usage
✅ Performance optimized (no N+1)
✅ Security validated (RLS + secrets)
✅ Accessibility compliant
✅ Tests coverage >80%
✅ Documentation updated

**AVANTAGE : Catch 90% bugs AVANT commit au lieu d'APRÈS deploy !**
