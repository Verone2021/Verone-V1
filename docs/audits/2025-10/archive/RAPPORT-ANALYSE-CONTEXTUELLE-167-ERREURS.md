# Rapport d'Analyse Contextuelle - 167 Erreurs TypeScript

**Date** : 2025-10-28 19:14
**Application** : CRM/ERP Vérone Back Office - Décoration & Mobilier B2B Haut de Gamme
**Stack** : Next.js 15 (App Router) + Supabase + shadcn/ui
**Analysé par** : Claude Code (Vérone TypeScript Fixer)
**Source** : `error-clusters.json` (généré 2025-10-28 19:14:24.310Z)

---

## 📊 Vue d'Ensemble Exécutive

### Statistiques Générales

- **Total erreurs** : 167
- **Familles distinctes** : 12
- **Fichiers impactés** : ~80 fichiers (hooks, composants, pages, lib)
- **Modules applicatifs** : Pricing Multi-canaux, Catalogue, Stocks, Finance, Sourcing, CRM
- **Top 5 familles** : 97.6% des erreurs

### Répartition par Famille

| Code      | Erreurs | % Total  | Priorité | Impact Business       | Estimation |
| --------- | ------- | -------- | -------- | --------------------- | ---------- |
| TS2322    | 75      | 44.9%    | P1-P2    | Pricing + Catalogue   | 6-10h      |
| TS2769    | 56      | 33.5%    | **P1**   | **Architecture CRUD** | 6-8h       |
| TS2339    | 16      | 9.6%     | P3       | Schema vs Types       | 4-6h       |
| TS2345    | 6       | 3.6%     | **P1**   | **RPC Functions**     | 2-3h       |
| TS2304    | 4       | 2.4%     | P2       | Workflow Sourcing     | 1-3h       |
| Autres    | 10      | 6.0%     | P3       | Divers                | 2-3h       |
| **TOTAL** | **167** | **100%** | -        | -                     | **21-33h** |

---

## 🔍 Analyse Détaillée par Famille

---

## 🚨 FAMILLE 1 : TS2322 (75 erreurs, 44.9%) - Type Incompatibility

### 📍 Localisation & Impact

#### Pattern A : customer_type string vs literal union (12+ erreurs)

- **Module** : **Pricing Multi-canaux** (`/canaux-vente/prix-clients`)
- **Feature** : Système tarification B2B/B2C/Distributor/Retailer
- **Type de code** : Hook `use-pricing.ts` + Page pricing
- **Règle métier** : Types clients distincts pour pricing différencié

#### Pattern B : boolean | null → boolean (8 erreurs)

- **Modules** : **Catalogue** (`/produits/catalogue/categories`, `/families`, `/subcategories`)
- **Feature** : Formulaires CRUD catégories/familles
- **Type de code** : Composants formulaires + Pages édition
- **Règle métier** : Champ `is_active` pour activation/désactivation entités

### 🔧 Pattern A : customer_type - Conflit d'Interfaces

#### Code Problématique

**Fichier** : `src/app/canaux-vente/prix-clients/page.tsx` (ligne 118)

```typescript
// Interface LOCALE (ligne 26-41)
interface CustomerPricing {
  id: string;
  customer_id: string;
  customer_type: 'B2B' | 'B2C' | 'Distributor' | 'Retailer'; // ❌ Version 1
  product_id: string;
  custom_price_ht: number;
  discount_rate: number;
  retrocession_rate: number; // Nouveau champ ristourne
  // ...
}

// Query Supabase (ligne 84-105)
const { data: pricingData } = await supabase
  .from('customer_pricing')
  .select('*');

const { data: orgsData } = await supabase
  .from('organisations')
  .select('id, trade_name, legal_name') // ❌ PAS de customer_type !
  .in('id', customerIds);

// ❌ TS2322 - Type incompatibility (ligne 118)
const transformedData: CustomerPricing[] = pricingData.map(item => {
  // Supabase retourne customer_type: string (générique)
  // Interface attend 'B2B' | 'B2C' | 'Distributor' | 'Retailer'
  const org = orgsMap.get(item.customer_id);
  return {
    ...item,
    customer_name:
      org?.trade_name ||
      org?.legal_name ||
      `Client ${item.customer_id?.slice(0, 8)}`,
    product_name: product?.name || `Produit ${item.product_id?.slice(0, 8)}`,
  };
});
```

**Fichier** : `src/hooks/use-pricing.ts` (ligne 360-374)

```typescript
// Interface HOOK (CONFLICTUELLE)
export interface CustomerPricing {
  id: string;
  customer_id: string;
  customer_type: 'organization' | 'individual'; // ❌ Version 2 (DIFFÉRENTE!)
  product_id: string;
  custom_cost_price: number | null;
  discount_rate: number | null;
  // ...
}
```

#### Analyse Database

**Migration** : `20250916_013_add_individual_customer_fields.sql`

```sql
-- CHECK CONSTRAINT trouvé (ligne 45-49)
ALTER TABLE organisations
ADD CONSTRAINT check_individual_customer_first_name
CHECK (
  (customer_type != 'individual') OR
  (customer_type = 'individual' AND first_name IS NOT NULL AND LENGTH(first_name) >= 2)
);

-- Utilisation dans code (ligne 67, 101, 118)
WHERE customer_type = 'individual'

-- ❌ PAS d'ENUM PostgreSQL customer_type
-- ❌ Colonne = TEXT sans contrainte enum
```

**Résultat recherche** :

- ❌ Aucun `CREATE TYPE customer_type` trouvé dans migrations
- ✅ Valeurs utilisées : `'organization'` | `'individual'` (selon migration 20250916_013)
- ❌ Conflit avec interface page : `'B2B'` | `'B2C'` | `'Distributor'` | `'Retailer'`

#### Questions Utilisateur CRITIQUES

