# Audit — Formulaire « Nouvelle variante » (`/produits/catalogue/variantes`)

Date : 2026-04-27
Auteur : agent (audit demandé par Romeo, aucune ligne de code modifiée)
Contexte : Romeo trouve le formulaire actuel obsolète. Veut auto-complétion via produit
matrice + arborescence famille/catégorie/sous-catégorie au lieu d'un combobox plat
qui n'affiche jamais les sous-catégories vides.

> Statut : **AUDIT seul.** Pas de branche, pas de patch. Plan d'implémentation à valider
> par Romeo avant ouverture branche.

---

## 1. Carte des fichiers concernés

### Page back-office

- `apps/back-office/src/app/(protected)/produits/catalogue/variantes/page.tsx` — bouton « Nouveau groupe » (l. 54-57) → `handleCreateGroup` → ouvre wizard
- `apps/back-office/src/app/(protected)/produits/catalogue/variantes/use-variantes-page.ts` — handler du CTA
- `apps/back-office/src/app/(protected)/produits/catalogue/variantes/VariantesModals.tsx` (l. 39-50) — monte `VariantGroupCreationWizard` quand `editingGroup === null`

### Wizard (3 étapes) — package partagé

- `packages/@verone/products/src/components/wizards/VariantGroupCreationWizard.tsx` — orchestrateur
- `…/wizards/variant-group-creation/WizardStep1Basic.tsx` — **étape 1, sujet de l'audit** (Nom + SKU base + sous-catégorie)
- `…/wizards/variant-group-creation/WizardStep2Style.tsx`
- `…/wizards/variant-group-creation/WizardStep3Supplier.tsx`

