# Dev Plan — BO-UI-PROD-CHAR-001

**Date** : 2026-04-22
**Branche** : `feat/BO-UI-PROD-CHAR-001`
**Design cible** : `docs/scratchpad/stitch/stitch-caracteristiques-v3d-2026-04-22.png` (validé par Romeo)
**Règle absolue** : NE RIEN INVENTER. Tous les champs + règles héritage viennent de l'existant audité ci-dessous.

---

## 1. Contexte & décisions actées

| Décision                            | Choix retenu                                                                                                  | Justification                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Design cible                        | **v3d** (compact, 5 blocs cohérents)                                                                          | Romeo a choisi explicitement                           |
| Charte graphique                    | Onglets Général/Tarification déjà en prod (neutral-50, white cards, indigo/blue/amber accents, Inter, lucide) | Charte Verone existante                                |
| Édition                             | **Inline partout** (pattern `useInlineEdit` comme dans `IdentifiersEditSection`)                              | Demande explicite Romeo                                |
| Modal `ProductCharacteristicsModal` | **Supprimé**                                                                                                  | Remplacé 100 % par inline                              |
| `condition` (état produit)          | **Déplacé** de StockEditSection vers bloc Identification Caractéristiques                                     | Sémantiquement c'est une caractéristique, pas du stock |
| `brand` / `gtin`                    | **Ajoutés** dans bloc Identification Caractéristiques                                                         | Zéro duplication (absents des onglets détail actuels)  |
| Bloc Emballage & Expédition         | Placeholder amber "Bientôt" (mockup)                                                                          | Demande Romeo pour plus tard                           |
| Bloc Règles d'héritage              | Card info 2 colonnes HÉRITÉS / SPÉCIFIQUES                                                                    | Design v3d                                             |
| Tests Playwright                    | Déférés au sprint `BO-UI-PROD-E2E-001`                                                                        | Handoff global                                         |

---

## 2. Audit exhaustif de l'existant (source de vérité)

### 2.1 Fichiers composants actuels (à remplacer ou réutiliser)

| Fichier                                                                                                    | Status                                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/.../_components/product-characteristics-tab.tsx`                                         | **Remplacer** par wrapper minimal vers nouveau dashboard                                                       |
| `packages/@verone/products/src/components/images/ProductFixedCharacteristics.tsx`                          | Déprécier progressivement (peut rester si utilisé ailleurs — vérifier)                                         |
| `packages/@verone/products/src/components/images/ProductVariantAttributesSection.tsx`                      | Logique réutilisable (labels + emojis), pas le rendu                                                           |
| `packages/@verone/products/src/components/images/ProductCompatibleRoomsSection.tsx`                        | Logique héritage réutilisable                                                                                  |
| `packages/@verone/products/src/components/images/ProductDimensionsSection.tsx`                             | Helper `extractDimensions` réutilisable                                                                        |
| `packages/@verone/products/src/components/images/product-fixed-characteristics-utils.ts`                   | **Garder** : `VARIANT_ATTRIBUTE_LABELS`, `formatStyle`, `getCompatibleRooms`, `ProductForCharacteristics` type |
| `packages/@verone/products/src/components/modals/ProductCharacteristicsModal.tsx`                          | **SUPPRIMER**                                                                                                  |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductVariantAttributesForm.tsx` | **SUPPRIMER**                                                                                                  |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductCustomAttributesForm.tsx`  | **SUPPRIMER**                                                                                                  |
| `packages/@verone/products/src/components/modals/index.ts`                                                 | Retirer export `ProductCharacteristicsModal`                                                                   |

### 2.2 Hooks/états à nettoyer (modal suppression)

| Emplacement                                                                                                   | Action                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/@verone/products/src/components/sections/ProductEditMode/hooks.ts` lignes 51-52, 97-98              | Retirer `showCharacteristicsModal` state + getter/setter                           |
| `packages/@verone/products/src/components/sections/ProductEditMode/ProductEditMode.tsx` lignes 29-30, 102-110 | Retirer `<ProductCharacteristicsModal>` et ses props                               |
| `apps/back-office/.../_components/hooks/use-product-detail.tsx`                                               | Retirer `showCharacteristicsModal` / `setShowCharacteristicsModal` des exports     |
| `apps/back-office/.../_components/ProductModals.tsx`                                                          | Retirer rendu du modal Caractéristiques                                            |
| `apps/back-office/.../page.tsx`                                                                               | Retirer `showCharacteristicsModal`, `setShowCharacteristicsModal` des destructures |

