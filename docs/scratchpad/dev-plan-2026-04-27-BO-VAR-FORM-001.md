# Dev Plan — [BO-VAR-FORM-001] Refonte étape 1 wizard Nouvelle variante

Date : 2026-04-27
Branche : `fix/BO-VAR-FORM-001-step1-product-matrix` (depuis `staging` à jour, post `[BO-PERF-001]`)
Tag commit : `[BO-VAR-FORM-001]`
Scope : sprint 1 (refonte étape 1 du wizard). Sprint 2 « créer depuis page détail produit » → ticket séparé `[BO-VAR-FORM-002]`, plus tard.

## Référence audit

Rapport complet : `docs/scratchpad/audit-2026-04-27-variant-group-creation-form.md`

## Décisions Romeo

| #   | Décision                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | `base_sku` auto-complété en cascade : (a) si `product.variant_group_id` non nul → `variant_groups.base_sku` du groupe parent ; (b) sinon `product.sku.split('-').slice(0, -1).join('-')` ; (c) fallback `product.sku` complet si moins de 2 segments. Toujours éditable. |
| Q2  | « Produit témoin » **optionnel**. Bloc en haut de l'étape 1 avec libellé `Produit témoin (optionnel) — pré-remplit Nom, SKU et sous-catégorie`.                                                                                                                          |
| Q3  | **Bloquer** la sélection si `product.variant_group_id` non nul. Règle absolue : **1 produit = 1 variante max**. Pas de doublon dans le même groupe non plus (déjà géré côté ajout de produits, à vérifier).                                                              |

## Fichiers cibles (limites strictes)

1. `packages/@verone/products/src/components/wizards/variant-group-creation/WizardStep1Basic.tsx`
2. `packages/@verone/products/src/components/wizards/VariantGroupCreationWizard.tsx`

Aucun autre fichier ne doit être touché. Pas de migration. Pas de modif de hooks. Pas de modif de `@verone/types` (`CreateVariantGroupData` reste identique — `matrix_product_id` est local au formulaire, jamais envoyé au backend).

## Composants à réutiliser (déjà en stock)

### `CategoryHierarchySelector` — remplace `CategoryFilterCombobox`

Path : `packages/@verone/categories/src/components/selectors/CategoryHierarchySelector.tsx`

```tsx
import { CategoryHierarchySelector } from '@verone/categories/components/selectors/CategoryHierarchySelector';

<CategoryHierarchySelector
  value={subcategoryId}
  onChange={(subcategoryId, hierarchyInfo) => {
    onUpdate({ subcategory_id: subcategoryId ?? '' });
  }}
  placeholder="Sélectionner une sous-catégorie"
  required
/>;
```

### `UniversalProductSelectorV2` — sélecteur produit témoin

Path : `packages/@verone/products/src/components/selectors/UniversalProductSelectorV2/index.tsx`

```tsx
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';

<UniversalProductSelectorV2
  open={pickerOpen}
  onClose={() => setPickerOpen(false)}
  mode="single"
  context="variant_groups"
  showQuantity={false}
  showPricing={false}
  title="Sélectionner un produit témoin"
  description="Le produit choisi servira à pré-remplir Nom, SKU et sous-catégorie."
  onSelect={(products) => {
    const product = products[0];
    if (!product) return;
    if (product.variant_group_id) {
      toast.error('Ce produit appartient déjà au groupe variantes "X". Un produit ne peut être que dans une seule variante.');
      return;
    }
    // dériver name / base_sku / subcategory_id (cf. Q1)
    onUpdate({ ... });
  }}
/>
```

> **Vérifier** côté `UniversalProductSelectorV2` : si `SelectedProduct` n'expose pas `variant_group_id` directement, il faut soit étendre la projection du selector, soit refetch le produit complet via `useProducts` après `onSelect` pour valider. Préférer la lecture déjà chargée si possible.

## Modifications attendues

### `WizardStep1Basic.tsx`