### Page détail produit (cible future « créer variante depuis ce produit »)

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/page.tsx`
- `…/[productId]/_components/product-detail-header.tsx` — actions de header (back + share aujourd'hui)

---

## 2. Schéma DB pertinent (vérifié dans `docs/current/database/schema/02-produits.md`)

### `products`

| Colonne            | Type    | Null | Note                                        |
| ------------------ | ------- | ---- | ------------------------------------------- |
| `id`               | uuid    | NO   | PK                                          |
| `sku`              | varchar | NO   | SKU complet du produit (ex. `VAS-ELE-001`)  |
| `name`             | varchar | NO   | Nom du produit                              |
| `subcategory_id`   | uuid    | YES  | FK → `subcategories.id`                     |
| `variant_group_id` | uuid    | YES  | FK → `variant_groups.id` (si déjà rattaché) |

> **Important : `products.base_sku` n'existe pas.** Le `base_sku` n'est porté que par
> `variant_groups`. Donc auto-complétion → cf. §5.

### `variant_groups`

| Colonne          | Type    | Null | Note                    |
| ---------------- | ------- | ---- | ----------------------- |
| `id`             | uuid    | NO   | PK                      |
| `name`           | varchar | NO   |                         |
| `base_sku`       | varchar | NO   | Préfixe (ex. `VAS-ELE`) |
| `subcategory_id` | uuid    | NO   | FK → `subcategories.id` |

### `families` → `categories` → `subcategories`

Hiérarchie 3 niveaux, FK `category_id → categories.id`, `family_id → families.id`.
Tous ont `id`, `name`, `slug`, `display_order`, `is_active`.

---

## 3. Diagnostic des problèmes signalés par Romeo

### 🔴 P1 — « Les sous-catégories ne s'affichent pas »

**Cause** : `WizardStep1Basic` utilise `CategoryFilterCombobox` (de
`@verone/categories/components/filters/`). Ce composant est un **filtre** :
sa query (l. 111-131 du composant) lit `from('variant_groups').select(...subcategories!inner...).is('archived_at', null).not('subcategory_id', 'is', null)`.
Il ne renvoie donc que les sous-catégories **déjà utilisées** par au moins un
variant_group existant.

**Conséquence** :

- Premier groupe créé sur une sous-catégorie X → la sous-catégorie n'apparaît jamais
  dans le combobox tant qu'aucun groupe n'y existe → poule/œuf, blocage à la création.
- C'est conçu pour la barre de filtre de la liste, pas pour un formulaire de création.
- Le composant est utilisé à mauvais escient ici.

**Mauvais usage confirmé dans le commentaire en tête du composant** : « Filtre
hiérarchique de catégories avec recherche […] **Usage : Variantes, Collections, Produits** »
(en tant que filtre de page, pas formulaire).

### 🟠 P2 — « Pouvoir sélectionner un produit témoin pour auto-compléter »

Aucun champ « produit matrice » n'existe en étape 1. Romeo doit saisir
manuellement `name`, `base_sku`, `subcategory_id` — alors que ces 3 valeurs
existent toutes pour un produit déjà créé qu'il veut « dupliquer en groupe ».

### 🟢 P3 — « Créer une variante depuis la page détail produit »

Demande différée par Romeo (« on fera plus tard »). Hors scope de l'implémentation
courante. Hook d'extension prévu §6.

---

## 4. Composants réutilisables existants (audit complet)

### ✅ `CategoryHierarchySelector` (à utiliser pour P1)

- Path : `packages/@verone/categories/src/components/selectors/CategoryHierarchySelector.tsx`
- Props :
  ```ts
  {
    value?: string;
    onChange: (
      subcategoryId: string | null,
      hierarchyInfo?: {
        family_id: string;
        category_id: string;
        subcategory_id: string;
        hierarchy_name: string;
      }
    ) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    required?: boolean;
  }
  ```
- Source : hooks `useFamilies()`, `useCategories()`, `useSubcategories()` →
  charge **toute** l'arborescence (pas filtré par entités), donc 100 % des
  sous-catégories actives apparaissent.
- Valeur d'entrée acceptée : un `subcategory_id` (la même que celle stockée
  par `WizardStep1Basic`) → drop-in compatible.
- Export :
  ```ts
  // packages/@verone/categories/src/components/selectors/index.ts
  export * from './CategoryHierarchySelector';
  ```

### ✅ `UniversalProductSelectorV2` (à utiliser pour P2)

- Path : `packages/@verone/products/src/components/selectors/UniversalProductSelectorV2/index.tsx`
- Props (extrait l. 51-67) :
  ```ts
  {
    open: boolean;
    onClose: () => void;
    onSelect: (products: SelectedProduct[]) => void;
    mode?: 'single' | 'multi';            // défaut 'multi' — on utilisera 'single'
    context?: 'collections' | 'variant_groups' | 'consultations';
    title?: string;
    description?: string;
    excludeProductIds?: string[];
    showQuantity?: boolean;               // false ici
    showPricing?: boolean;                // false ici
    showImages?: boolean;
    searchDebounce?: number;
    supplierId?: string;
  }
  ```
- Mode single confirmé l. 55, 133 : `if (mode === 'single') { … }`.
- Déjà utilisé pour ajouter des produits à un groupe variantes existant (modal
  `VariantAddProductModal`) → cohérence visuelle/UX assurée.

### ⚠️ Composants présents mais NON adaptés ici

- `CategoryFilterCombobox` (filtre, dépend des entités existantes — voir P1)
- `CategoryTreeFilter` (multi-select avec checkboxes, pour filtres de listes, pas un sélecteur unique)
- `ProductSelector` (utilise un RPC `get_consultation_eligible_products` — scope consultations seulement)
- `CategorySelector` (sélection d'une catégorie sans famille/sous-catégorie — niveau intermédiaire seul)
- `SubcategorySearchSelector` (à examiner si on veut une option « light » sans famille — pas la demande de Romeo)

---

## 5. Logique d'auto-complétion proposée (à valider)

Quand l'utilisateur sélectionne un produit témoin via `UniversalProductSelectorV2` :

| Champ wizard     | Source produit                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`           | `product.name` tel quel — modifiable                                                                                                                                                             |
| `base_sku`       | **Dériver** : si `product.variant_group_id` non nul → lire `variant_groups.base_sku`. Sinon prendre `product.sku` jusqu'au dernier séparateur (`VAS-ELE-001` → `VAS-ELE`). Champ reste éditable. |
| `subcategory_id` | `product.subcategory_id` — passe directement à `CategoryHierarchySelector`                                                                                                                       |

Edge cases à traiter dans le plan :