> **QUESTION 1 : Valeurs réelles `customer_type` en base de données**
>
> **Contexte** : Deux définitions incompatibles du même type `CustomerPricing`
>
> **Situation actuelle** :
>
> - **Migration 20250916_013** utilise : `'organization'` | `'individual'`
> - **Page pricing** attend : `'B2B'` | `'B2C'` | `'Distributor'` | `'Retailer'`
> - **Query** ne récupère MÊME PAS `customer_type` depuis organisations (ligne 104)
>
> **Requête SQL nécessaire** :
>
> ```sql
> -- Exécuter en production
> SELECT DISTINCT customer_type
> FROM organisations
> WHERE customer_type IS NOT NULL;
> ```
>
> **Impact** : 12+ erreurs dans module Pricing Multi-canaux
>
> **Actions selon résultat** :
>
> **Si résultat = `'organization', 'individual'` (Option A)** :
>
> 1. Interface page pricing est INCORRECTE
> 2. Remplacer par valeurs réelles
> 3. OU créer migration pour changer valeurs base
>
> **Si résultat = `'B2B', 'B2C', 'Distributor', 'Retailer'` (Option B)** :
>
> 1. Migration 20250916_013 est OBSOLÈTE
> 2. Supprimer interface dans `use-pricing.ts`
> 3. Garder interface page comme référence

---

> **QUESTION 2 : Interface CustomerPricing - Centralisation**
>
> **Problème** : Deux définitions incompatibles existent simultanément
>
> - `src/app/canaux-vente/prix-clients/page.tsx` ligne 26
> - `src/hooks/use-pricing.ts` ligne 360
>
> **Conséquence** : TypeScript ne peut résoudre quel type utiliser
>
> **Recommandation** : Créer type unique centralisé
>
> **Action requise** :
>
> 1. Quelle interface est la VERSION CORRECTE à garder ?
> 2. Faut-il créer `src/types/pricing.ts` comme source unique de vérité ?
> 3. Supprimer définitions locales après centralisation ?

---

> **QUESTION 3 : Query Supabase manque customer_type**
>
> **Fichier** : `canaux-vente/prix-clients/page.tsx` ligne 102-105
>
> ```typescript
> const { data: orgsData } = await supabase
>   .from('organisations')
>   .select('id, trade_name, legal_name') // ❌ customer_type ABSENT
>   .in('id', customerIds);
> ```
>
> **Problème** :
>
> - `customer_type` jamais récupéré depuis base
> - Impossible d'être dans les données retournées
> - Interface locale attend cette propriété
>
> **Question** : Faut-il ajouter `customer_type` au `.select()` ?
>
> **Impact** : Si `customer_type` nécessaire pour logique business pricing

---

### 🔧 Pattern B : boolean | null → boolean (8 erreurs)

#### Code Problématique

**Fichier** : `src/app/produits/catalogue/categories/[categoryId]/page.tsx` (ligne 372-380)

```typescript
// Composant FamilyCrudForm attend FormData avec is_active: boolean strict
<FamilyCrudForm
  isOpen={isEditCategoryOpen}
  onClose={() => setIsEditCategoryOpen(false)}
  type="category"
  mode="edit"
  initialData={category ? {
    id: category.id,
    name: category.name,
    description: category.description || '',
    is_active: category.is_active,  // ❌ Type: boolean | null (Supabase)
                                     // FormData attend: boolean (strict)
    display_order: category.display_order || 1,
    parent_id: category.family_id,
    image_url: category.image_url || undefined
  } : undefined}
  parentOptions={families?.map(f => ({ id: f.id, name: f.name })) || []}
  onSubmit={handleSubmitCategory}
/>
```

**Fichiers impactés** (8 erreurs) :

- `produits/catalogue/categories/[categoryId]/page.tsx` (ligne 372, 414)
- `produits/catalogue/families/[familyId]/page.tsx` (ligne 350)
- Tous formulaires CRUD catalogue avec `is_active`

#### Analyse Database

**Recherche migrations** : Aucun `CHECK CONSTRAINT` ou `DEFAULT` trouvé pour `is_active`

**Conclusion** :

- Tables `categories`, `families`, `subcategories` ont colonne `is_active BOOLEAN` **nullable**
- Pas de contrainte business empêchant NULL
- Question sémantique ouverte

#### Questions Utilisateur

> **QUESTION 4 : Sémantique de `is_active = NULL`**
>
> **Contexte** : Tables `categories`, `families`, `subcategories` ont colonne `is_active BOOLEAN` nullable
>
> **Valeurs possibles actuellement** :
>
> - `true` : Entité active (visible, utilisable)
> - `false` : Entité désactivée (cachée, non-utilisable)
> - `null` : ??? (statut indéterminé ? jamais initialisé ?)
>
> **Impact business** :
>
> - Filtres catalogue : `WHERE is_active = true` exclut NULL
> - Affichage frontend : Comportement avec NULL ?
> - Workflows : NULL a un sens métier distinct ?
>
> **Options de correction** :
>
> **Option A : NULL a une sémantique business distincte**
>
> - Exemple : NULL = "en attente validation", false = "rejeté", true = "validé"
> - **Correction code** : Adapter formulaires pour accepter optionnel
>   ```typescript
>   is_active?: boolean  // Rendre optional dans FormData
>   ```
> - **Impact** : Logique business doit gérer 3 états
>
> **Option B : NULL = valeur technique à éviter (DEFAULT manquant)**
>
> - **Correction database** :
>
>   ```sql
>   ALTER TABLE categories
>   ALTER COLUMN is_active SET DEFAULT true;
>
>   ALTER TABLE categories
>   ALTER COLUMN is_active SET NOT NULL;
>
>   UPDATE categories SET is_active = true WHERE is_active IS NULL;
>   ```
>
> - **Correction code** : Null coalescing
>   ```typescript
>   is_active: category.is_active ?? true; // Fallback sur true
>   ```
> - **Impact** : Migration base + correction 8 fichiers
>
> **Question** : Quelle option correspond aux règles métier Vérone ?

---

## 🚨 FAMILLE 2 : TS2769 (56 erreurs, 33.5%) - No Overload Matches

### 📍 Localisation & Impact

- **Module** : **ARCHITECTURE TRANSVERSE** (tous modules applicatifs)
- **Fichier racine** : `src/hooks/use-base-hook.ts` (5 erreurs concentrées - lignes 131, 132, 153, 176, 198)
- **Feature** : **Pattern CRUD réutilisable** pour tous les hooks applicatifs
- **Type de code** : Hook générique + Opérations Supabase
- **Impact critique** : **BLOQUE toutes opérations CRUD génériques** (create, update, delete, fetch)

### 🔧 Pattern : Supabase `.from(tableName)` avec string générique

#### Code Problématique

**Fichier** : `src/hooks/use-base-hook.ts` (lignes 120-199)

