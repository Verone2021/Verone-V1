# 🔍 Scripts Validation Vérone

**Scripts automatiques de détection d'incohérences et validation code**

Créés le : 2025-10-24
Best Practices : Développeurs Seniors 2025

---

## 📋 Vue d'Ensemble

3 scripts TypeScript pour garantir **qualité et cohérence** du code Vérone :

| Script                        | Objectif                  | Sévérité    | Temps |
| ----------------------------- | ------------------------- | ----------- | ----- |
| `check-db-type-alignment.ts`  | Types DB/Frontend alignés | ❌ Bloquant | ~2s   |
| `check-duplicate-hooks.ts`    | Pas de hooks dupliqués    | ⚠️ Warning  | ~3s   |
| `check-naming-consistency.ts` | Conventions nommage       | ❌ Bloquant | ~2s   |

**Total validation** : ~7s (bloque commit si erreurs)

---

## 🚀 Usage

### Via NPM Scripts

```bash
# Validation complète (type-check + 3 scripts)
npm run validate:all

# Scripts individuels
npm run validate:types    # Database/TypeScript alignment
npm run validate:hooks    # Hooks duplications
npm run validate:naming   # Naming conventions

# ESLint strict mode
npm run lint:strict       # Checker
npm run lint:strict:fix   # Auto-fix
```

### Direct (Node)

```bash
# Tous fichiers
node scripts/validation/check-db-type-alignment.ts
node scripts/validation/check-duplicate-hooks.ts
node scripts/validation/check-naming-consistency.ts

# Fichiers staged uniquement (git hooks)
node scripts/validation/check-db-type-alignment.ts --staged
node scripts/validation/check-naming-consistency.ts --staged
```

### Automatique (Git Hooks)

**Pre-commit hook** (`.husky/pre-commit`) :

- ✅ Type check
- ✅ Lint staged files
- ✅ Naming conventions (staged)
- ✅ DB type alignment (staged)

**Impossible de commit si erreurs détectées** 🔒

---

## 📖 Script 1 : check-db-type-alignment.ts

**Objectif** : Détecter types manuels au lieu de types Supabase générés

### Détections

| Anti-Pattern                    | Sévérité   | Message                                                               |
| ------------------------------- | ---------- | --------------------------------------------------------------------- |
| `type Product = { id: string }` | ❌ Error   | Utiliser `Database["public"]["Tables"]["products"]["Row"]`            |
| `interface Order { ... }`       | ❌ Error   | Utiliser types Database générés                                       |
| `.from('products')` (sans type) | ⚠️ Warning | Ajouter `.from<Database["public"]["Tables"]["products"]["Row"]>(...)` |

### Best Practices

```typescript
// ❌ MAUVAIS : Type manuel
type Product = {
  id: string;
  name: string;
};

// ✅ BON : Type Supabase
import { Database } from '@/types/supabase';
type Product = Database['public']['Tables']['products']['Row'];

// ✅ BON : Query typée
const { data } = await supabase
  .from('products')
  .select<Database['public']['Tables']['products']['Row']>('*');
```

### Rapport Exemple

```
═══════════════════════════════════════════════════════════════════════════════
🔍 RAPPORT VALIDATION TYPES DATABASE/FRONTEND
═══════════════════════════════════════════════════════════════════════════════

📊 RÉSUMÉ:
   - Erreurs: 2
   - Warnings: 1
   - Total: 3

❌ ERREURS (Types manuels détectés):
────────────────────────────────────────────────────────────────────────────────

📁 src/hooks/use-products.ts:5:1
   Type manuel détecté. Utiliser Database["public"]["Tables"]["..."]["Row"]
   Code: type Product = { id: string, name: string };

💡 RECOMMANDATIONS:
   1. Toujours importer: import { Database } from "@/types/supabase"
   2. Typer avec: Database["public"]["Tables"]["products"]["Row"]
   3. Queries typées: .from<Database["public"]["Tables"]["..."]["Row"]>("table")
   4. Pas de types manuels dupliqués (source vérité = supabase.ts)
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📖 Script 2 : check-duplicate-hooks.ts

**Objectif** : Détecter hooks dupliqués ou redondants

### Détections

| Type                | Sévérité   | Exemple                                          |
| ------------------- | ---------- | ------------------------------------------------ |
| Noms similaires     | ❌ Error   | `use-organizations.ts` vs `use-organisations.ts` |
| Même table Supabase | ⚠️ Warning | 3 hooks accèdent `products`                      |
| Hook non utilisé    | ℹ️ Info    | 0 imports dans codebase                          |

### Analyse

Pour chaque hook, extrait :

- **Tables** : `.from('products')`
- **Queries** : `.select()`, `.insert()`, etc.
- **Exports** : Fonctions exportées
- **Dependencies** : Autres hooks importés
- **Usage Count** : Nombre d'imports dans le code

### Best Practices

```typescript
// ❌ MAUVAIS : Duplication
// src/hooks/use-products.ts
export function useProducts() {
  return supabase.from('products').select('*');
}

// src/hooks/use-catalogue.ts
export function useCatalogue() {
  return supabase.from('products').select('*'); // Duplication!
}

// ✅ BON : Réutilisation
// src/hooks/use-products.ts (single source)
export function useProducts() {
  return supabase.from('products').select('*');
}

// src/hooks/use-catalogue.ts
import { useProducts } from './use-products';
export function useCatalogue() {
  return useProducts(); // Réutilise
}
```

### Rapport Exemple

```
═══════════════════════════════════════════════════════════════════════════════
🔍 RAPPORT DÉTECTION DOUBLONS HOOKS
═══════════════════════════════════════════════════════════════════════════════

📊 STATISTIQUES:
   - Total hooks: 87
   - Hooks utilisés: 82
   - Hooks non utilisés: 5
   - Issues détectées: 3

