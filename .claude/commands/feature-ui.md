# WORKFLOW: EXPERT FRONTEND (UI/UX)

**Mode activé :** Expert Interface Utilisateur & Composants React
**Objectif :** Créer des interfaces cohérentes et performantes sur les 3 applications (Back-Office, Site Internet, Linkme).

---

## 🚨 RÈGLE D'OR : "RÉUTILISER AVANT CRÉER"

**Ne JAMAIS créer un composant avant d'avoir vérifié qu'il n'existe pas déjà.**

---

## 📋 CHECKLIST OBLIGATOIRE (4 ÉTAPES)

### 1️⃣ CATALOGUE CHECK (Vérification Composants Existants)

**Actions à exécuter :**

```bash
# 1. Vérifier le Design System de base
ls -R packages/@verone/ui/src/components/

# 2. Vérifier les composants métier
ls -R packages/@verone/ui-business/src/components/

# 3. Vérifier les composants spécifiques au domaine
# Exemples :
ls -R packages/@verone/products/src/components/
ls -R packages/@verone/stock/src/components/
ls -R packages/@verone/orders/src/components/
```

**Questions à répondre :**

- ✅ Existe-t-il un composant similaire dans `@verone/ui` ?
- ✅ Existe-t-il un composant métier dans `@verone/ui-business` ?
- ✅ Existe-t-il un composant spécifique au domaine (products, stock, orders...) ?
- ✅ Puis-je composer avec les composants existants au lieu de créer ?

**Composants de base disponibles (exemples) :**

- `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- `Card`, `Table`, `DataTable`, `Modal`, `Dialog`, `Toast`
- `Form`, `FormField`, `FormLabel`, `FormError`
- `Badge`, `Avatar`, `Skeleton`, `Spinner`

**Composants métier disponibles (exemples) :**

- `ProductCard`, `OrderStatusBadge`, `StockIndicator`
- `CustomerCard`, `SupplierCard`
- `PriceDisplay`, `QuantityInput`

---

### 2️⃣ ARCHITECTURE PAGE/COMPOSANT

**Déterminer le type de composant à créer :**

#### **A. Server Component (par défaut)**

Utilise pour :

- ✅ Pages complètes (app/page.tsx)
- ✅ Layouts
- ✅ Fetch de données depuis Supabase
- ✅ Composants sans interactivité

**Exemple :**

```tsx
// app/produits/page.tsx (Server Component)
import { createServerClient } from '@verone/types/server';

export default async function ProduitsPage() {
  const supabase = createServerClient();
  const { data: products } = await supabase.from('products').select('*');

  return <ProductsList products={products} />;
}
```

#### **B. Client Component ("use client")**

Utilise pour :

- ✅ Interactivité (onClick, onChange, onSubmit)
- ✅ Hooks React (useState, useEffect, useReducer)
- ✅ Formulaires avec validation
- ✅ Composants avec animations

**Exemple :**

```tsx
// components/ProductForm.tsx (Client Component)
'use client';

import { useState } from 'react';
import { Button } from '@verone/ui';

export function ProductForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" disabled={isLoading}>
        Enregistrer
      </Button>
    </form>
  );
}
```

#### **C. Server Actions (Mutations)**

Utilise pour :

- ✅ CREATE, UPDATE, DELETE (pas de SQL côté client !)
- ✅ Validation serveur
- ✅ Revalidation du cache

**Exemple :**

```tsx
// app/produits/actions.ts (Server Action)
'use server';

import { createServerClient } from '@verone/types/server';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const supabase = createServerClient();

  const { error } = await supabase.from('products').insert({
    name: formData.get('name'),
    sku: formData.get('sku'),
  });

  if (error) throw error;
  revalidatePath('/produits');
}
```

---

### 3️⃣ PLAN D'IMPLÉMENTATION

**Rédiger un plan détaillé :**

```markdown
## PLAN DE CRÉATION UI

**Page/Composant :** Nom de la page ou du composant

**Composants réutilisés :**

- ✅ `Button` depuis `@verone/ui`
- ✅ `Card` depuis `@verone/ui`
- ✅ `ProductCard` depuis `@verone/ui-business`

**Nouveaux composants à créer :**

- `ProductFilterBar` (Client Component) - Barre de filtrage avec interactivité
- `ProductGrid` (Server Component) - Grille d'affichage

**Architecture :**

1. **Page (Server Component)** : `app/produits/page.tsx`
   - Fetch des produits depuis Supabase
   - Passe les données à ProductGrid

2. **ProductGrid (Server Component)** : `components/ProductGrid.tsx`
   - Affiche les produits en grille
   - Utilise ProductCard depuis @verone/ui-business

3. **ProductFilterBar (Client Component)** : `components/ProductFilterBar.tsx`
   - Filtres interactifs (catégorie, prix, stock)
   - useState pour gestion de l'état

4. **Server Actions** : `app/produits/actions.ts`
   - `createProduct()`
   - `updateProduct()`
   - `deleteProduct()`

**Placement dans le Monorepo :**

