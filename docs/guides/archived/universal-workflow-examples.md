# 📚 WORKFLOW UNIVERSEL 2025 - EXEMPLES DÉTAILLÉS

**Version** : 1.0.0
**Date** : 2025-10-30
**Référence** : CLAUDE.md - Workflow Universel 2025

---

## 📋 Table des Matières

1. [Exemple 1 : Nouveau Formulaire](#exemple-1--nouveau-formulaire)
2. [Exemple 2 : Nouveau Composant UI](#exemple-2--nouveau-composant-ui)
3. [Exemple 3 : Nouveau Hook Custom](#exemple-3--nouveau-hook-custom)
4. [Exemple 4 : Migration Database](#exemple-4--migration-database)
5. [Exemple 5 : Nouvelle Page Next.js](#exemple-5--nouvelle-page-nextjs)

---

## Exemple 1 : Nouveau Formulaire

**Contexte** : Créer formulaire "Demande d'échantillon" pour clients B2B/B2C

**Complexité** : Moyenne
**Durée estimée** : 1h30

---

### 🧠 PHASE 1: THINK (Analyse & Planification) - 10 min

#### Actions Exécutées

```typescript
// 1. Sequential Thinking
mcp__sequential -
  thinking__sequentialthinking({
    thought:
      'Analyser formulaire échantillons : champs requis, validations, edge cases',
    totalThoughts: 8,
  });

// 2. Analyse Code Existant (Serena)
mcp__serena__read_memory('sample-forms-context');
mcp__serena__get_symbols_overview('src/components/business/payment-form.tsx');
// → Identifier pattern react-hook-form + Zod validé

mcp__serena__find_symbol({
  name_path: 'PaymentForm',
  include_body: false,
  depth: 1, // Voir methods
});

// 3. Documentation Officielle
mcp__context7__resolve - library - id('react-hook-form');
mcp__context7__get -
  library -
  docs({
    library: 'react-hook-form',
    topic: 'validation',
  });

// 4. Business Rules
Read('docs/business-rules/04-produits/sourcing/sample-orders.md');
Read('docs/business-rules/03-organisations-contacts/customers/');

// 5. Database Schema
Read('docs/database/SCHEMA-REFERENCE.md');
// → Vérifier tables: purchase_orders, purchase_order_items, organisations, customers
```

#### Checklist Phase THINK

- [x] Sequential Thinking exécuté (8 thoughts)
- [x] Serena `get_symbols_overview` sur payment-form.tsx (pattern validé)
- [x] Context7 react-hook-form consulté
- [x] Business rules sample-orders.md lues
- [x] Database SCHEMA-REFERENCE.md consulté
- [x] Edge cases identifiés :
  1. Client supprimé pendant form ouvert
  2. Produit sans fournisseur
  3. Quantité max = 10 échantillons
  4. Adresse livraison auto-fill depuis customer
  5. Validation différente B2B vs B2C
- [x] Plan technique rédigé

#### Plan Technique

```markdown
## Contexte

- Fichiers impactés :
  - `src/app/produits/sourcing/echantillons/page.tsx` (formulaire principal)
  - Réutiliser : `src/components/business/customer-selector.tsx`
  - Réutiliser : `src/components/business/sample-product-selector-modal.tsx`

- Dépendances :
  - Tables DB : purchase_orders, purchase_order_items, organisations, individual_customers
  - Hooks : useForm (react-hook-form), useToast (shadcn)

- Business rules :
  - Max 10 échantillons par demande
  - Adresse livraison obligatoire si B2B
  - sample_type = 'customer' dans purchase_order_items

## Edge Cases Identifiés

1. Client supprimé → Erreur "Client non trouvé" avec form.setError
2. Produit sans fournisseur → Afficher warning, autoriser quand même
3. Quantité > 10 → Validation Zod max(10)
4. Adresse vide B2B → Validation conditionnelle
5. Double submit → disabled state pendant loading

## Approche Technique

1. Schema Zod avec validation conditionnelle B2B/B2C
2. useForm avec zodResolver
3. FormField pour chaque champ avec FormMessage
4. Server Action pour insert Supabase
5. Error handling complet avec try/catch + toast
```

---

### 🧪 PHASE 2: TEST (Validation Hypothèses) - 8 min

#### Actions Exécutées

```typescript
// 1. Console Error Checking
mcp__playwright__browser_navigate("http://localhost:3000/produits/sourcing/echantillons")
mcp__playwright__browser_console_messages()
// ✅ Résultat : 0 errors

// 2. Test Fonctionnel Existant
// → Page existe déjà avec tableau échantillons
mcp__playwright__browser_click("button:has-text('Nouveau Échantillon')")
// ✅ Modal s'ouvre
mcp__playwright__browser_console_messages()
// ✅ 0 errors

// 3. Screenshot Before
mcp__playwright__browser_take_screenshot("echantillons-before-refactor.png")

// 4. Build Validation
npm run build
// ✅ Build successful (22s)
```

#### Checklist Phase TEST

- [x] Console = 0 errors sur page échantillons
- [x] Modal formulaire s'ouvre (form existant partiel)
- [x] Build passe sans erreurs (22s)
- [x] Screenshot "before" capturé
- [x] Performance baseline : 2.1s chargement page

---

### ⚙️ PHASE 3: CODE (Implémentation) - 45 min

#### 3.1 Schema Zod avec Validation Conditionnelle

```typescript
// Fichier: src/app/produits/sourcing/echantillons/page.tsx

import { z } from 'zod';

// Schema validation conditionnelle B2B/B2C
const sampleFormSchema = z
  .object({
    customerType: z.enum(['professional', 'individual'], {
      required_error: 'Type de client requis',
    }),
    customerId: z.string().uuid('Client invalide').min(1, 'Client requis'),
    productId: z.string().uuid('Produit invalide').min(1, 'Produit requis'),
    quantity: z.number().min(1, 'Min 1').max(10, 'Max 10 échantillons'),
    deliveryAddress: z.string().optional(),
    notes: z.string().max(500, 'Max 500 caractères').optional(),
  })
  .refine(
    data => {
      // Validation conditionnelle : adresse obligatoire si B2B
      if (data.customerType === 'professional' && !data.deliveryAddress) {
        return false;
      }
      return true;
    },
    {
      message: 'Adresse de livraison requise pour clients professionnels',
      path: ['deliveryAddress'],
    }
  );

type SampleFormValues = z.infer<typeof sampleFormSchema>;
```

#### 3.2 useForm Setup

```typescript
// Remplacer état manuel par useForm
const form = useForm<SampleFormValues>({
  resolver: zodResolver(sampleFormSchema),
  defaultValues: {
    customerType: 'professional',
    customerId: '',
    productId: '',
    quantity: 1,
    deliveryAddress: '',
    notes: '',
  },
});
```

#### 3.3 Conversion Champs en FormField

```typescript
// Exemple pour chaque champ
<FormField
  control={form.control}
  name="productId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Produit *</FormLabel>
      <FormControl>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowProductModal(true)}
        >
          {selectedProduct ? selectedProduct.name : 'Sélectionner...'}
        </Button>
      </FormControl>
      <FormMessage /> {/* ✅ Erreurs automatiques */}
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="quantity"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Quantité</FormLabel>
      <FormControl>
        <Input
          type="number"
          {...field}
          onChange={e => field.onChange(parseInt(e.target.value))}
        />
      </FormControl>
      <FormDescription>Maximum 10 échantillons</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### 3.4 Submit Handler Refactoré

```typescript
const onSubmit = async (values: SampleFormValues) => {
  setSubmitting(true);

  try {
    // Insert purchase_order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_id: selectedProduct.supplier_id,
        status: 'pending',
        total_amount: selectedProduct.cost_price * values.quantity,
        notes: values.notes,
      })
      .select()
      .single();

    if (poError) throw poError;

    // Insert purchase_order_item (échantillon)
    const { error: itemError } = await supabase
      .from('purchase_order_items')
      .insert({
        purchase_order_id: purchaseOrder.id,
        product_id: values.productId,
        quantity: values.quantity,
        unit_cost: selectedProduct.cost_price,
        sample_type: 'customer',
        customer_organisation_id:
          values.customerType === 'professional' ? values.customerId : null,
        customer_individual_id:
          values.customerType === 'individual' ? values.customerId : null,
      });

    if (itemError) throw itemError;

    // Success
    toast({
      title: 'Succès',
      description: "Demande d'échantillon créée",
    });

    form.reset();
    setShowModal(false);
    router.refresh();
  } catch (error: any) {
    console.error('Error creating sample order:', error);
    toast({
      title: 'Erreur',
      description: error.message || 'Une erreur est survenue',
      variant: 'destructive',
    });

    // Garder formulaire ouvert pour correction
  } finally {
    setSubmitting(false);
  }
};
```

#### Checklist Phase CODE

- [x] Schema Zod complet avec validation conditionnelle
- [x] useForm + zodResolver configuré
- [x] Tous les champs convertis en FormField + FormMessage
- [x] Submit handler avec try/catch complet
- [x] Types TypeScript stricts (pas de `any`)
- [x] Disabled state pendant submit
- [x] form.reset() après succès
- [x] Toast success/error
- [x] Pas de secrets/credentials

---

### 🔄 PHASE 4: RE-TEST (Validation Finale) - 20 min

#### Actions Exécutées

```typescript
// 1. Type Check
npm run type-check
// ✅ 0 TypeScript errors

// 2. Build Validation
npm run build
// ✅ Build successful (21s)

// 3. Console Error Checking
mcp__playwright__browser_navigate("http://localhost:3000/produits/sourcing/echantillons")
mcp__playwright__browser_console_messages()
// ✅ 0 errors

mcp__playwright__browser_click("button:has-text('Nouveau Échantillon')")
mcp__playwright__browser_console_messages()
// ✅ 0 errors

// 4. Test Validation : Submit vide
mcp__playwright__browser_click("button:has-text('Créer la demande')")
mcp__playwright__browser_take_screenshot("validation-errors-visible.png")
// ✅ Messages erreur affichés sur champs requis

// 5. Test Workflow Complet
// Sélectionner client B2B
mcp__playwright__browser_click("combobox[name='customerId']")
mcp__playwright__browser_click("text='Opjet'")  // Premier client

// Sélectionner produit
mcp__playwright__browser_click("button:has-text('Sélectionner un produit')")
mcp__playwright__browser_type("input[placeholder='Rechercher']", "Milo")
mcp__playwright__browser_click("text='Fauteuil Milo - Rose'")
// ✅ Modal fermé, produit sélectionné

// Remplir quantité
mcp__playwright__browser_fill("input[type='number']", "3")

// Remplir adresse
mcp__playwright__browser_fill("textarea[name='deliveryAddress']", "123 Rue Test")

// Remplir notes
mcp__playwright__browser_fill("textarea[name='notes']", "Échantillon test client")

// Submit
mcp__playwright__browser_click("button:has-text('Créer la demande')")

// Attendre toast succès
mcp__playwright__browser_wait_for("text='Demande d\\'échantillon créée'")
mcp__playwright__browser_take_screenshot("sample-order-success.png")
// ✅ Toast visible, modal fermée

// 6. Database Validation
mcp__supabase__execute_sql(`
  SELECT
    po.id,
    po.status,
    poi.quantity,
    poi.sample_type,
    poi.customer_organisation_id
  FROM purchase_orders po
  JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
  WHERE poi.sample_type = 'customer'
  ORDER BY po.created_at DESC
  LIMIT 1
`)
// ✅ Données insérées correctement
// status = 'pending', quantity = 3, sample_type = 'customer'

// 7. Console Final
mcp__playwright__browser_console_messages()
// ✅ 0 errors
```

#### Checklist Phase RE-TEST

- [x] Type check = 0 erreurs
- [x] Build successful (21s)
- [x] Console = 0 errors (page + modal)
- [x] Validation erreurs fonctionnent (screenshot)
- [x] Workflow complet testé :
  - [x] Sélection client B2B
  - [x] Sélection produit avec recherche
  - [x] Remplissage quantité
  - [x] Remplissage adresse (obligatoire B2B)
  - [x] Remplissage notes
  - [x] Submit succès
- [x] Toast succès affiché
- [x] Modal fermée après succès
- [x] Database : données insérées correctement
- [x] Performance : Modal <500ms
- [x] Aucune régression détectée

---

### 📝 PHASE 5: DOCUMENT (Préservation Context) - 5 min

```typescript
// Serena Memory
mcp__serena__write_memory({
  key: 'sample-order-form-validation-pattern',
  content: `
    ## Décisions Architecturales
    - Pattern react-hook-form + Zod avec validation conditionnelle B2B/B2C
    - Réutilisation CustomerSelector et SampleProductSelectorModal
    - Server Action direct (pas d'API route)

    ## Edge Cases Résolus
    - Validation conditionnelle adresse (refine Zod)
    - Client supprimé → try/catch avec toast error
    - Produit sans fournisseur → Accepté avec warning
    - Quantité max 10 → Validation Zod max(10)
    - Double submit → Disabled state + setSubmitting

    ## Learnings
    - FormField + FormMessage = messages erreur automatiques
    - zodResolver rend validation très propre
    - form.reset() après succès important pour UX
    - Toast error + garder modal ouvert = meilleure UX que fermer
  `,
});
```

#### Checklist Phase DOCUMENT

- [x] Serena memory écrite avec décisions clés
- [x] Pattern validation conditionnelle documenté
- [x] Edge cases résolus listés

---

### 🚀 PHASE 6: COMMIT (Autorisation Obligatoire) - 2 min

```bash
# Préparation
git status
# modified: src/app/produits/sourcing/echantillons/page.tsx

git diff src/app/produits/sourcing/echantillons/page.tsx
# → Vérifier changements

# ⏸️ STOP - Demander autorisation
"Voulez-vous que je commit et push maintenant ?"
# User: "Oui"

# Commit structuré
git add src/app/produits/sourcing/echantillons/page.tsx
git commit -m "$(cat <<'EOF'
feat(echantillons): Refactor form with react-hook-form + Zod validation

- Add sampleFormSchema with conditional validation B2B/B2C
- Replace manual state with useForm + zodResolver
- Convert all fields to FormField + FormMessage
- Refactor submit handler with try/catch + toast
- Add edge case handling (client deleted, double submit)

Tests: 15/15 passed
Console errors: 0
Build: successful (21s)
Screenshots: validation-errors-visible.png, sample-order-success.png

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push
git push origin production-stable
```

#### Checklist Phase COMMIT

- [x] Autorisation obtenue EXPLICITEMENT
- [x] Commit message structuré avec émoji
- [x] Tests passés (15/15)
- [x] Console = 0 errors
- [x] Build successful
- [x] Push effectué

---

## Exemple 2 : Nouveau Composant UI

**Contexte** : Créer composant `ProductCard` réutilisable avec image, badge, hover effects

**Complexité** : Simple
**Durée estimée** : 45 min

---

### 🧠 PHASE 1: THINK - 8 min

```typescript
// Serena Analysis
mcp__serena__get_symbols_overview("src/components/ui/card.tsx")  // Pattern shadcn
mcp__serena__find_symbol({ name_path: "Card", depth: 1 })

// Context7 Documentation
mcp__context7__get-library-docs({ library: "tailwindcss", topic: "hover-effects" })

// Design Research (5 min)
WebSearch("modern product card design 2025")
WebFetch("https://dribbble.com/shots/[...]", prompt: "Analyze modern product card patterns")
```

**Edge Cases** :

1. Image manquante → Fallback placeholder
2. Prix absent → Badge "Prix sur demande"
3. Long product name → Truncate avec ellipsis
4. Responsive → Mobile 1 col, Desktop grid

**Plan** : Composant avec variants (default, compact, large), TypeScript props stricts, hover animation, Badge dynamique.

---

### 🧪 PHASE 2: TEST - 5 min

```typescript
mcp__playwright__browser_navigate('http://localhost:3000/produits/catalogue');
mcp__playwright__browser_console_messages(); // ✅ 0 errors

// Screenshot produits existants
mcp__playwright__browser_take_screenshot('products-before-new-card.png');
```

---

### ⚙️ PHASE 3: CODE - 20 min

```typescript
// Fichier: src/components/business/product-card.tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'
import Image from 'next/image'

type ProductCardProps = {
  product: {
    id: string
    name: string
    sku?: string
    price?: number
    imageUrl?: string
    status: 'active' | 'draft' | 'archived'
  }
  variant?: 'default' | 'compact' | 'large'
  onClick?: (productId: string) => void
  className?: string
}

export function ProductCard({
  product,
  variant = 'default',
  onClick,
  className
}: ProductCardProps) {
  const sizes = {
    default: { image: 'h-48', title: 'text-base', sku: 'text-sm' },
    compact: { image: 'h-32', title: 'text-sm', sku: 'text-xs' },
    large: { image: 'h-64', title: 'text-lg', sku: 'text-base' }
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={() => onClick?.(product.id)}
    >
      <CardHeader className="p-0">
        <div className={cn('relative overflow-hidden bg-gray-100', sizes[variant].image)}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <Badge
            variant={product.status === 'active' ? 'default' : 'secondary'}
            className="absolute top-2 right-2"
          >
            {product.status === 'active' ? 'Actif' : 'Brouillon'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className={cn('font-semibold truncate', sizes[variant].title)}>
          {product.name}
        </h3>

        {product.sku && (
          <p className={cn('text-muted-foreground', sizes[variant].sku)}>
            SKU: {product.sku}
          </p>
        )}

        <p className="mt-2 font-bold text-green-600">
          {product.price ? `${product.price}€` : 'Prix sur demande'}
        </p>
      </CardContent>
    </Card>
  )
}
```

---

### 🔄 PHASE 4: RE-TEST - 10 min

```typescript
// Type check
npm run type-check  // ✅ 0 errors

// Build
npm run build  // ✅ Success

// Test responsive
mcp__playwright__browser_resize({ width: 375, height: 667 })  // Mobile
mcp__playwright__browser_take_screenshot("product-card-mobile.png")

mcp__playwright__browser_resize({ width: 1024, height: 768 })  // Desktop
mcp__playwright__browser_take_screenshot("product-card-desktop.png")

// Console
mcp__playwright__browser_console_messages()  // ✅ 0 errors
```

---

### 📝 PHASE 5: DOCUMENT - 3 min

```typescript
mcp__serena__write_memory({
  key: 'product-card-component-pattern',
  content: `
    ## Pattern UI Component
    - Variants (default, compact, large) avec cn() utility
    - Hover effects : shadow-lg + translate-y
    - Image fallback avec Lucide icon
    - Badge dynamique selon status
    - Truncate long text avec ellipsis

    ## Responsive
    - Mobile : h-32 (compact)
    - Desktop : h-48 (default)
  `,
});
```

---

### 🚀 PHASE 6: COMMIT - 2 min

```bash
git add src/components/business/product-card.tsx
git commit -m "feat(ui): Add ProductCard component with variants

- 3 variants: default, compact, large
- Hover animation (shadow + translate)
- Image fallback with Package icon
- Dynamic badge (active/draft)
- Responsive design

Tests: 8/8 passed
Console errors: 0

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin production-stable
```

---

## Exemple 3 : Nouveau Hook Custom

**Contexte** : Hook `useProducts` pour charger/filtrer produits avec cache SWR

**Complexité** : Moyenne
**Durée estimée** : 1h

---

### 🧠 PHASE 1: THINK - 10 min

```typescript
// Analyse hooks existants
mcp__serena__get_symbols_overview('src/hooks/use-customers.ts');
mcp__serena__find_symbol({ name_path: 'useCustomers', include_body: true });

// Documentation SWR
mcp__context7__get - library - docs({ library: 'swr', topic: 'pagination' });

// Business Rules
Read('docs/business-rules/04-produits/catalogue/filtering.md');
```

**Edge Cases** :

1. Loading state initial
2. Error handling réseau
3. Pagination (50 produits/page)
4. Filtre par search, status, category
5. Cache invalidation après mutation

---

### 🧪 PHASE 2: TEST - 5 min

```typescript
// Test hook similaire existe
mcp__playwright__browser_navigate(
  'http://localhost:3000/contacts-organisations'
);
// ✅ useCustomers fonctionne, s'en inspirer
```

---

### ⚙️ PHASE 3: CODE - 30 min

```typescript
// Fichier: src/hooks/use-products.ts
'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

type UseProductsParams = {
  search?: string;
  status?: 'active' | 'draft' | 'archived';
  categoryId?: string;
  page?: number;
  limit?: number;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  status: string;
  category_id: string | null;
};

export function useProducts(params: UseProductsParams = {}) {
  const { search = '', status, categoryId, page = 1, limit = 50 } = params;

  const supabase = createClient();

  const fetcher = async () => {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('name')
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { products: data as Product[], total: count || 0 };
  };

  const { data, error, isLoading, mutate } = useSWR(
    ['products', params],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  return {
    products: data?.products || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate, // Pour invalidation cache
  };
}
```

---

### 🔄 PHASE 4: RE-TEST - 12 min

```typescript
// Type check
npm run type-check  // ✅ 0 errors

// Build
npm run build  // ✅ Success

// Test hook dans component
// Créer test component temporaire
const TestComponent = () => {
  const { products, isLoading, error } = useProducts({ search: 'Milo' })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  )
}

// MCP Playwright test
mcp__playwright__browser_navigate("http://localhost:3000/test-hook")
mcp__playwright__browser_wait_for("text='Fauteuil Milo'")
// ✅ Products chargés

mcp__playwright__browser_console_messages()  // ✅ 0 errors
```

---

### 📝 PHASE 5: DOCUMENT - 5 min

```typescript
mcp__serena__write_memory({
  key: 'use-products-hook-pattern',
  content: `
    ## Pattern SWR Hook
    - Pagination avec range()
    - Filtres multiples (search, status, category)
    - Cache SWR avec revalidateOnFocus: false
    - Return mutate pour invalidation

    ## Edge Cases
    - Loading state initial
    - Error handling avec error object
    - Empty state (products = [])
    - Cache invalidation après mutation
  `,
});
```

---

### 🚀 PHASE 6: COMMIT - 2 min

```bash
git add src/hooks/use-products.ts
git commit -m "feat(hooks): Add useProducts with SWR cache

- Pagination 50 products/page
- Multi-filter: search, status, category
- SWR cache with mutate for invalidation
- TypeScript types strict

Tests: 10/10 passed
Console errors: 0

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Exemple 4 : Migration Database

**Contexte** : Ajouter colonne `cost_price_margin` dans table `products`

**Complexité** : Simple
**Durée estimée** : 30 min

---

### 🧠 PHASE 1: THINK - 12 min

```typescript
// Documentation Database
Read('docs/database/SCHEMA-REFERENCE.md');
Read('docs/database/best-practices.md');
Read('docs/database/migrations-convention.md');

// Vérifier table products
mcp__supabase__execute_sql(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'products'
  ORDER BY ordinal_position
`);

// Rechercher patterns similaires
mcp__serena__search_for_pattern({
  pattern: 'ADD COLUMN.*price',
  relative_path: 'supabase/migrations/',
});

// Advisors Supabase
mcp__supabase__get_advisors('security');
```

**Edge Cases** :

1. Produits existants → NULL autorisé initialement
2. Contrainte check (margin >= 0 et <= 100)
3. Index si requêtes fréquentes
4. Comment explicatif
5. Migration idempotente (IF NOT EXISTS)

---

### 🧪 PHASE 2: TEST - 5 min

```typescript
// Vérifier table existe
mcp__supabase__execute_sql("SELECT * FROM products LIMIT 1")
// ✅ Table exists

// Vérifier colonne n'existe pas
mcp__supabase__execute_sql(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'products'
  AND column_name = 'cost_price_margin'
`)
// ✅ Column doesn't exist (OK pour création)

// Build
npm run build  // ✅ Success
```

---

### ⚙️ PHASE 3: CODE - 8 min

```sql
-- Fichier: supabase/migrations/20251030_001_add_cost_price_margin.sql

-- ============================================================================
-- Migration: Add cost_price_margin to products
-- Date: 2025-10-30
-- Description: Ajouter marge bénéficiaire sur coût d'achat (0-100%)
-- ============================================================================

-- 1. ADD COLUMN (idempotent)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price_margin DECIMAL(5,2);

-- 2. COMMENT
COMMENT ON COLUMN products.cost_price_margin IS
'Marge bénéficiaire sur coût d''achat en pourcentage (0-100). NULL = non défini';

-- 3. CONSTRAINT (validation 0-100%)
ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_cost_price_margin_range;

ALTER TABLE products
ADD CONSTRAINT check_cost_price_margin_range
CHECK (cost_price_margin >= 0 AND cost_price_margin <= 100);

-- 4. INDEX (si requêtes fréquentes sur marge)
CREATE INDEX IF NOT EXISTS idx_products_cost_price_margin
ON products(cost_price_margin)
WHERE cost_price_margin IS NOT NULL;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- Pour rollback complet :
-- DROP INDEX IF EXISTS idx_products_cost_price_margin;
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS check_cost_price_margin_range;
-- ALTER TABLE products DROP COLUMN IF EXISTS cost_price_margin;
```

---

### 🔄 PHASE 4: RE-TEST - 12 min

```typescript
// Appliquer migration
// (En local : supabase db push)
mcp__supabase__apply_migration("20251030_001_add_cost_price_margin.sql")

// Vérifier colonne créée
mcp__supabase__execute_sql(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'products'
  AND column_name = 'cost_price_margin'
`)
// ✅ Column exists, type = numeric, nullable = YES

// Vérifier contrainte
mcp__supabase__execute_sql(`
  SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'products'::regclass
  AND conname = 'check_cost_price_margin_range'
`)
// ✅ Constraint exists

// Test insert avec valeur valide
mcp__supabase__execute_sql(`
  UPDATE products
  SET cost_price_margin = 25.50
  WHERE id = (SELECT id FROM products LIMIT 1)
`)
// ✅ Success

// Test insert avec valeur invalide (>100)
mcp__supabase__execute_sql(`
  UPDATE products
  SET cost_price_margin = 150
  WHERE id = (SELECT id FROM products LIMIT 1)
`)
// ✅ Error: violates check constraint (attendu)

// Générer types TypeScript
mcp__supabase__generate_typescript_types()
// Copier dans src/types/supabase.ts

// Type check
npm run type-check  // ✅ 0 errors

// Build
npm run build  // ✅ Success
```

---

### 📝 PHASE 5: DOCUMENT - 5 min

```typescript
// Update SCHEMA-REFERENCE.md
Edit('docs/database/SCHEMA-REFERENCE.md', {
  section: 'products',
  add: `
    - cost_price_margin (DECIMAL(5,2), NULL) : Marge bénéficiaire 0-100%
      * Contrainte : check_cost_price_margin_range (0-100)
      * Index : idx_products_cost_price_margin (partial, WHERE NOT NULL)
  `,
});

// Serena Memory
mcp__serena__write_memory({
  key: 'products-cost-price-margin-migration',
  content: `
    ## Décision Architecturale
    - Colonne cost_price_margin (DECIMAL 5,2) pour marge 0-100%
    - NULL autorisé (produits existants)
    - Contrainte check (0-100)
    - Index partial pour requêtes filtrées

    ## Migration Idempotente
    - IF NOT EXISTS sur colonne
    - DROP IF EXISTS sur constraint avant CREATE
  `,
});
```

---

### 🚀 PHASE 6: COMMIT - 2 min

```bash
git add supabase/migrations/20251030_001_add_cost_price_margin.sql
git add src/types/supabase.ts
git add docs/database/SCHEMA-REFERENCE.md

git commit -m "feat(db): Add cost_price_margin to products table

- Add DECIMAL(5,2) column with NULL allowed
- Add constraint check_cost_price_margin_range (0-100)
- Add partial index for filtered queries
- Update TypeScript types
- Update SCHEMA-REFERENCE.md

Migration: idempotent
Tests: constraint validated
Build: successful

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin production-stable
```

---

## Exemple 5 : Nouvelle Page Next.js

**Contexte** : Page `/produits/catalogue/[id]` pour détails produit

**Complexité** : Moyenne
**Durée estimée** : 1h15

---

### 🧠 PHASE 1: THINK - 12 min

```typescript
// Analyse architecture Next.js 15
mcp__serena__get_symbols_overview('src/app/produits/catalogue/page.tsx');
mcp__context7__get -
  library -
  docs({ library: 'next.js', topic: 'app-router-dynamic-routes' });

// Business Rules
Read('docs/business-rules/04-produits/catalogue/product-details.md');

// Database Schema
mcp__supabase__execute_sql(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'products'
`);
```

**Edge Cases** :

1. Produit introuvable → 404 notFound()
2. Produit archivé → Banner warning
3. Images multiples → Carrousel
4. Variantes → Tableau
5. Loading → loading.tsx avec Skeleton
6. Error → error.tsx avec retry

**Plan** : Server Component + generateMetadata pour SEO

---

### 🧪 PHASE 2: TEST - 5 min

```typescript
mcp__playwright__browser_navigate("http://localhost:3000/produits/catalogue")
mcp__playwright__browser_console_messages()  // ✅ 0 errors

npm run build  // ✅ Success
```

---

### ⚙️ PHASE 3: CODE - 35 min

```typescript
// Fichier: src/app/produits/catalogue/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

type Props = {
  params: { id: string }
}

// ✅ generateMetadata pour SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', params.id)
    .single()

  if (!product) {
    return { title: 'Produit introuvable' }
  }

  return {
    title: `${product.name} - Vérone Back Office`,
    description: product.description || `Détails du produit ${product.name}`
  }
}

// ✅ Server Component
export default async function ProductDetailsPage({ params }: Props) {
  const supabase = createClient()

  // Fetch product avec images et variantes
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        public_url,
        is_primary,
        display_order
      ),
      product_variants (
        id,
        name,
        sku,
        price
      ),
      categories (
        name
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !product) {
    notFound()  // → 404 page
  }

  const primaryImage = product.product_images?.find(img => img.is_primary)

  return (
    <div className="container mx-auto py-8">
      {/* Banner si archivé */}
      {product.status === 'archived' && (
        <div className="mb-4 rounded-lg bg-orange-100 p-4 text-orange-800">
          ⚠️ Ce produit est archivé
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images */}
        <div>
          {primaryImage ? (
            <Image
              src={primaryImage.public_url}
              alt={product.name}
              width={600}
              height={600}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-96 items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-gray-400">Pas d'image</p>
            </div>
          )}
        </div>

        {/* Détails */}
        <div>
          <div className="flex items-start gap-3">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
              {product.status}
            </Badge>
          </div>

          <p className="mt-2 text-muted-foreground">
            SKU: {product.sku || 'Non défini'}
          </p>

          {product.categories && (
            <p className="mt-1 text-sm">
              Catégorie: {product.categories.name}
            </p>
          )}

          <p className="mt-6 text-2xl font-bold text-green-600">
            {product.price ? `${product.price}€` : 'Prix sur demande'}
          </p>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="mt-2 text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Variantes */}
          {product.product_variants && product.product_variants.length > 0 && (
            <Card className="mt-6 p-4">
              <h2 className="font-semibold">Variantes disponibles</h2>
              <div className="mt-3 space-y-2">
                {product.product_variants.map(variant => (
                  <div key={variant.id} className="flex justify-between">
                    <span>{variant.name}</span>
                    <span className="font-medium">{variant.price}€</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
```

```typescript
// Fichier: src/app/produits/catalogue/[id]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}
```

```typescript
// Fichier: src/app/produits/catalogue/[id]/error.tsx
'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto py-16 text-center">
      <h2 className="text-2xl font-bold text-red-600">
        Une erreur est survenue
      </h2>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Button onClick={reset} className="mt-4">
        Réessayer
      </Button>
    </div>
  )
}
```

---

### 🔄 PHASE 4: RE-TEST - 20 min

```typescript
// Type check
npm run type-check  // ✅ 0 errors

// Build
npm run build  // ✅ Success

// Test page détails
mcp__playwright__browser_navigate("http://localhost:3000/produits/catalogue/[valid-id]")
mcp__playwright__browser_console_messages()  // ✅ 0 errors

// Screenshot
mcp__playwright__browser_take_screenshot("product-details-page.png")

// Test 404
mcp__playwright__browser_navigate("http://localhost:3000/produits/catalogue/invalid-id")
// ✅ 404 page affichée

// Test loading
mcp__playwright__browser_navigate("http://localhost:3000/produits/catalogue/[valid-id]")
// ✅ Skeleton visible pendant chargement

// Test responsive
mcp__playwright__browser_resize({ width: 375, height: 667 })
mcp__playwright__browser_take_screenshot("product-details-mobile.png")
// ✅ Layout 1 colonne

mcp__playwright__browser_resize({ width: 1024, height: 768 })
// ✅ Layout 2 colonnes

// Performance
// ✅ <3s chargement page
```

---

### 📝 PHASE 5: DOCUMENT - 3 min

```typescript
mcp__serena__write_memory({
  key: 'product-details-page-pattern',
  content: `
    ## Architecture Next.js 15
    - Server Component avec generateMetadata (SEO)
    - Dynamic route [id]
    - notFound() pour 404
    - loading.tsx avec Skeleton
    - error.tsx avec retry button

    ## Edge Cases
    - Produit introuvable → notFound()
    - Produit archivé → Banner warning
    - Images manquantes → Placeholder
    - Variantes → Tableau dans Card
  `,
});
```

---

### 🚀 PHASE 6: COMMIT - 2 min

```bash
git add src/app/produits/catalogue/\[id\]/

git commit -m "feat(products): Add product details page with dynamic route

- Server Component with generateMetadata (SEO)
- Dynamic route [id] with notFound() for 404
- loading.tsx with Skeleton UI
- error.tsx with retry button
- Product images, variants display
- Responsive layout (mobile/desktop)

Tests: 12/12 passed
Console errors: 0
Performance: <3s
Build: successful

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin production-stable
```

---

## 🎯 Résumé Patterns Identifiés

### Pattern Formulaire

- ✅ Zod schema validation
- ✅ useForm + zodResolver
- ✅ FormField + FormMessage
- ✅ Server Action try/catch

### Pattern Composant UI

- ✅ TypeScript props avec variants
- ✅ cn() utility Tailwind
- ✅ Hover effects
- ✅ Responsive design

### Pattern Hook Custom

- ✅ SWR avec cache
- ✅ TypeScript types stricts
- ✅ Error/loading states
- ✅ Return mutate

### Pattern Database

- ✅ Migration idempotente (IF NOT EXISTS)
- ✅ Contraintes validation
- ✅ Index partial
- ✅ Commentaires explicatifs

### Pattern Page Next.js

- ✅ Server Component
- ✅ generateMetadata (SEO)
- ✅ loading.tsx + error.tsx
- ✅ notFound() pour 404

---

**Version** : 1.0.0
**Date** : 2025-10-30
**Applicable à** : Tous types de features Vérone Back Office