❌ ERREURS (Duplications critiques):
────────────────────────────────────────────────────────────────────────────────

1. Noms très similaires (92% similarité)
   Hooks concernés: use-organisations, use-organizations
   💡 Recommandation: Vérifier si duplication ou renommer pour clarté

⚠️  WARNINGS (Redondances potentielles):
────────────────────────────────────────────────────────────────────────────────

1. 3 hooks accèdent la table "products"
   Hooks concernés: use-products, use-catalogue, use-stock-products
   💡 Recommandation: Consolider la logique dans un seul hook si redondant

💡 BEST PRACTICES:
   1. Réutiliser hooks existants au lieu de créer doublons
   2. Naming cohérent: use-{domain}.ts (ex: use-products.ts)
   3. Supprimer hooks morts (deadcode) après vérification
   4. Un hook = une responsabilité (Single Responsibility)
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📖 Script 3 : check-naming-consistency.ts

**Objectif** : Enforcer conventions de nommage Vérone

### Conventions

| Type           | Convention                  | Exemple Valid                 | Exemple Invalid         |
| -------------- | --------------------------- | ----------------------------- | ----------------------- |
| **Hooks**      | `use-{domain}.ts`           | `use-products.ts`             | `products-hook.ts`      |
| **Components** | `{name}.tsx`                | `product-card.tsx`            | `ProductCard.tsx`       |
| **Types**      | `PascalCase`                | `Product`, `OrderItem`        | `product`, `order_item` |
| **Functions**  | `camelCase`                 | `calculatePrice`              | `calculate_price`       |
| **Variables**  | `camelCase` ou `UPPER_CASE` | `productPrice`, `MAX_RETRIES` | `product_price`         |
| **DB Tables**  | `snake_case`                | `products`, `sales_orders`    | `Products`              |
| **Enums**      | `snake_case_type`           | `user_role_type`              | `UserRole`              |

### Détections

- ✅ Fichiers : Naming hooks, components, pages
- ✅ Code : Types, interfaces, functions, variables

### Best Practices

```typescript
// ❌ MAUVAIS
type product_with_images = { ... };              // snake_case type
function CalculatePrice() { ... }                // PascalCase function
const product_total = 100;                       // snake_case variable

// ✅ BON
type ProductWithImages = { ... };                // PascalCase type
function calculatePrice() { ... }                // camelCase function
const productTotal = 100;                        // camelCase variable
const MAX_RETRIES = 3;                           // UPPER_CASE constant
```

### Rapport Exemple

```
═══════════════════════════════════════════════════════════════════════════════
🔍 RAPPORT VALIDATION NAMING CONVENTIONS
═══════════════════════════════════════════════════════════════════════════════

📊 RÉSUMÉ:
   - Erreurs: 3
   - Warnings: 2
   - Total: 5

❌ ERREURS (Conventions violées):
────────────────────────────────────────────────────────────────────────────────

1. src/hooks/ProductsHook.ts
   Hooks doivent suivre: use-{domain}.ts (kebab-case)
   ❌ Actuel: ProductsHook.ts
   ✅ Attendu: use-products.ts

2. src/components/business/ProductCard.tsx:10
   Types doivent être PascalCase, pas snake_case
   ❌ Actuel: product_with_images
   ✅ Attendu: ProductWithImages

💡 CONVENTIONS VÉRONE:
   - Hooks: use-{domain}.ts (use-products.ts)
   - Components: {name}.tsx (product-card.tsx)
   - Types/Interfaces: PascalCase (Product, OrderItem)
   - Functions: camelCase (calculatePrice, getUserRole)
   - Variables: camelCase ou UPPER_CASE (orderTotal, MAX_RETRIES)
   - Database Tables: snake_case (products, sales_orders)
═══════════════════════════════════════════════════════════════════════════════
```

---

## ⚙️ Configuration

### ESLint Strict (`.eslintrc.strict.json`)

**Rules activées** :

- ✅ TypeScript strict mode
- ✅ No explicit any
- ✅ No unsafe operations
- ✅ Consistent type imports/exports
- ✅ Naming conventions
- ✅ React Hooks rules
- ✅ Import organization

**Usage** :

```bash
npm run lint:strict       # Check
npm run lint:strict:fix   # Auto-fix
```

### Lint-Staged (`.lintstagedrc.json`)

**Auto-fix sur fichiers staged** :

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "src/hooks/use-*.ts": ["node scripts/validation/check-duplicate-hooks.ts"],
  "*.{json,md}": ["prettier --write"]
}
```

### Git Hooks (`.husky/pre-commit`)

**Validation automatique avant commit** :

1. Type check (`tsc --noEmit`)
2. Lint staged (`lint-staged`)
3. Naming conventions (staged)
4. DB type alignment (staged)

**Total** : ~7-10s | **Bloque commit si erreurs** 🔒

---

## 🎯 Exit Codes

| Code | Signification                        |
| ---- | ------------------------------------ |
| `0`  | ✅ Validation réussie                |
| `1`  | ❌ Erreurs détectées (bloque commit) |

---

## 📚 Références

### Inspiré Par

- [TypeScript Best Practices 2025](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [Husky Git Hooks](https://typicode.github.io/husky/)
- [Reddit r/typescript - Code Quality](https://www.reddit.com/r/typescript/)
- [GitHub - lint-staged](https://github.com/okonet/lint-staged)

### Documentation Interne

- `docs/database/best-practices.md` - Anti-hallucination guide
- `docs/database/SCHEMA-REFERENCE.md` - 78 tables Vérone
- `CLAUDE.md` - Instructions projet

---

**Créé** : 2025-10-24
**Mainteneur** : Vérone Dev Team
**Version** : 1.0.0