1. Ajouter en haut **avant** « Nom du groupe » un bloc :
   - Bouton outline « Sélectionner un produit témoin » (ouvre `UniversalProductSelectorV2`)
   - Si déjà sélectionné : afficher carte « Produit témoin : _[nom]_ — _[sku]_ » + bouton « Changer » + bouton « Retirer »
   - Aide inline : « Optionnel — pré-remplit Nom, SKU et sous-catégorie. Modifiable ensuite. »
2. Remplacer l'import et l'usage de `CategoryFilterCombobox` par `CategoryHierarchySelector`.
3. Étendre la signature `WizardStep1BasicProps` :
   ```ts
   interface WizardStep1BasicProps {
     name: string;
     baseSku: string;
     subcategoryId: string;
     matrixProduct: { id: string; name: string; sku: string } | null;  // nouveau
     onUpdate: (updates: Record<string, unknown>) => void;
     onMatrixProductChange: (product: { id, name, sku, variant_group_id, subcategory_id, ... } | null) => void;  // nouveau
   }
   ```
4. Helper local `deriveBaseSku(product, parentGroupBaseSku?)` typé strictement, sans `any`.

### `VariantGroupCreationWizard.tsx`

1. Étendre `FormData` avec `matrix_product: { id, name, sku } | null` (purement local, jamais envoyé).
2. Initialiser à `null` dans `useState` et `resetForm`.
3. Handler `handleMatrixProductSelect(product)` :
   - Si `product.variant_group_id` non nul → `toast.error` + ne PAS auto-remplir
   - Sinon : fetch parent base_sku si besoin, dériver `base_sku`, et `setFormData` avec `name`, `base_sku`, `subcategory_id`, `matrix_product`
4. Passer `matrix_product` et `handleMatrixProductSelect` à `WizardStep1Basic`.
5. Pas de modification à `canProceedFromStep1` (toujours sur les 3 champs requis ; le produit témoin reste optionnel).
6. Pas de modification au payload `CreateVariantGroupData` envoyé à `createVariantGroup`.

### Helper `deriveBaseSku`

```ts
function deriveBaseSku(
  productSku: string,
  parentGroupBaseSku?: string | null
): string {
  if (parentGroupBaseSku) return parentGroupBaseSku;
  const segments = productSku.split('-');
  if (segments.length >= 2) return segments.slice(0, -1).join('-');
  return productSku;
}
```

## Contraintes (rappels rules)

