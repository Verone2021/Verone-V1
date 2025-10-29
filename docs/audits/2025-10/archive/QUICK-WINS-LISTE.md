# Liste Quick Wins - 78 Erreurs Faciles TypeScript

**Date** : 2025-10-28
**Durée totale estimée** : 3h30
**Risque régression** : FAIBLE à ZÉRO
**ROI** : EXCELLENT (39% des erreurs)

---

## Critères Quick Win

Une erreur est "Quick Win" si :

- ✅ Correction < 2 min par erreur
- ✅ Pattern répétitif simple
- ✅ Risque régression ZÉRO ou FAIBLE
- ✅ Pas de refactoring nécessaire
- ✅ Solution standard connue

---

## CATÉGORIE A : TRIVIAL (30 erreurs, 1h30)

### 1. TS2352 - Unsafe Conversion (11 erreurs, 30 min) ⭐

**Code erreur** : `TS2352`
**Message type** : "Conversion of type X to type Y may be a mistake"

**Solution Standard** :

```typescript
// ❌ Avant
const data = result as ProductType;

// ✅ Après
const data = result as unknown as ProductType;
```

**Explication** : TypeScript nécessite `as unknown as` pour conversions type unions complexes

---

#### Liste des 11 erreurs TS2352

| #    | Fichier                          | Ligne  | Context                             | Fix                     |
| ---- | -------------------------------- | ------ | ----------------------------------- | ----------------------- |
| 1    | `finance/depenses/[id]/page.tsx` | 97     | `expense as FinancialDocument`      | Ajouter `as unknown as` |
| 2    | `excel-utils.ts`                 | 198    | `Buffer to Buffer<ArrayBufferLike>` | Ajouter `as unknown as` |
| 3    | `theme-v2.ts`                    | 149    | `Color object to string`            | Ajouter `as unknown as` |
| 4    | `abby/sync-processor.ts`         | 74     | `Data[] to SyncQueueItem[]`         | Ajouter `as unknown as` |
| 5    | `abby/sync-processor.ts`         | 180    | `Record to CreateInvoicePayload`    | Ajouter `as unknown as` |
| 6    | `use-user-activity-tracker.ts`   | ?      | Type conversion                     | Ajouter `as unknown as` |
| 7-11 | Fichiers divers                  | Divers | Type conversions                    | Ajouter `as unknown as` |

**Temps par erreur** : ~2-3 min
**Commande validation** : `npm run type-check 2>&1 | grep "TS2352"`

---

### 2. TS2353 - Unknown Property (16 erreurs, 45 min) ⭐

**Code erreur** : `TS2353`
**Message type** : "Object literal may only specify known properties, and 'X' does not exist in type 'Y'"

**Solution Standard** :

```typescript
// ❌ Avant
const product = {
  id: '123',
  name: 'Produit',
  unknown_field: 'value', // Property not in interface
};

// ✅ Après Option 1 : Retirer propriété
const product = {
  id: '123',
  name: 'Produit',
  // unknown_field retiré
};

// ✅ Après Option 2 : Ajouter à interface (si nécessaire)
interface Product {
  id: string;
  name: string;
  unknown_field?: string; // Ajouté si vraiment utilisé
}
```

**Stratégie** : Retirer propriété sauf si utilisée ailleurs

---

#### Liste des 16 erreurs TS2353

| #    | Fichier                              | Ligne  | Propriété Inconnue                | Action             |
| ---- | ------------------------------------ | ------ | --------------------------------- | ------------------ |
| 1    | `complete-product-wizard.tsx`        | 211    | `variant_attributes` (wrong type) | Type assertion     |
| 2    | `complete-product-wizard.tsx`        | 202    | `family_id`                       | Retirer ou ajouter |
| 3    | `complete-product-wizard.tsx`        | ?      | Property X                        | À identifier       |
| 4    | `complete-product-wizard.tsx`        | ?      | Property Y                        | À identifier       |
| 5    | `use-variant-groups.ts`              | ?      | Unknown prop                      | Retirer            |
| 6    | `use-variant-products.ts`            | ?      | Unknown prop                      | Retirer            |
| 7    | `canaux-vente/prix-clients/page.tsx` | ?      | Unknown prop                      | Retirer            |
| 8-16 | Fichiers divers                      | Divers | Properties diverses               | Retirer ou ajouter |