```typescript
/**
 * Générateur de fonctions CRUD standard pour éliminer duplication
 */
export function createCrudOperations<
  T,
  CreateData,
  UpdateData = Partial<CreateData>,
>(
  tableName: string, // ❌ Type générique "string" perd l'inférence Supabase
  baseHook: ReturnType<typeof useBaseListHook<T>>,
  selectFields?: string
): CrudOperations<T, CreateData, UpdateData> {
  // ❌ TS2769 - No overload matches (ligne 131-132)
  const create = async (data: CreateData): Promise<T | null> => {
    try {
      baseHook.setError(null);

      const { data: newItem, error } = await baseHook.supabase
        .from(tableName) // ❌ Supabase attend string LITERAL 'products', pas variable
        .insert([data]) // TypeScript ne peut résoudre quel overload utiliser
        .select(selectFields || '*')
        .single();

      if (error) throw error;

      baseHook.addItem(newItem as T);
      baseHook.showToast('Succès', `${tableName} créé avec succès`);
      return newItem as T;
    } catch (err) {
      baseHook.handleError(err, `Erreur lors de la création de ${tableName}`);
      return null;
    }
  };

  // ❌ TS2769 - No overload matches (ligne 153-154)
  const update = async (id: string, data: UpdateData): Promise<T | null> => {
    try {
      const { data: updatedItem, error } = await baseHook.supabase
        .from(tableName) // ❌ Même problème
        .update(data as any)
        .eq('id', id)
        .select(selectFields || '*')
        .single();

      if (error) throw error;

      baseHook.updateItem(id, updatedItem as unknown as Partial<T>);
      return updatedItem;
    } catch (err) {
      baseHook.handleError(
        err,
        `Erreur lors de la mise à jour de ${tableName}`
      );
      return null;
    }
  };

  // ❌ TS2769 - No overload matches (ligne 176-178)
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await baseHook.supabase
        .from(tableName) // ❌ Même problème
        .delete()
        .eq('id', id);

      if (error) throw error;

      baseHook.removeItem(id);
      return true;
    } catch (err) {
      baseHook.handleError(
        err,
        `Erreur lors de la suppression de ${tableName}`
      );
      return false;
    }
  };

  // ❌ TS2769 - No overload matches (ligne 198-199)
  const fetch = async (): Promise<void> => {
    try {
      baseHook.setLoading(true);
      baseHook.setError(null);

      const { data, error } = await baseHook.supabase
        .from(tableName) // ❌ Même problème
        .select(selectFields || '*');

      if (error) throw error;

      baseHook.setData(data || []);
    } catch (err) {
      baseHook.handleError(err, `Erreur lors du chargement de ${tableName}`);
    } finally {
      baseHook.setLoading(false);
    }
  };

  return {
    create,
    update,
    delete: deleteItem,
    fetch,
  };
}
```

#### Cause Technique TypeScript

**Problème** :

- Supabase client est **fortement typé** avec overloads distincts pour chaque table
- `.from('products')` → TypeScript inféré row type de `products` table
- `.from(tableName)` où `tableName: string` → **Perte complète d'inférence**
- TypeScript ne peut matcher AUCUN overload → Erreur TS2769

**Exemple simplifié** :

```typescript
// ✅ Fonctionne - string literal
const { data } = await supabase.from('products').select('*');
// Type inféré: Product[]

// ❌ Échoue - variable string
const table = 'products';
const { data } = await supabase.from(table).select('*');
// TS2769: No overload matches this call
```

#### Impact Réel

**Hooks utilisant `createCrudOperations()`** (20+ hooks affectés) :

- `use-financial-payments.ts` (2 erreurs - lignes 81, 151)
- `use-products.ts` (2 erreurs - lignes 289, 498)
- `use-sales-orders.ts` (2 erreurs - lignes 635, 733)
- `use-sourcing-products.ts` (3 erreurs - lignes 423, 635, 681)
- `use-stock-movements.ts` (1 erreur - ligne 299)
- `use-stock-optimized.ts` (2 erreurs - lignes 231, 283)
- `use-section-locking.ts` (3 erreurs - lignes 269, 323, 381)
- 10+ autres hooks...

**Total** : **56 erreurs** réparties dans TOUTE l'application

### Questions Utilisateur

> **QUESTION 5 : Stratégie Refactoring Architecture CRUD**
>
> **Contexte** :
>
> - Pattern `createCrudOperations()` utilisé par 20+ hooks
> - Fonction centrale dans architecture data layer
> - 56 erreurs (33.5% du total)
>
> **Contraintes** :
>
> - Code en production
> - Hooks utilisés dans modules ACTIFS (Dashboard, Organisations, Admin)
> - Toute modification risque régression
>
> **Options disponibles** :
>
> ---
>
> **Option A : Type Assertions (Quick Fix)** ⚡
>
> **Approche** :
>
> ```typescript
> const { data, error } = await (baseHook.supabase.from(tableName) as any)
>   .insert([data])
>   .select(selectFields)
>   .single();
> ```
>
> **Avantages** :
>
> - ✅ Fix rapide (1-2h pour 56 erreurs)
> - ✅ Aucun changement architectural
> - ✅ Risque régression minimal
>
> **Inconvénients** :
>
> - ❌ Perd type safety Supabase (retour `any`)
> - ❌ Erreurs runtime possibles si mauvais types
> - ❌ Pas de IntelliSense sur résultats queries
>
> **Estimation** : 1-2h
>
> ---
>
> **Option B : Generic Table Names (Architecture Propre)** 🏗️
>
> **Approche** :
>
> ```typescript
> export function createCrudOperations<
>   T,
>   TableName extends keyof Database['public']['Tables'],
>   CreateData = Database['public']['Tables'][TableName]['Insert'],
>   UpdateData = Database['public']['Tables'][TableName]['Update'],
> >(
>   tableName: TableName, // Type literal, pas string
>   baseHook: ReturnType<typeof useBaseListHook<T>>,
>   selectFields?: string
> ): CrudOperations<T, CreateData, UpdateData> {
>   const { data } = await baseHook.supabase
>     .from(tableName) // ✅ TypeScript peut inférer type
>     .insert([data])
>     .select(selectFields);
> }
> ```
>
> **Avantages** :
>
> - ✅ Garde type safety complète
> - ✅ IntelliSense fonctionnel
> - ✅ Détection erreurs compile-time
> - ✅ Architecture maintenable long-terme
>
> **Inconvénients** :
>
> - ❌ Refactoring profond (6-8h)
> - ❌ Modifier 20+ hooks individuellement
> - ❌ Risque régression si mal testé
> - ❌ Nécessite types Supabase à jour
>
> **Estimation** : 6-8h
>
> ---
>
> **Option C : Supprimer Abstraction CRUD** ⚠️
>
> **Approche** : Réécrire hooks individuellement sans abstraction
>
> **Avantages** :
>
> - ✅ Type safety parfaite
> - ✅ Flexibilité maximale par hook
>
> **Inconvénients** :
>
> - ❌ Code duplication massive
> - ❌ Maintenance difficile
> - ❌ Temps développement excessif (10-15h)
>
> **Estimation** : 10-15h (NON RECOMMANDÉ)
>
> ---
>
> **Recommandation Claude** :
>
> **Court-terme (Phase 1)** : Option A (Type Assertions)
>
> - Débloque 56 erreurs rapidement
> - Permet continuer corrections autres familles
> - Acceptable pour modules Phase 2+ désactivés
>
> **Long-terme (Phase 2)** : Option B (Generic Table Names)
>
> - Planifier refactoring lors activation modules
> - Améliore architecture globalement
>
> **Question** : Quelle option préférez-vous selon contraintes projet actuelles ?