### 2.3 Champs DB utilisés (NE RIEN AJOUTER HORS CETTE LISTE)

**`products` (table)** :

- `variant_attributes` jsonb — clés observées en DB : `color` (215), `material` (214), `material_secondary` (111), `color_secondary` (105), `style` (1)
- `dimensions` jsonb — clés observées : `length_cm`, `length`, `width_cm`, `width`, `height_cm`, `height`, `depth_cm`, `depth`, `diameter_cm`, `diameter`
- `weight` numeric (kg)
- `brand` varchar (marque)
- `gtin` varchar (EAN-13)
- `condition` varchar (Neuf/Occasion/Reconditionné)
- `style` text (écrasé si `variant_group.style` existe — voir héritage)
- `suitable_rooms` text[] — valeurs observées : `salon`, `salle_a_manger`, `chambre`, `bureau`, `cuisine`, `salle_de_bain`, `hall_entree`, `couloir`, `dressing`
- `video_url` text
- `variant_group_id` uuid (pour chip Hérité)
- `variant_position` integer

**`variant_groups` (table)** :

- `dimensions_length`, `dimensions_width`, `dimensions_height`, `dimensions_unit`
- `common_dimensions` jsonb
- `common_weight` numeric
- `has_common_weight` boolean
- `has_common_supplier` boolean
- `has_common_cost_price` boolean
- `common_cost_price` numeric
- `common_eco_tax` numeric
- `style` text
- `suitable_rooms` text[]
- `variant_type` varchar
- `base_sku` varchar
- `auto_name_pattern` text
- `name` varchar
- `subcategory_id` uuid

**Règles héritage (à respecter strictement)** :

- Si `variant_group?.dimensions_*` défini → dimensions viennent du groupe, chip "🔒 Hérité du groupe"
- Si `variant_group?.common_weight` défini → poids vient du groupe, chip "🔒 Hérité"
- `variant_group.style` toujours hérité si `variant_group_id` (readonly)
- `variant_group.suitable_rooms` si défini → hérité (readonly) ; sinon `products.suitable_rooms` éditable ; sinon fallback auto via `getCompatibleRooms`
- Attributs variantes (`variant_attributes`) = SPÉCIFIQUES à chaque variante, TOUJOURS éditables (même si `variant_group_id`)

### 2.4 Hook d'édition inline existant

`packages/@verone/common/src/hooks/use-inline-edit.ts` — `useInlineEdit({ productId, onUpdate, onError })` expose :

- `isEditing(section)`, `isSaving(section)`, `getError(section)`, `getEditedData(section)`, `hasChanges(section)`
- `startEdit(section, initialData)`, `cancelEdit(section)`, `updateEditedData(section, patch)`, `saveChanges(section)`

Type `EditableSection` doit inclure `'characteristics_attributes'`, `'characteristics_dimensions'`, `'characteristics_identification'`. À vérifier/étendre dans le fichier du type.

---

## 3. Scope implémentation

### 3.1 Nouveaux fichiers à créer

**Dashboard + blocs** (sous `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/`) :