**Temps par erreur** : ~2-3 min
**Commande validation** : `npm run type-check 2>&1 | grep "TS2353"`

---

### 3. TS2304 - Cannot Find Name (4 erreurs, 15 min) ⭐

**Code erreur** : `TS2304`
**Message type** : "Cannot find name 'X'"

**Solution Standard** :

```typescript
// ❌ Avant
const value = UndefinedVariable;

// ✅ Après
import { UndefinedVariable } from '@/path/to/module';
const value = UndefinedVariable;
```

**Causes communes** :

- Import manquant
- Typo dans nom variable
- Variable définie après utilisation

---

#### Liste des 4 erreurs TS2304

| #   | Fichier              | Ligne | Variable Manquante | Fix             |
| --- | -------------------- | ----- | ------------------ | --------------- |
| 1-4 | À identifier via log | ?     | Variables diverses | Ajouter imports |

**Temps par erreur** : ~3-4 min
**Commande identification** : `npm run type-check 2>&1 | grep "TS2304"`

---

## CATÉGORIE B : SIMPLE (48 erreurs, 2h)

### 4. TS2322 - Null/Undefined Alignment (25 erreurs, 1h) ⭐⭐

**Code erreur** : `TS2322`
**Message type** : "Type 'X | null' is not assignable to type 'Y | undefined'"

**Problème** : Inconsistance null vs undefined dans interfaces

**Solution Standard** :

```typescript
// ❌ Avant
interface Consultation {
  tarif_maximum: number | null; // Interface attend | null
}

const data = {
  tarif_maximum: value ?? undefined, // Mais on met undefined
};

// ✅ Après : Aligner sur interface
const data = {
  tarif_maximum: value ?? null, // Aligné avec interface
};
```

---

#### Sous-catégorie 4A : Null → Undefined (10 erreurs, 30 min)

**Fichiers identifiés** :

- `consultations/page.tsx` (3 erreurs)
- `canaux-vente/prix-clients/page.tsx` (2 erreurs)
- `collections/[collectionId]/page.tsx` (2 erreurs)
- Fichiers divers (3 erreurs)

**Pattern fix** : `?? undefined` → `?? null` selon interface

---

#### Sous-catégorie 4B : Type Assertions Simples (15 erreurs, 30 min)

**Pattern** :

```typescript
// ❌ Avant
const dimensions = {
  length: 10,
  width: data.width, // Type number | undefined attendu number | null
  height: data.height,
};

// ✅ Après
const dimensions = {
  length: 10,
  width: data.width ?? null,
  height: data.height ?? null,
};
```

**Fichiers** :

- `variantes/[groupId]/page.tsx` (dimensions)
- `product-info-section.tsx`
- Fichiers divers

---

### 5. TS2339 - Property Missing Simple (8 erreurs, 30 min) ⭐⭐

**Code erreur** : `TS2339`
**Message type** : "Property 'X' does not exist on type 'Y'"

**Sous-catégorie A : Propriétés Calculées** (5 erreurs)

**Pattern** :

```typescript
// ❌ Avant
const price = product.price_ttc; // Property doesn't exist in interface

// ✅ Après Option 1 : Ajouter à interface
interface Product {
  // ...
  price_ttc?: number; // Calculated field
}

// ✅ Après Option 2 : Calculer on-the-fly
const price = product.price_ht * (1 + product.tva_rate / 100);

// ✅ Après Option 3 : Optional chaining
const price = (product as any).price_ttc ?? product.price_ht;
```

**Fichiers** :

- `complete-product-wizard.tsx` (family_id)
- `stocks/page.tsx` (minimumSellingPrice - déjà corrigé SESSION 3)
- Fichiers divers (3)