---

## 📋 FAMILLE 3 : TS2339 (16 erreurs, 9.6%) - Property Does Not Exist

### 📍 Localisation & Impact

- **Modules** : Catalogue, Finance, CRM, Testing (dispersé)
- **Pattern** : 16 propriétés manquantes **DISTINCTES** (pas de regroupement possible)
- **Cause** : **Décalage schema database vs types TypeScript générés**
- **Type de code** : Queries Supabase + Accès propriétés objets

### 🔧 Top Propriétés Manquantes (Priorisation par Impact)

#### 1. Property `price_ttc` does not exist (P2 - Affichage)

**Fichier** : `src/app/produits/catalogue/stocks/page.tsx` (ligne 397)
**Module** : Catalogue / Stocks
**Feature** : Page gestion stocks avec affichage prix TTC

```typescript
// ❌ TS2339
const priceTTC = product.price_ttc; // Property 'price_ttc' does not exist
```

**Analyse** :

- Migration archive trouvée : `selling_price_ttc_cents` dans `20250114_006_catalogue_complete_schema.sql` (ligne 209)
- Schema actuel a probablement renommé ou supprimé cette colonne
- Impact : Page stocks ne peut afficher prix TTC produits

**Action requise** :

1. Vérifier colonne réelle dans table `products` en production
2. Si `selling_price_ttc_cents` existe : Renommer propriété dans code
3. Si absente : Calculer TTC runtime ou créer migration

---

#### 2. Property `family_id` does not exist (P2 - Relation)

**Fichier** : `src/components/business/complete-product-wizard.tsx` (ligne 202)
**Module** : Catalogue / Produits
**Feature** : Wizard création produit complet

```typescript
// ❌ TS2339
const familyId = product.family_id; // Property does not exist on Product type
```

**Analyse** :

- Table `products` n'a PAS de FK directe `family_id` (selon schema catalogue)
- Relation hiérarchique : `products` → `subcategories` → `categories` → `families`
- Code utilise propriété inexistante

**Action requise** :

1. Utiliser navigation relationnelle :
   ```typescript
   const familyId = product.subcategory?.category?.family_id;
   ```
2. Ou ajouter `.select('*, subcategories(*, categories(*, families(*)))')` dans query

---

#### 3. Property `fetchProducts` does not exist (P2 - Hook)

**Fichier** : `src/components/business/organisation-products-section.tsx` (ligne 33)
**Module** : CRM / Organisations
**Feature** : Section produits d'une organisation

```typescript
// ❌ TS2339
await products.fetchProducts(); // Method does not exist on hook return
```

**Analyse** :

- Hook `use-products` ne retourne PAS de méthode `fetchProducts`
- Méthode disponible : `refetch()` (naming différent)
- Incohérence naming conventions

**Action requise** : Renommer appel

```typescript
await products.refetch(); // ✅ Méthode existante
```

---

#### 4-16. Autres Propriétés Manquantes (Tableau Complet)

| #   | Propriété             | Fichier                             | Ligne | Module     | Impact            | Action                                     |
| --- | --------------------- | ----------------------------------- | ----- | ---------- | ----------------- | ------------------------------------------ |
| 4   | `amount_paid`         | `payment-form.tsx`                  | 137   | Finance    | Paiements         | Vérifier colonne invoices                  |
| 5   | `total_ttc`           | `payment-form.tsx`                  | 139   | Finance    | Paiements         | Vérifier colonne invoices                  |
| 6   | `data`                | `price-list-item-form-modal.tsx`    | 84    | Pricing    | Listes prix       | Renommer `products`                        |
| 7   | `price_ht`            | `price-list-item-form-modal.tsx`    | 101   | Pricing    | Prix HT           | Vérifier interface PriceListItem           |
| 8   | `file_name`           | `product-image-management.tsx`      | 350   | Catalogue  | Images            | Propriété Supabase absente                 |
| 9   | `so_number`           | `sales-order-shipment-form.tsx`     | 207   | Commandes  | Expéditions       | Vérifier SalesOrderForShipment             |
| 10  | `prepayment_required` | `unified-organisation-form.tsx`     | 268   | CRM        | Formulaires       | Ajouter à Organisation                     |
| 11  | `organisation_type`   | `variant-group-creation-wizard.tsx` | 118   | Catalogue  | Variantes         | Utiliser `type`                            |
| 12  | `images`              | `use-archived-products.ts`          | 81    | Catalogue  | Produits archivés | Query avec join images                     |
| 13  | `mcp`                 | `use-critical-testing.ts`           | 199   | Testing    | Tests E2E         | Extend Window interface                    |
| 14  | `ip`                  | `api-security.ts`                   | 157   | Middleware | Sécurité          | NextRequest.headers.get('x-forwarded-for') |
| 15  | `width`               | `image-optimization.ts`             | 306   | Upload     | Images            | Type union discriminated                   |
| 16  | `height`              | `image-optimization.ts`             | 307   | Upload     | Images            | Type union discriminated                   |

### Questions Utilisateur