- Zéro `any`. Tout typé via `Database`/types existants. Importer types depuis `@verone/types` si besoin.
- `void` + `.catch()` sur toute promesse event handler.
- Pas de `useEffect` instable — utiliser `useCallback` si fonction passée en dep (cf. `.claude/rules/data-fetching.md`).
- Pas de `select('*')` (n'est pas concerné ici puisqu'on n'écrit pas de query).
- Modal déjà responsive — vérifier que le nouveau bloc passe en 375 px sans débordement.
- Aucun fichier > 400 lignes après modif (vérifier `WizardStep1Basic` et le wizard parent).

## Validation attendue

```bash
pnpm --filter @verone/products type-check
pnpm --filter @verone/back-office type-check
pnpm --filter @verone/back-office build
pnpm --filter @verone/back-office lint
```

Tests manuels MCP Playwright (lane-1) :

1. Login `veronebyromeo@gmail.com` / `Abc123456`
2. Naviguer `/produits/catalogue/variantes`
3. Cliquer « Nouveau groupe »
4. **Cas 1 — sans produit témoin** : remplir manuellement les 3 champs, naviguer 2 et 3, créer → groupe créé, redirection OK.
5. **Cas 2 — avec produit témoin libre** : sélectionner un produit avec `variant_group_id IS NULL` → vérifier que `name`, `base_sku`, `subcategory_id` se pré-remplissent. `CategoryHierarchySelector` affiche bien la sous-catégorie hérité dans son arborescence. Modifier les 3, créer → OK.
6. **Cas 3 — produit déjà dans un groupe** : sélectionner un produit avec `variant_group_id != null` → toast d'erreur explicite + aucun champ modifié + sélection rejetée.
7. **Cas 4 — `CategoryHierarchySelector`** : ouvrir l'arborescence et vérifier qu'on voit toutes les sous-catégories actives (y compris celles sans variant_group existant — c'était le bug initial).
8. Tester sur 375 px (responsive).

Capturer screenshots dans `.playwright-mcp/screenshots/20260427/`.

## Critères d'acceptation

- [ ] Le bug « sous-catégories vides invisibles » est résolu (toute sous-catégorie active sélectionnable).
- [ ] Le sélecteur produit témoin est optionnel et auto-complète les 3 champs.
- [ ] La sélection d'un produit déjà dans un groupe est bloquée avec toast explicite.
- [ ] Type-check + build + lint verts.
- [ ] Tous les cas Playwright 1-4 passent.
- [ ] 0 régression sur les flux existants (création groupe sans produit témoin = comportement actuel).
- [ ] Aucun `any`, aucun `select('*')`, aucun `useEffect` instable introduit.
- [ ] Aucun fichier ne dépasse 400 lignes.
- [ ] Dev-report créé dans `docs/scratchpad/dev-report-2026-04-27-BO-VAR-FORM-001.md`.

## Ce qui est HORS scope

- Bouton « Créer une variante depuis ce produit » sur page détail produit → sprint 2 (`[BO-VAR-FORM-002]`).
- Optimisation des 3 queries Supabase chargées par `useFamilies/useCategories/useSubcategories` → ticket séparé si problème de perf.
- Refonte étapes 2 et 3 du wizard.

## NE RIEN CASSER — règle absolue Romeo

La logique d'héritage des propriétés communes du groupe variantes vers ses produits est CRITIQUE et NE DOIT PAS être touchée. Elle vit dans :

- **Côté variant_group** (étape 3 du wizard, intacte) : `has_common_supplier`, `supplier_id`, `common_weight`, `dimensions_length/width/height/unit`, `style`, `suitable_rooms`. Ces flags pilotent quels champs sont lockés sur chaque produit du groupe.
- **Côté page détail produit** : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_characteristics-blocks/InheritanceRulesCard.tsx` lit `product.variant_group` + flags pour afficher les chips « hérité » vs « spécifique ».
- **Côté édition produit** : `EditProductVariantModal.tsx`, `SupplierEditSection.tsx`, `WeightEditSection.tsx`, `ProductFixedCharacteristics.tsx`, `ProductDimensionsSection.tsx` désactivent les inputs si la propriété est héritée du groupe.

Pourquoi mon scope ne casse pas ça :

- Je touche **uniquement** l'étape 1 (name + base_sku + subcategory_id). Aucun de ces 3 champs n'est une propriété héritée.
- Je ne modifie ni `WizardStep3Supplier.tsx`, ni `WizardStep2Style.tsx`, ni `CreateVariantGroupData` (`@verone/types`), ni les hooks d'update produit, ni `InheritanceRulesCard`.
- Le payload envoyé à `createVariantGroup()` reste strictement identique en signature et sémantique.

Vérifications post-implémentation OBLIGATOIRES (avant push) :

- [ ] `git diff --stat origin/staging` : seuls 2 fichiers TypeScript modifiés (les 2 cibles), plus le scratchpad.
- [ ] Aucun fichier de la liste « héritage » modifié (grep diff sur `InheritanceRulesCard|EditProductVariantModal|SupplierEditSection|WeightEditSection|WizardStep2Style|WizardStep3Supplier|VariantGroupEditModal|VariantGroupCommonPropsSection|use-variant-group-crud|variant-group-form\.`).
- [ ] Test manuel Playwright cas 5 (régression héritage) : créer un groupe avec « fournisseur commun » activé en étape 3, ajouter un produit, ouvrir la page détail produit du membre → vérifier que `InheritanceRulesCard` affiche bien les chips « hérité » et que le champ fournisseur est lock dans `EditProductVariantModal`.
- [ ] Test manuel Playwright cas 6 : créer un groupe avec dimensions communes en étape 2 → vérifier que les dimensions sont lockées sur les produits membres en édition.