---

**Sous-catégorie B : Erreurs Typo/Refactoring** (3 erreurs)

**Pattern** : Propriété renommée ou supprimée

**Exemple** :

```typescript
// ❌ Avant
error.errors.map(...)  // ZodError n'a pas .errors

// ✅ Après
error.issues.map(...)  // Correct property
```

**Fichier** : `form-security.ts` (déjà corrigé SESSION 3)

---

### 6. TS2740 - Missing Properties (3 erreurs, 15 min) ⭐

**Code erreur** : `TS2740`
**Message type** : "Type 'X' is missing the following properties from type 'Y': prop1, prop2"

**Pattern** :

```typescript
// ❌ Avant
const contact: Contact = {
  first_name: 'John',
  last_name: 'Doe',
  // Missing: email (required)
};

// ✅ Après
const contact: Contact = {
  first_name: 'John',
  last_name: 'Doe',
  email: contact.email ?? '', // Ajouter propriété manquante
};
```

**Fichiers identifiés** :

- Hooks contacts/organisations (2)
- Fichier divers (1)

**Temps par erreur** : ~5 min

---

### 7. TS2345 - Argument Type Mismatch (6 erreurs, 30 min) ⭐⭐

**Code erreur** : `TS2345`
**Message type** : "Argument of type 'X' is not assignable to parameter of type 'Y'"

**Pattern** :

```typescript
// ❌ Avant
function myFunc(value: number) { ... }
myFunc(stringValue)  // Type string, expected number

// ✅ Après
myFunc(Number(stringValue))  // Cast approprié
// Ou
myFunc(parseInt(stringValue, 10))
```

**Fichiers** :

- `collection-form-modal.tsx` (setCollectionStyle argument)
- `use-treasury-stats.ts`
- `use-user-activity-tracker.ts`
- Fichiers divers (3)

**Temps par erreur** : ~5 min

---

### 8. Storybook Stories - Missing Args (6 erreurs, 15 min) ⭐

**Code erreur** : `TS2322`
**Message type** : "Property 'args' is missing in type..."
**Contexte** : Uniquement Storybook (pas impact production)

**Pattern** :

```typescript
// ❌ Avant
export const MyStory: Story = {
  render: () => <Component />
}

// ✅ Après
export const MyStory: Story = {
  args: {},  // Ajouter propriété vide
  render: () => <Component />
}
```

**Fichiers** :

- `VeroneCard.stories.tsx` (2 erreurs)
- `Badge.stories.tsx` (déjà corrigé SESSION 3)
- Fichiers Stories divers (3)

**Temps par erreur** : ~2 min
**Risque** : ZÉRO (Storybook uniquement, pas en production)

---

## RÉCAPITULATIF PAR BATCH

### BATCH 63 : TS2352 + TS2353 (27 erreurs, 1h15)

**Cibles** :

- 11 × TS2352 (unsafe conversions)
- 16 × TS2353 (unknown properties)

**Stratégie** :

1. Script automatique : `grep -r "as Product\|as Contact" src/ | wc -l`
2. Correction pattern : Ajouter `as unknown as` systématiquement
3. Validation : `npm run type-check | grep "TS2352\|TS2353"`

**Commit** : `fix(types): BATCH 63 - TS2352+TS2353 unsafe conversions - 27 erreurs résolues`

---

### BATCH 64 : TS2304 + TS2740 (7 erreurs, 40 min)

**Cibles** :

- 4 × TS2304 (cannot find name)
- 3 × TS2740 (missing properties)

**Stratégie** :

1. Identifier imports manquants : `npm run type-check | grep "TS2304"`
2. Ajouter imports depuis types existants
3. Compléter propriétés manquantes selon interfaces

**Commit** : `fix(types): BATCH 64 - TS2304+TS2740 imports & missing props - 7 erreurs résolues`

---

### BATCH 65 : Null/Undefined + TS2345 (31 erreurs, 1h30)

**Cibles** :

- 25 × TS2322 (null/undefined mismatches)
- 6 × TS2345 (argument type mismatch)