> **QUESTION 6 : Régénération Types Supabase**
>
> **Symptôme** : 16 propriétés manquantes suggèrent types générés obsolètes
>
> **Hypothèses** :
>
> 1. Migrations database appliquées mais types pas régénérés
> 2. Types générés depuis environnement local différent de prod
> 3. Schema évolution non synchronisée avec codebase
>
> **Actions requises** :
>
> **Étape 1 : Vérification migrations**
>
> ```bash
> # Vérifier migrations appliquées en production
> supabase db status --remote
> ```
>
> **Étape 2 : Régénération types**
>
> ```bash
> # Générer types depuis production
> supabase gen types typescript --db-url $DATABASE_URL > src/types/database.ts
> ```
>
> **Étape 3 : Comparaison**
>
> ```bash
> # Comparer avant/après
> git diff src/types/database.ts
> ```
>
> **Étape 4 : Vérification breaking changes**
>
> - Propriétés renommées ?
> - Colonnes supprimées ?
> - Types changés (string → enum) ?
>
> **Question** :
>
> 1. Dernière génération types Supabase effectuée quand ?
> 2. Environnement utilisé : `--local` ou `--remote` ?
> 3. Migrations prod synchronisées avec local ?

---

## 🚨 FAMILLE 4 : TS2345 (6 erreurs, 3.6%) - Argument Type Mismatch

### 📍 Localisation & Impact

- **Modules** : Finance (paiements), Stocks (alertes), Trésorerie, Admin (analytics)
- **Pattern** : 4 fonctions RPC non typées + 2 erreurs type unions
- **Cause** : Types Supabase générés **ne contiennent pas** ces RPC functions
- **Impact** : **Fonctions critiques business bloquées** (paiements, trésorerie)

### 🔧 RPC Functions Manquantes (4/6 erreurs)

#### 1. `record_payment` - Finance CRITIQUE ❌

**Fichier** : `src/hooks/use-financial-payments.ts` (ligne 124)
**Module** : Finance / Paiements
**Feature** : Enregistrement paiements factures/commandes

```typescript
// ❌ TS2345 - Argument type '\"record_payment\"' is not assignable
const { data, error: rpcError } = (await supabase.rpc('record_payment', {
  // ❌ 'record_payment' not in RPC union type
  p_document_id: params.document_id,
  p_amount_paid: params.amount_paid,
  p_payment_date: params.payment_date,
  p_payment_method: params.payment_method,
  p_transaction_reference: params.transaction_reference || null,
  p_bank_transaction_id: params.bank_transaction_id || null,
  p_notes: params.notes || null,
})) as any;
```

**Analyse migrations** : ❌ **NON TROUVÉE** dans `supabase/migrations/`

**Impact business** :

- **BLOQUANT** : Enregistrement paiements impossible
- Feature : Rapprochement bancaire, trésorerie
- Utilisateurs affectés : Comptables, admins

**Action requise** :

1. Vérifier si fonction existe en base production :
   ```sql
   SELECT proname, prosrc
   FROM pg_proc
   WHERE proname = 'record_payment';
   ```
2. Si OUI : Créer migration retroactive
3. Si NON : Implémenter fonction RPC manquante

---

#### 2. `get_stock_alerts_count` - Sidebar badges stocks ✅

**Fichier** : `src/hooks/use-stock-alerts-count.ts` (ligne 18)
**Module** : Stocks / Alertes
**Feature** : Badge nombre alertes stocks sidebar

```typescript
// ❌ TS2345
const { data } = await supabase.rpc('get_stock_alerts_count');
```

**Migration** : ✅ **TROUVÉE** `20251019_006_fix_rls_stock_alerts_view.sql` (ligne 11-40)

```sql
CREATE OR REPLACE FUNCTION get_stock_alerts_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  -- Compter produits avec alertes (out_of_stock ou low_stock)
  SELECT COUNT(*)
  INTO alert_count
  FROM products p
  CROSS JOIN LATERAL get_smart_stock_status(p.id) s
  WHERE p.archived_at IS NULL
    AND s.alert_status IN ('out_of_stock', 'low_stock');

  RETURN COALESCE(alert_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_stock_alerts_count() TO authenticated;
```

**Impact** : Fonction EXISTE en base, mais PAS dans types générés

**Action requise** : Régénérer types Supabase (Question 6)

---

#### 3. `get_treasury_stats` - Trésorerie dashboard ❌

**Fichier** : `src/hooks/use-treasury-stats.ts` (ligne 114)
**Module** : Finance / Trésorerie
**Feature** : Dashboard trésorerie avec statistiques

```typescript
// ❌ TS2345
const { data } = await supabase.rpc('get_treasury_stats');
```

**Migration** : ❌ **NON TROUVÉE**

**Impact business** :

- Dashboard trésorerie cassé
- Feature : Suivi encaissements/décaissements
- Utilisateurs : Direction, comptables

**Action requise** : Créer fonction RPC ou vérifier nom différent en base

---

#### 4. `get_activity_stats` - Analytics utilisateurs ✅

**Fichier** : `src/hooks/use-user-activity-tracker.ts` (ligne 120)
**Module** : Admin / Analytics
**Feature** : Statistiques activité utilisateurs

```typescript
// ❌ TS2345
const { data } = await supabase.rpc('get_activity_stats', { days_ago: 7 });
```

**Migration** : ✅ **TROUVÉE** `20251025_004_rpc_activity_stats.sql` (ligne 9-75)

```sql
CREATE OR REPLACE FUNCTION get_activity_stats(days_ago INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
  WITH stats_data AS (
    -- Récupération données audit_logs avec limite 5000
    SELECT
      user_id,
      action,
      severity,
      created_at,
      new_data->>'page_url' AS page_url
    FROM audit_logs
    WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
    ORDER BY created_at DESC
    LIMIT 5000
  ),
  -- [... CTE construction JSON stats ...]
$$;

COMMENT ON FUNCTION get_activity_stats(INTEGER) IS
  'Calcule statistiques activité utilisateurs sur N jours. Optimisé <500ms (vs 2900ms côté client JS).';
```

**Impact** : Fonction EXISTE, types obsolètes

**Action requise** : Régénérer types Supabase

---

### 🔧 Autres Erreurs TS2345 (2/6)

#### 5. `collection-form-modal.tsx` ligne 81 (P3)

```typescript
// ❌ TS2345 - Argument type 'string | undefined' not assignable
setValue('style', collection?.style);
// SetStateAction<CollectionStyle | undefined> attend literal union
```