- `product-characteristics-dashboard.tsx` — orchestrateur, layout flex-col lg:flex-row gap-4 (rail gauche `GeneralRail` + body)
- `_characteristics-blocks/AttributesVariantesCard.tsx` — bloc 1 : table clé/valeur éditable inline, 5 attributs prédéfinis (color, material, finish, pattern, style) + "+ Ajouter attribut" pour custom
- `_characteristics-blocks/DimensionsWeightCard.tsx` — bloc 2 : 3D wireframe box + 4 inputs inline (L/W/H/Weight), chip "🔒 Hérité du groupe" si applicable
- `_characteristics-blocks/IdentificationCommerceCard.tsx` — bloc 3 : grid 4 cols avec brand / gtin / condition (segmented Neuf/Occasion/Reconditionné) / style (lock hérité) + Pièces compatibles chips multi + Vidéo URL avec preview
- `_characteristics-blocks/PackagingPlaceholderCard.tsx` — bloc 4 : mockup amber "Bientôt disponible" (dimensions colis, unités/carton, presets Standard/Fragile)
- `_characteristics-blocks/InheritanceRulesCard.tsx` — bloc 5 : 2 colonnes HÉRITÉS (Dims, Poids, Style, Pièces, Prix) / SPÉCIFIQUES (Attrs, ID, Vidéo) — tags dynamiques selon `has_common_*`

**Wrapper** :

- Modifier `product-characteristics-tab.tsx` en wrapper minimal :
  ```tsx
  export function ProductCharacteristicsTab(props) {
    return <ProductCharacteristicsDashboard {...props} />;
  }
  ```

### 3.2 Fichiers modifiés (cascade modal suppression + condition déplacement)