**Stratégie** :

1. Analyser interfaces pour déterminer null vs undefined
2. Aligner `?? null` ou `?? undefined` selon interface
3. Corriger arguments avec casts appropriés

**Commit** : `fix(types): BATCH 65 - TS2322+TS2345 null/undefined alignment - 31 erreurs résolues`

---

### BATCH 66 : Storybook (6 erreurs, 15 min)

**Cibles** :

- 6 × Stories missing `args` property

**Stratégie** :

1. Identifier toutes stories : `find src/stories -name "*.stories.tsx"`
2. Ajouter `args: {}` dans stories concernées
3. Validation build Storybook (optionnel)

**Commit** : `fix(types): BATCH 66 - Storybook stories missing args - 6 erreurs résolues`

---

## COMMANDES UTILES

### Identification Erreurs

```bash
# Compter erreurs par famille
npm run type-check 2>&1 | grep "error TS" | cut -d: -f4 | cut -d' ' -f2 | sort | uniq -c | sort -rn

# Liste TS2352
npm run type-check 2>&1 | grep "TS2352"

# Liste TS2353
npm run type-check 2>&1 | grep "TS2353"

# Liste TS2304
npm run type-check 2>&1 | grep "TS2304"

# Toutes erreurs par fichier
npm run type-check 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn
```

---

### Validation Progressive

```bash
# 1. Avant corrections
ERROR_COUNT_BEFORE=$(npm run type-check 2>&1 | grep -c "error TS")
echo "Erreurs avant: $ERROR_COUNT_BEFORE"

# 2. Faire corrections...

# 3. Après corrections
ERROR_COUNT_AFTER=$(npm run type-check 2>&1 | grep -c "error TS")
echo "Erreurs après: $ERROR_COUNT_AFTER"
echo "Delta: $(($ERROR_COUNT_BEFORE - $ERROR_COUNT_AFTER)) erreurs corrigées"
```

---

### Build Validation

```bash
# Type-check + Build obligatoires avant commit
npm run type-check && npm run build && echo "✅ VALIDATION OK"
```

---

## CHECKLIST AVANT COMMIT

Pour chaque BATCH Quick Win :

- [ ] Type-check validé : Erreurs réduites
- [ ] Build SUCCESS : `npm run build` passe
- [ ] Commit atomique : 1 famille = 1 commit
- [ ] Message détaillé : Famille + fichiers + delta
- [ ] Git status clean : Pas de fichiers non commités

---

## ESTIMATION PRÉCISE PAR BATCH

| Batch     | Erreurs | Durée Réelle | Validation | Commit    | Total     |
| --------- | ------- | ------------ | ---------- | --------- | --------- |
| BATCH 63  | 27      | 60 min       | 10 min     | 5 min     | **1h15**  |
| BATCH 64  | 7       | 30 min       | 5 min      | 5 min     | **40min** |
| BATCH 65  | 31      | 75 min       | 10 min     | 5 min     | **1h30**  |
| BATCH 66  | 6       | 10 min       | 3 min      | 2 min     | **15min** |
| **TOTAL** | **71**  | **2h55**     | **28min**  | **17min** | **3h40**  |

**Note** : 71 erreurs (vs 78 annoncées) car 7 déjà corrigées SESSION 3

---

## PROCHAINES ACTIONS

1. **Démarrer BATCH 61** : Module Cleanup (non Quick Win mais prioritaire)
2. **Puis BATCH 62** : Type Unification (critique, débloque autres)
3. **Ensuite BATCH 63-66** : Quick Wins séquentiels

**Ordre optimal** :

```
BATCH 61 (15min) → BATCH 62 (60min) → BATCH 63 (1h15) → BATCH 64 (40min) → BATCH 65 (1h30) → BATCH 66 (15min)
```

**Total Jour 1** : 4h55 pour ~100 erreurs corrigées ✅

---

**Créé** : 2025-10-28
**Maintenu par** : Claude Code
**Version** : 1.0