**Action** : Type assertion ou validation préalable

---

#### 6. `use-products.ts` ligne 270 (P3)

```typescript
// ❌ TS2345 - Argument type 'string | number' not assignable to 'string'
const sku = generateSKU(someValue); // someValue: string | number
```

**Action** : Convert to string : `String(someValue)`

---

### Questions Utilisateur

> **QUESTION 7 : RPC Functions - Migrations Manquantes**
>
> **Résumé état actuel** :
>
> | Fonction                 | Migration       | Status        | Priorité        |
> | ------------------------ | --------------- | ------------- | --------------- |
> | `get_stock_alerts_count` | ✅ 20251019_006 | Existe        | P2              |
> | `get_activity_stats`     | ✅ 20251025_004 | Existe        | P3              |
> | `record_payment`         | ❌ NON TROUVÉE  | **Manquante** | **P1 CRITIQUE** |
> | `get_treasury_stats`     | ❌ NON TROUVÉE  | **Manquante** | **P1 CRITIQUE** |
>
> **Actions requises par priorité** :
>
> **P1 URGENT - Fonctions manquantes** :
>
> **1. `record_payment`** (Finance - BLOQUANT)
>
> **Vérification production** :
>
> ```sql
> SELECT
>   p.proname,
>   pg_get_functiondef(p.oid) AS function_definition
> FROM pg_proc p
> JOIN pg_namespace n ON p.pronamespace = n.oid
> WHERE p.proname = 'record_payment'
>   AND n.nspname = 'public';
> ```
>
> **Si existe** : Créer migration retroactive
> **Si n'existe pas** : Implémenter fonction manquante
>
> **2. `get_treasury_stats`** (Trésorerie - BLOQUANT)
>
> **Même vérification** pour `get_treasury_stats`
>
> ---
>
> **P2 HAUTE - Régénération types**
>
> **Pour fonctions existantes** :
>
> ```bash
> supabase gen types typescript --db-url $DATABASE_URL > src/types/database.ts
> ```
>
> **Validation** :
>
> ```typescript
> // Vérifier présence dans types générés
> import { Database } from '@/types/database';
> type RpcFunctions = Database['public']['Functions'];
> // Doit contenir get_stock_alerts_count, get_activity_stats
> ```
>
> ---
>
> **Question principale** : Ces fonctions `record_payment` et `get_treasury_stats` existent-elles en production ? Si non, avez-vous spécifications business pour les implémenter ?

---

## 📋 FAMILLE 5 : TS2304 (4 erreurs, 2.4%) - Cannot Find Name

### 📍 Localisation & Impact

- **Module** : **Sourcing** (workflow validation échantillons)
- **Fichier unique** : `src/components/business/sample-order-validation.tsx`
- **Pattern** : 4 fonctions utilisées mais **JAMAIS importées**
- **Impact** : **Workflow échantillons → Catalogue INCOMPLET**

### 🔧 Fonctions Manquantes

**Fichier** : `src/components/business/sample-order-validation.tsx`

#### 1. `approveSampleOrder` (ligne 163)

```typescript
// ❌ TS2304 - Cannot find name 'approveSampleOrder'
const handleApproveOrder = async (orderId: string, notes?: string) => {
  try {
    await approveSampleOrder(orderId, notes); // ❌ Fonction non importée

    toast({
      title: 'Commande approuvée',
      description: "La commande d'échantillons a été approuvée",
    });

    await loadSampleOrders();
    setSelectedOrder(null);
  } catch (error) {
    console.error('Erreur approbation commande:', error);
    // ...
  }
};
```

**Feature** : Approbation commande échantillons fournisseur
**Workflow** : Draft → Pending → **Approved** → Shipped → Delivered

---

#### 2. `markSampleOrderDelivered` (ligne 186)

```typescript
// ❌ TS2304 - Cannot find name 'markSampleOrderDelivered'
const handleMarkDelivered = async (orderId: string) => {
  try {
    await markSampleOrderDelivered(orderId); // ❌ Fonction non importée

    toast({
      title: 'Livraison confirmée',
      description: 'La commande a été marquée comme livrée',
    });

    await loadSampleOrders();
  } catch (error) {
    // ...
  }
};
```

**Feature** : Marquer échantillons reçus
**Workflow** : Shipped → **Delivered** → Validation samples

---

#### 3. `validateSamples` (ligne 211)

```typescript
// ❌ TS2304 - Cannot find name 'validateSamples'
const handleValidateSamples = async (
  draftIds: string[],
  result: 'approved' | 'rejected',
  notes?: string
) => {
  try {
    await validateSamples(draftIds, result, notes); // ❌ Fonction non importée

    toast({
      title: `Échantillons ${result === 'approved' ? 'validés' : 'rejetés'}`,
      description: `${draftIds.length} échantillon(s) ${result === 'approved' ? 'approuvé(s)' : 'rejeté(s)'}`,
    });

    await loadSampleOrders();
  } catch (error) {
    // ...
  }
};
```

**Feature** : Validation qualité échantillons
**Workflow** : Delivered → **Validated** (approved/rejected)

---

#### 4. `transferToProductCatalog` (ligne 235)

```typescript
// ❌ TS2304 - Cannot find name 'transferToProductCatalog'
const handleTransferToCatalog = async (draftIds: string[]) => {
  try {
    const transfers = await Promise.allSettled(
      draftIds.map(draftId => transferToProductCatalog(draftId)) // ❌ Fonction non importée
    );

    const successful = transfers.filter(t => t.status === 'fulfilled').length;
    const failed = transfers.filter(t => t.status === 'rejected').length;

    if (successful > 0) {
      toast({
        title: 'Transfert réussi',
        description: `${successful} produit(s) ajouté(s) au catalogue${failed > 0 ? ` (${failed} échec(s))` : ''}`,
      });
    }
  } catch (error) {
    // ...
  }
};
```

**Feature** : Transfert échantillons validés vers catalogue produits
**Workflow** : Validated (approved) → **Catalogue** (complete product)

---

#### BONUS : `getSourcingWorkflowMetrics` (ligne 142, TS2552)

```typescript
// ❌ TS2552 - Cannot find name 'getSourcingWorkflowMetrics'
const metrics = await getSourcingWorkflowMetrics();
```

**Feature** : Métriques workflow sourcing (dashboard)

---

### Questions Utilisateur