- Utilisé uniquement par `back-office` → `apps/back-office/src/components/`
- Utilisé par >1 app → `packages/@verone/[domaine]/src/components/`

**Types de données :**

- Import depuis `@verone/types` : `Database['public']['Tables']['products']['Row']`
```

---

### 4️⃣ STOP & VALIDATION

**🛑 ARRÊT OBLIGATOIRE**

**NE GÉNÈRE AUCUN FICHIER TSX/TS.**

Présente le plan complet au développeur et attends son **"GO"** explicite.

**Questions de validation :**

- Tous les composants réutilisables ont-ils été identifiés ?
- L'architecture Server/Client est-elle correcte ?
- Le placement dans le Monorepo est-il approprié ?
- Les Server Actions sont-elles nécessaires ?
- Les types Supabase sont-ils utilisés correctement ?

**Seulement après validation :**

1. Créer les fichiers dans le bon dossier (app ou package)
2. Implémenter les composants avec les imports `@verone/*`
3. Tester le rendu et l'interactivité
4. Vérifier qu'il n'y a pas d'erreurs console
5. Mettre à jour la documentation avec `/update-docs`

---

## 🎯 EXEMPLES DE CAS D'USAGE

### Cas 1 : Créer une page de liste de produits

**Mauvais workflow :**
❌ "Je vais créer ProductCard, ProductGrid, ProductList..."

**Bon workflow :**

1. ✅ Vérifier `@verone/ui-business` → Découvrir que `ProductCard` existe déjà
2. ✅ Vérifier `@verone/ui` → Utiliser `Card`, `Badge`, `Button` existants
3. ✅ Plan : Créer seulement `ProductGrid` (Server Component) qui compose les existants
4. ✅ STOP → Présenter le plan
5. ✅ Après GO → Créer uniquement `ProductGrid`

### Cas 2 : Créer un formulaire de création produit

**Mauvais workflow :**
❌ "Je vais faire un formulaire avec fetch côté client"

**Bon workflow :**

1. ✅ Vérifier `@verone/ui` → Utiliser `Form`, `Input`, `Button` existants
2. ✅ Architecture : Client Component (formulaire) + Server Action (mutation)
3. ✅ Plan : `ProductForm` (Client) + `createProduct` (Server Action)
4. ✅ Types : Import depuis `@verone/types` pour type-safety
5. ✅ STOP → Présenter le plan
6. ✅ Après GO → Créer le formulaire + l'action

---

## 📐 STANDARDS UI VÉRONE

### Imports Obligatoires

```tsx
// ✅ CORRECT
import { Button, Card } from '@verone/ui';
import { ProductCard } from '@verone/ui-business';
import type { Database } from '@verone/types';

// ❌ INCORRECT
import { Button } from '../../packages/@verone/ui';
import { ProductCard } from '../../../ui-business';
```

### Conventions de Nommage

- **Composants :** PascalCase (`ProductCard`, `OrderStatusBadge`)
- **Fichiers :** kebab-case ou PascalCase (`product-card.tsx` ou `ProductCard.tsx`)
- **Server Actions :** camelCase (`createProduct`, `updateOrder`)
- **Props :** camelCase (`isLoading`, `onSubmit`)

### Accessibilité (A11Y)

- ✅ Utiliser les composants UI qui ont déjà l'accessibilité intégrée
- ✅ Ajouter `aria-label` sur les boutons sans texte
- ✅ Utiliser `<label>` pour tous les inputs
- ✅ Gérer le focus keyboard (Tab navigation)

### Performance

- ✅ Utiliser Server Components par défaut
- ✅ Limiter l'utilisation de "use client" au strict nécessaire
- ✅ Lazy load les composants lourds avec `dynamic()`
- ✅ Optimiser les images avec `next/image`

---

## 🚫 ANTI-PATTERNS À ÉVITER

❌ **Créer un composant sans vérifier s'il existe déjà**
→ Doublon, perte de cohérence visuelle

❌ **Faire du fetch côté client au lieu de Server Component**
→ Perte de performance, exposition des credentials

❌ **Mettre du SQL dans un Client Component**
→ Faille de sécurité critique

❌ **Utiliser `any` au lieu des types Supabase**
→ Perte de type-safety

❌ **Créer un composant dans `app/` alors qu'il est utilisé par >1 app**
→ Violation de l'architecture Monorepo

❌ **Utiliser des imports relatifs au lieu de `@verone/*`**
→ Casse la résolution de modules Turborepo

---

## 🛠️ OUTILS COMPLÉMENTAIRES

- **shadcn/ui :** Les composants `@verone/ui` sont basés sur shadcn/ui
- **Tailwind CSS :** Pour le styling (classes utilitaires)
- **Radix UI :** Pour les composants accessibles (déjà intégrés dans @verone/ui)

---

**MODE EXPERT FRONTEND ACTIVÉ.**
Procède maintenant avec la checklist ci-dessus. Ne génère aucun code avant l'étape 4 (STOP & VALIDATION).