| Fichier                                                                                                    | Modification                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/back-office/.../page.tsx`                                                                            | Retirer `showCharacteristicsModal` / setter, retirer la prop `onOpenCharacteristicsModal` du render `<ProductCharacteristicsTab>`, ajouter `completionPercentage` + `onTabChange` + `onProductUpdate` |
| `apps/back-office/.../_components/hooks/use-product-detail.tsx`                                            | Retirer les 2 exports `showCharacteristicsModal` / `setShowCharacteristicsModal`                                                                                                                      |
| `apps/back-office/.../_components/ProductModals.tsx`                                                       | Retirer le render du modal Caractéristiques                                                                                                                                                           |
| `apps/back-office/.../_components/product-stock-tab.tsx`                                                   | **Retirer** `condition` du StockEditSection (ligne 54). Le champ `condition` est maintenant édité dans Caractéristiques. Laisser `min_stock` seul dans cette section.                                 |
| `packages/@verone/stock/.../StockEditSection.tsx`                                                          | Vérifier si `condition` est requis — si oui, **retirer le champ** (il vit dans Caractéristiques maintenant). Si le composant est utilisé ailleurs, garder-le mais optional.                           |
| `packages/@verone/products/src/components/modals/ProductCharacteristicsModal.tsx`                          | **SUPPRIMER** le fichier                                                                                                                                                                              |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductVariantAttributesForm.tsx` | **SUPPRIMER**                                                                                                                                                                                         |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductCustomAttributesForm.tsx`  | **SUPPRIMER**                                                                                                                                                                                         |
| `packages/@verone/products/src/components/modals/index.ts`                                                 | Retirer `export { ProductCharacteristicsModal }`                                                                                                                                                      |
| `packages/@verone/products/src/components/sections/ProductEditMode/hooks.ts`                               | Retirer state + export `showCharacteristicsModal`/`setShowCharacteristicsModal`                                                                                                                       |
| `packages/@verone/products/src/components/sections/ProductEditMode/ProductEditMode.tsx`                    | Retirer le rendu `<ProductCharacteristicsModal>` et son destructure                                                                                                                                   |
| `packages/@verone/products/src/components/sections/ProductEditMode/types.ts`                               | Retirer les types associés au modal                                                                                                                                                                   |

### 3.3 Hook à créer (optionnel, si agrégation utile)

Si certains champs nécessitent d'être fetch séparément (ex. variant_group détails complets, ou liste produits similaires pour contexte), créer `packages/@verone/products/src/hooks/use-product-characteristics-dashboard.ts`.

**Décision** : pas nécessaire à première vue — tout est dans `product` (déjà chargé par `useProductDetail`) et `product.variant_group` joint. Pas de nouveau hook.

---

## 4. Règles techniques (non négociables)

- Zéro `any`, zéro `as any`, zéro `eslint-disable` (sauf si déjà existant qu'on n'aggrave pas)
- `useCallback` avant `useEffect` deps
- `void` + `.catch()` sur promises event handlers
- Imports : `@verone/ui` (ButtonV2, Badge, Input, Label), `@verone/utils` (cn, formatPrice), `lucide-react` pour icônes
- `useInlineEdit` de `@verone/common/hooks` pour tous les blocs éditables
- Fichier < 400 lignes (sinon décomposer)
- Touch targets `h-11 w-11 md:h-9 md:w-9` sur mobile
- Colonnes masquables `hidden lg/xl:table-cell`
- Charte graphique : bg-neutral-50 page, white cards rounded-lg border-neutral-200, kickers text-[10px] uppercase tracking-wide text-neutral-500, chips text-[10px], indigo hero, blue-50 inherited, amber upcoming

## 5. Impact externe (à vérifier / communiquer)

- Si `StockEditSection` est utilisé ailleurs que `product-stock-tab.tsx`, la suppression de `condition` peut impacter — faire une modification compatible (prop optionnelle) ou grep pour confirmer
- Si `ProductFixedCharacteristics` reste utilisé ailleurs (autre page, listing, etc.), ne pas le supprimer — juste le laisser orphelin pour l'onglet détail. Vérifier avec grep.

## 6. Ordre d'exécution

1. Créer les 5 composants `_characteristics-blocks/*` avec logique réutilisée depuis les utils existants
2. Créer `product-characteristics-dashboard.tsx` orchestrateur
3. Transformer `product-characteristics-tab.tsx` en wrapper minimal
4. Ajuster `page.tsx` + `use-product-detail.tsx` + `ProductModals.tsx` (retrait modal)
5. Supprimer `ProductCharacteristicsModal.tsx` + sous-forms
6. Retirer exports modal dans `modals/index.ts`
7. Retirer state modal dans `ProductEditMode/hooks.ts` + `ProductEditMode.tsx` + `types.ts`
8. Retirer `condition` de `StockEditSection` dans `product-stock-tab.tsx` (après vérification impact)
9. Type-check `@verone/back-office` + `@verone/products` + `@verone/common` + `@verone/stock`
10. Lint `@verone/back-office` + packages
11. Commit en phases logiques (1 commit par étape ou groupe cohérent)

## 7. Points de vigilance

- **`ProductFixedCharacteristics`** est utilisé dans `ProductViewMode.tsx` (mode vue produit). Si ProductViewMode continue d'exister → garder le composant, il peut cohabiter. Sinon suppression.
- **`condition`** : vérifier le type `Product` dans `packages/@verone/stock` — si la prop est requise, la rendre optionnelle.
- **Auto-compute `suitable_rooms`** : `getCompatibleRooms` fait une inférence depuis `product.name`. Quand on passe en édition inline, l'utilisateur écrit explicitement les pièces — ne pas écraser si l'utilisateur a saisi, utiliser l'inférence seulement comme suggestion par défaut.
- **TypeScript `Database` types** : `brand`, `gtin`, `condition` doivent exister sur `Database['public']['Tables']['products']['Row']` — à confirmer avant édition inline.
- **Dépendance variant_group join** : le `Product` type dans types.ts inclut-il le join `variant_group` avec `has_common_*` ? Vérifier et étendre si besoin.

## 8. Livrables attendus dev-agent

- Branche `feat/BO-UI-PROD-CHAR-001` avec commits ordonnés
- `pnpm --filter @verone/back-office type-check` PASS
- `pnpm --filter @verone/products type-check` PASS
- `pnpm --filter @verone/common type-check` PASS
- `pnpm --filter @verone/stock type-check` PASS
- `pnpm --filter @verone/back-office lint` PASS (0 warning)
- Rapport `docs/scratchpad/dev-report-2026-04-22-BO-UI-PROD-CHAR-001.md` avec décisions techniques + fichiers touchés + points de vigilance rencontrés + questions ouvertes
- NE PAS push ni créer de PR — ops-agent le fera après review.