- Produit sans `subcategory_id` → laisser vide, l'arborescence s'ouvre normalement.
- `product.sku` sans séparateur (`VAS001`) → fallback : valeur brute, Romeo modifie.
- Produit déjà dans un groupe (`variant_group_id ≠ null`) → afficher un avertissement
  inline « Ce produit appartient déjà au groupe X » (lecture seule, pas de blocage,
  c'est le sens de « produit témoin ».)

---

## 6. Plan d'implémentation proposé (pas exécuté)

> À valider par Romeo. Aucune branche créée.

### Sprint 1 — Refonte étape 1

**Branche** (à créer après accord) : `fix/BO-VAR-FORM-001-step1-product-matrix`  
Tag commit : `[BO-VAR-FORM-001]`

1. `WizardStep1Basic.tsx` :
   - Remplacer `CategoryFilterCombobox` par `CategoryHierarchySelector`.
   - Ajouter en haut un nouveau bloc **« Produit témoin (optionnel) »** : un
     `Button` outline qui ouvre `UniversalProductSelectorV2` (`mode: 'single'`,
     `context: 'variant_groups'`, `showQuantity: false`, `showPricing: false`).
   - Sur sélection, dériver `name` / `base_sku` / `subcategory_id` (cf. §5) et
     `onUpdate({…})`.
   - Conserver les 3 champs éditables (Romeo doit pouvoir corriger).
2. `VariantGroupCreationWizard.tsx` :
   - Ajouter dans `FormData` un champ optionnel `matrix_product_id` (uniquement
     pour traçabilité UI / reset, **pas envoyé** au backend — `CreateVariantGroupData`
     ne le porte pas).
   - `resetForm()` : remettre à `''`.
   - Aucun changement à `canProceedFromStep1` (déjà sur les 3 champs requis).
3. Aucune migration SQL. Aucune modif de hooks. Aucun changement de
   `CreateVariantGroupData` côté `@verone/types`.

### Sprint 2 — (différé par Romeo) « Créer variante depuis page produit »

À faire plus tard. Pré-câblage minimal possible : exporter une prop
`initialMatrixProductId?: string` sur `VariantGroupCreationWizard` pour
qu'on puisse l'ouvrir depuis `ProductDetailHeader` avec un produit
pré-sélectionné. Ne pas l'implémenter dans le sprint 1 pour rester focus.

### Validation

- Type-check : `pnpm --filter @verone/products type-check && pnpm --filter @verone/back-office type-check`
- Test manuel MCP Playwright (lane-1) sur `/produits/catalogue/variantes` :
  - Cliquer « Nouveau groupe »
  - Cliquer « Sélectionner un produit témoin », choisir un produit existant
  - Vérifier auto-complétion des 3 champs
  - Vérifier que `CategoryHierarchySelector` montre toutes les sous-catégories
    (y compris des sous-catégories où aucun groupe n'existe encore)
  - Modifier les 3 champs, valider étape 1, naviguer 2/3, créer le groupe
  - Confirmer redirection vers `/produits/catalogue/variantes/[groupId]`
- Test mobile 375 px (responsive) sur le modal — déjà fait pour le wizard,
  vérifier que le nouveau bloc « Produit témoin » respecte le pattern.

### Risques identifiés

- 🟢 Aucun risque DB (pas de migration, pas de trigger touché).
- 🟠 `CategoryHierarchySelector` charge **3** queries Supabase au montage
  (`useFamilies` / `useCategories` / `useSubcategories`). Vérifier qu'aucun
  hook n'a déjà été monté ailleurs sur la page — sinon dédup avec TanStack
  Query (cf. `.claude/rules/data-fetching.md`).
- 🟠 `UniversalProductSelectorV2` charge la liste produits — `searchDebounce`
  par défaut, OK ; vérifier qu'on passe `mode: 'single'` (sinon UI multi-checkboxes).
- 🟠 Dérivation `base_sku` : la règle « tout sauf le dernier `-NNN` » n'est pas
  formelle. Proposer en revue d'utiliser un simple `split('-').slice(0, -1).join('-')`
  avec fallback sur `product.sku` complet si moins de 2 segments.

---

## 7. Conformité aux règles Verone

- ✅ `code-standards.md` : aucun `any`, on étend `FormData` de manière typée.
- ✅ `data-fetching.md` : on réutilise les hooks existants, pas de nouveau
  `useEffect` à risque.
- ✅ `responsive.md` : modal déjà responsive — bloc ajouté en haut, sans
  tableau, donc pas de changement de pattern.
- ✅ `branch-strategy.md` : nouvelle branche dédiée à la refonte (sujet
  totalement différent de la PR ouverte `fix/BO-CONSULT-FIX-002`).
- ✅ Pas de modif de routes API, ni de triggers stock, ni de fichier `.claude/`.
- ✅ Tout dans `packages/@verone/` (pas de formulaire dans `apps/`).

---

## 8. Ce qui reste à clarifier avec Romeo

1. **Heuristique `base_sku`** : OK avec « strip du dernier segment numérique » ou
   préférer toujours `product.sku` complet et laisser Romeo raccourcir manuellement ?
2. **« Produit témoin » optionnel ou obligatoire** ? Audit suggère **optionnel**
   (rétrocompatibilité avec le flux actuel + cas d'usage « pas de produit existant »).
3. **Avertissement « produit déjà dans un groupe »** : juste informatif ou on
   bloque la sélection ? Audit suggère informatif.
4. Sprint 2 (page détail produit) : confirmer l'ordre — ce sera un nouveau
   ticket à part `[BO-VAR-FORM-002]`.

---

Fin de l'audit. En attente du go Romeo pour ouvrir la branche
`fix/BO-VAR-FORM-001-step1-product-matrix` et déléguer l'implémentation au
`dev-agent`.