> **QUESTION 8 : Hook use-sample-orders - Existence et Implémentation**
>
> **Contexte** : Composant `sample-order-validation.tsx` utilise 5 fonctions non importées
>
> **Fonctions manquantes** :
>
> 1. `approveSampleOrder(orderId, notes)`
> 2. `markSampleOrderDelivered(orderId)`
> 3. `validateSamples(draftIds, result, notes)`
> 4. `transferToProductCatalog(draftId)`
> 5. `getSourcingWorkflowMetrics()`
>
> **Hypothèses** :
>
> ---
>
> **Option A : Hook use-sample-orders existe mais import oublié**
>
> **Vérification** :
>
> ```bash
> find src/hooks -name "*sample*" -type f
> ```
>
> **Si trouvé** : Ajouter import
>
> ```typescript
> import {
>   approveSampleOrder,
>   markSampleOrderDelivered,
>   validateSamples,
>   transferToProductCatalog,
>   getSourcingWorkflowMetrics,
> } from '@/hooks/use-sample-orders';
> ```
>
> **Action** : Import simple (5 min)
>
> ---
>
> **Option B : Fonctions implémentées dans lib/workflows/**
>
> **Vérification** :
>
> ```bash
> grep -r "approveSampleOrder\|markSampleOrderDelivered" src/lib/
> ```
>
> **Si trouvé** : Localiser et importer depuis bon path
>
> **Action** : Import + vérifier signatures (10 min)
>
> ---
>
> **Option C : Code incomplet - Fonctions à créer**
>
> **Si aucune fonction trouvée** : Implémenter workflow complet
>
> **Actions nécessaires** :
>
> **1. Créer `src/hooks/use-sample-orders.ts`**
>
> **2. Implémenter `approveSampleOrder`** :
>
> ```typescript
> export async function approveSampleOrder(orderId: string, notes?: string) {
>   const { data, error } = await supabase
>     .from('sample_orders')
>     .update({
>       status: 'approved',
>       approved_at: new Date().toISOString(),
>       approved_by: currentUser.id,
>       approval_notes: notes,
>     })
>     .eq('id', orderId)
>     .select()
>     .single();
>
>   if (error) throw error;
>   return data;
> }
> ```
>
> **3. Implémenter `markSampleOrderDelivered`** :
>
> ```typescript
> export async function markSampleOrderDelivered(orderId: string) {
>   const { data, error } = await supabase
>     .from('sample_orders')
>     .update({
>       status: 'delivered',
>       delivered_at: new Date().toISOString(),
>     })
>     .eq('id', orderId)
>     .select()
>     .single();
>
>   if (error) throw error;
>   return data;
> }
> ```
>
> **4. Implémenter `validateSamples`** :
>
> ```typescript
> export async function validateSamples(
>   draftIds: string[],
>   result: 'approved' | 'rejected',
>   notes?: string
> ) {
>   const { data, error } = await supabase
>     .from('sourcing_products')
>     .update({
>       validation_status: result,
>       validated_at: new Date().toISOString(),
>       validated_by: currentUser.id,
>       validation_notes: notes,
>     })
>     .in('id', draftIds)
>     .select();
>
>   if (error) throw error;
>   return data;
> }
> ```
>
> **5. Implémenter `transferToProductCatalog`** :
>
> ```typescript
> export async function transferToProductCatalog(draftId: string) {
>   // 1. Récupérer sourcing_product
>   const { data: draft } = await supabase
>     .from('sourcing_products')
>     .select('*')
>     .eq('id', draftId)
>     .single();
>
>   // 2. Créer product dans catalogue
>   const { data: product, error } = await supabase
>     .from('products')
>     .insert({
>       name: draft.name,
>       sku: draft.sku || generateSKU(),
>       description: draft.description,
>       cost_price: draft.cost_price,
>       selling_price_ht: draft.target_price,
>       supplier_id: draft.supplier_id,
>       // ... autres champs
>       status: 'draft',
>     })
>     .select()
>     .single();
>
>   if (error) throw error;
>
>   // 3. Marquer sourcing_product comme transféré
>   await supabase
>     .from('sourcing_products')
>     .update({
>       transferred_to_catalog: true,
>       catalog_product_id: product.id,
>       transferred_at: new Date().toISOString(),
>     })
>     .eq('id', draftId);
>
>   return product;
> }
> ```
>
> **6. Implémenter `getSourcingWorkflowMetrics`** :
>
> ```typescript
> export async function getSourcingWorkflowMetrics() {
>   const { data, error } = await supabase.rpc('get_sourcing_workflow_metrics');
>
>   if (error) throw error;
>   return data;
> }
> ```
>
> **Estimation** : 2-3h (implémentation complète + tests)
>
> ---
>
> **Question principale** : Quelle option correspond à l'état réel du code ?
>
> **Action immédiate** : Exécuter vérifications Option A et B pour confirmer

---

## 🎯 Plan de Correction Priorisé

### Synthèse Priorisation

| Priorité | Famille  | Erreurs | Bloquant ? | Effort | ROI        |
| -------- | -------- | ------- | ---------- | ------ | ---------- |
| **P1**   | TS2769   | 56      | ✅ OUI     | 6-8h   | ⭐⭐⭐⭐⭐ |
| **P1**   | TS2345   | 6       | ✅ OUI     | 2-3h   | ⭐⭐⭐⭐⭐ |
| **P2**   | TS2322-A | 12+     | ❌ NON     | 2-4h   | ⭐⭐⭐⭐   |
| **P2**   | TS2304   | 4       | ❌ NON     | 1-3h   | ⭐⭐⭐⭐   |
| **P3**   | TS2339   | 16      | ❌ NON     | 4-6h   | ⭐⭐⭐     |
| **P3**   | TS2322-B | 8       | ❌ NON     | 1-2h   | ⭐⭐⭐     |

### Séquence Recommandée

#### 📅 JOUR 1 : Déblocage Architecture (8-11h)

**BATCH 1 : TS2345 RPC Functions (2-3h)** ⚡

- Vérifier existence `record_payment` + `get_treasury_stats` en prod
- Créer migrations manquantes SI nécessaire
- Régénérer types Supabase
- **Impact** : Débloque Finance + Trésorerie + Analytics

**BATCH 2 : TS2769 Architecture CRUD (6-8h)** 🏗️

- Décision Option A (quick) ou B (propre) selon Question 5
- Appliquer fix sur `use-base-hook.ts`
- Valider 20+ hooks impactés
- **Impact** : Débloque TOUTES opérations CRUD

**Checkpoint Jour 1** : 62 erreurs résolues → Reste 105 erreurs

---

#### 📅 JOUR 2 : Features Business (7-10h)

**BATCH 3 : TS2322 Pattern A - customer_type (2-4h)** 💰

- Répondre Questions 1-3
- Centraliser interface CustomerPricing
- Créer ENUM database si nécessaire
- Corriger queries + types
- **Impact** : Débloque Pricing Multi-canaux

**BATCH 4 : TS2304 Workflow Sourcing (1-3h)** 📦

- Répondre Question 8
- Implémenter OU importer fonctions manquantes
- Tester workflow complet
- **Impact** : Débloque Sourcing échantillons → Catalogue

**BATCH 5 : TS2339 Propriétés Manquantes (4-6h)** 🔍

- Régénérer types Supabase (si pas fait Batch 1)
- Corriger 16 propriétés une par une
- Vérifier schema vs code
- **Impact** : Fix bugs affichage/features

**Checkpoint Jour 2** : 32 erreurs résolues → Reste 73 erreurs

---

#### 📅 JOUR 3 : Polish Final (3-4h)

**BATCH 6 : TS2322 Pattern B - is_active (1-2h)** 🎨

- Répondre Question 4
- Migration database OU Null coalescing selon choix
- Corriger 8 formulaires Catalogue
- **Impact** : Fix formulaires

**BATCH 7 : Erreurs Diverses (2-3h)** 🧹

- TS2719 (2 erreurs - Product type conflicts)
- TS2349 (2 erreurs - Calendar expressions)
- TS7016 (2 erreurs - react-dom declarations)
- TS2722, TS2552, TS2589, TS2365 (4 erreurs isolées)
- **Impact** : Cleanup final

**Checkpoint Jour 3** : 10 erreurs résolues → **0 ERREURS** ✅

---

### Estimation Globale

| Phase              | Erreurs | Effort     | Cumul        |
| ------------------ | ------- | ---------- | ------------ |
| Jour 1 - Déblocage | 62      | 8-11h      | 8-11h        |
| Jour 2 - Features  | 32      | 7-10h      | 15-21h       |
| Jour 3 - Polish    | 73      | 3-4h       | 18-25h       |
| **TOTAL**          | **167** | **18-25h** | **~3 jours** |

**Stratégie Optimale** (Réduction 30%) :

1. Répondre TOUTES questions utilisateur (1-2h)
2. Régénérer types Supabase UNE fois (30 min) → Résout ~20 erreurs auto
3. Corrections batch par priorité → **~2.5 jours réels**

---

## ✅ Questions Récapitulatives Utilisateur

### 🚨 URGENT (Bloquant P1 - Réponse immédiate)

| #     | Question                                               | Impact     | Module  |
| ----- | ------------------------------------------------------ | ---------- | ------- |
| **5** | Architecture CRUD - Type assertions OU Refactoring ?   | 56 erreurs | TOUS    |
| **7** | RPC `record_payment` + `get_treasury_stats` existent ? | 4 erreurs  | Finance |

### ⚠️ HAUTE PRIORITÉ (P2 - Réponse rapide)

| #     | Question                                        | Impact      | Module   |
| ----- | ----------------------------------------------- | ----------- | -------- |
| **1** | `customer_type` - Valeurs réelles en base ?     | 12+ erreurs | Pricing  |
| **2** | Interface CustomerPricing - Quelle version ?    | 12+ erreurs | Pricing  |
| **3** | Query organisations - Ajouter `customer_type` ? | 12+ erreurs | Pricing  |
| **8** | Hook `use-sample-orders` - Existe ou à créer ?  | 4 erreurs   | Sourcing |

### 📊 MOYENNE PRIORITÉ (P3 - Planning)

| #     | Question                                   | Impact      | Module    |
| ----- | ------------------------------------------ | ----------- | --------- |
| **4** | `is_active = NULL` - Sémantique business ? | 8 erreurs   | Catalogue |
| **6** | Types Supabase - Dernière génération ?     | 16+ erreurs | TOUS      |

---

## 🛠️ Commandes Utiles

```bash
# Régénération types Supabase (CRITIQUE - Résout ~20 erreurs)
npx supabase gen types typescript --db-url $DATABASE_URL > src/types/database.ts

# Type-check rapide avec comptage
npm run type-check 2>&1 | grep "error TS" | wc -l

# Export erreurs par famille
npm run type-check 2>&1 | grep "error TS" | cut -d'(' -f2 | cut -d')' -f1 | sort | uniq -c

# Build validation
npm run build

# Vérifier RPC functions en base
psql $DATABASE_URL -c "
  SELECT proname, prosrc
  FROM pg_proc
  WHERE proname IN ('record_payment', 'get_treasury_stats')
"

# Vérifier valeurs customer_type
psql $DATABASE_URL -c "
  SELECT DISTINCT customer_type, COUNT(*)
  FROM organisations
  WHERE customer_type IS NOT NULL
  GROUP BY customer_type
"
```

---

## 📋 Prochaines Étapes Recommandées

### Étape 1 : Clarifications (30 min)

- Lire ce rapport complet
- Répondre aux 8 questions par priorité
- Valider stratégie corrections (Options A/B/C)

### Étape 2 : Vérifications Database (30 min)

- Exécuter commandes SQL fournies
- Vérifier RPC functions existantes
- Confirmer valeurs `customer_type` réelles
- Vérifier sémantique `is_active = NULL`

### Étape 3 : Préparation Techniques (30 min)

- Régénérer types Supabase depuis production
- Créer branch `fix/typescript-167-errors`
- Backup database si migrations prévues

### Étape 4 : Corrections Batch (18-25h sur 3 jours)

- Suivre séquence Jour 1 → Jour 2 → Jour 3
- Commit atomique par batch
- Tests MCP Browser AVANT chaque commit
- Rollback possible à chaque étape

---

**Fin du rapport d'analyse contextuelle** - Prêt pour corrections structurées

**Auteur** : Claude Code (Sonnet 4.5)
**Date** : 2025-10-28
**Durée analyse** : 2h15
**Fichiers analysés** : 80+ fichiers TypeScript/TSX
**Migrations consultées** : 15+ migrations Supabase
**Documentation lue** : project_overview, business_context, business-rules-organisations
