# Dev Plan — BO-UI-PROD-IMG-001

**Date** : 2026-04-22
**Branche** : `feat/BO-UI-PROD-IMG-001`
**Design cible validé** : `docs/scratchpad/stitch/stitch-images-v2-2026-04-22.png`
**Règle absolue** : NE RIEN INVENTER. Réutiliser le hook `useProductImages` existant + les colonnes DB réelles de `product_images`.

---

## 1. Décisions actées

| Décision                  | Choix retenu                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Design cible              | **Stitch v2** validé                                                                                 |
| Charte graphique          | **Strictement identique** aux onglets Général / Tarification / Stock / Caractéristiques déjà en prod |
| Hook images               | **Réutiliser** `useProductImages` de `@verone/products` (upload/delete/setPrimary/list)              |
| Drag & drop réordonnement | **Différer Phase 2** si pas de lib DnD déjà présente (sprint séparé `BO-UI-PROD-IMG-002`)            |
| Modal viewer              | Réutiliser `ProductImageViewerModal` existant                                                        |
| Tests Playwright          | Déférés au sprint `BO-UI-PROD-E2E-001`                                                               |

---

## 2. Audit DB (source de vérité)

`product_images` (15 colonnes) :

- `id`, `product_id`, `storage_path`, `public_url`
- `display_order` (integer) — actuellement **non exploité** côté UI
- `is_primary` (boolean)
- `image_type` (enum USER-DEFINED) — `'primary' | 'gallery' | …`
- `alt_text` (text) — actuellement **non éditable inline**
- `width` (int), `height` (int) — actuellement **non affichés**
- `file_size` (bigint) — actuellement **non affiché**
- `format` (text) — actuellement **non affiché**
- `created_by` (uuid), `created_at`, `updated_at`

**Aucune migration nécessaire** — tous les champs du design Stitch v2 existent déjà.

---

## 3. Code existant à réutiliser

### Hook

- `useProductImages({ productId, autoFetch })` de `@verone/products`
  - State : `images`, `loading`, `uploading`, `hasImages`
  - Actions : `uploadImage(file, { isPrimary, imageType })`, `deleteImage(id)`, `setPrimaryImage(id)`
  - **À enrichir** : si le hook n'expose pas `updateAltText(id, alt)` et `reorderImages(ids[])`, on l'ajoute côté hook (pattern useInlineEdit ou mutation directe Supabase)

### Modal

- `ProductImageViewerModal` de `@verone/products` — lightbox avec navigation left/right

### Composant actuel (à refondre)

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/product-images-tab.tsx` (350 lignes) — wrapper minimal à la fin

---

## 4. Scope implémentation

### 4.1 Nouveaux fichiers `_images-blocks/`

- **`ImagesKpiStrip.tsx`** — 4 tuiles (count hero indigo / taille totale / formats dominants / optimisation)
- **`PrimaryImageCard.tsx`** — hero card grid 2 cols (image 320×320 gauche + panel métadonnées droite avec alt_text inline-edit)
- **`GalleryGrid.tsx`** — grid 4 cols avec thumbnails, hover actions, display_order badge, drag handles (Phase 1 : visuel seulement, drag fonctionnel Phase 2)
- **`UploadDropZone.tsx`** — zone dédiée drag & drop + bouton parcourir
- **`ImagesSeoRecommendations.tsx`** — card bleue avec checklist + suggestions d'optimisation

### 4.2 Orchestrateur

- `product-images-dashboard.tsx` — layout flex-col lg:flex-row avec `GeneralRail` + body grid 12 cols

### 4.3 Wrapper

- Remplacer `product-images-tab.tsx` par wrapper minimal qui rend `ProductImagesDashboard`

### 4.4 Hook à enrichir (si nécessaire)

Dans `@verone/products/hooks/use-product-images.ts` (chemin à vérifier), ajouter :

- `updateAltText(imageId: string, altText: string): Promise<void>` — UPDATE product_images SET alt_text = $1 WHERE id = $2
- Optionnellement `reorderImages(orderedIds: string[]): Promise<void>` (Phase 2)

### 4.5 Props ProductImagesTab alignées

Le tab doit recevoir les props standard des autres onglets :

```tsx
interface ProductImagesTabProps {
  product: Product;
  completionPercentage: number;
  productImages: ProductImage[]; // pour imageCount depuis page.tsx
  onOpenPhotosModal: () => void; // garder pour compat
  onTabChange: (tabId: string) => void;
}
```

### 4.6 Ajustement `page.tsx`

Le render `<ProductImagesTab>` doit recevoir `completionPercentage` + `onTabChange` (pattern identique à `<ProductStockTab>`).

---

## 5. Comportement des 5 blocs

### Bloc 1 — KPI strip (4 tuiles)

1. **NOMBRE D'IMAGES** (hero indigo) :
   - Value : `images.length`
   - Sub : `${primaryCount} principale · ${galleryCount} galerie`
   - Chip : green "OK" si > 0, red "Aucune image" si 0

2. **TAILLE TOTALE** :
   - Value : somme `file_size` formatée (KB/MB)
   - Sub : `moyenne ${avg} par image`

3. **FORMATS** :
   - Value : groupement par `format` (ex. "6 JPEG / 2 WebP")
   - Sub : détail formats

4. **OPTIMISATION** :
   - Chip green "OK" si toutes images < 500 KB ET dimensions >= 800×800
   - Chip red "À optimiser" sinon
   - Sub : critère passé / échoué

### Bloc 2 — Image principale (hero card)

- Grid 2 cols `lg:grid-cols-2 gap-4`
- **Col gauche** : image primary (`images.find(i => i.is_primary)`) dans un container 320×320 rounded-lg border-neutral-200 bg-neutral-50. Badge "Principale" top-2 left-2 avec icône Star yellow.
- **Col droite** : panel avec kickers + values + pencils inline :
  - ALT TEXT (SEO) → Input inline editable via `updateAltText`
  - DIMENSIONS → `${width} × ${height} px` (readonly)
  - FORMAT → chip JPEG/PNG/WebP (readonly)
  - POIDS → formatted file_size (readonly)
  - UPLOADÉ LE → `${created_at} · ${uploader name}` (jointure user_profiles)
  - DISPLAY ORDER → chip "1" (readonly)

Si aucune image primary → afficher placeholder "Aucune image principale définie" avec bouton "Choisir depuis la galerie".

### Bloc 3 — Galerie (grid 4 cols)

- Header : title + button "+ Ajouter" + chip grise "Drag & drop pour réorganiser" (grisé si drag pas implémenté)
- Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3`
- Pour chaque image non-primary :
  - Container aspect-square rounded-lg overflow-hidden
  - Drag handle `GripVertical` top-left (on hover, Phase 2 fonctionnel)
  - Display_order badge top-right coin
  - File_size overlay bottom "${size} KB"
  - Hover actions au centre (Eye / Star définir primary / Pencil alt / Trash)
- Dernière tuile = zone upload placeholder dashed avec icône Upload + "Ajouter"

### Bloc 4 — Upload drag & drop

- Card séparée dashed `border-2 border-neutral-300 rounded-lg py-10 px-6`
- Hover : `border-indigo-500 bg-indigo-50/30`
- Content :
  - Icon Upload 48px neutral-400
  - Text "Glissez vos images ici ou cliquez pour sélectionner"
  - Sub "JPEG, PNG, WebP · max 10 MB par fichier · upload multiple"
  - Bouton outline "Parcourir les fichiers"

### Bloc 5 — Recommandations SEO & Performance

- Card `bg-blue-50/30 border-blue-200`
- Header icon Lightbulb + "Recommandations SEO"
- **Col gauche** : checklist dynamique
  - ✓ green "Image principale définie" (si primary exists)
  - ✓ green / ✗ red "Toutes les images ont un alt text" (selon count missing)
  - ⚠ amber "${n} image(s) > 500 KB (ralentit le chargement)" (si applicable)
- **Col droite** : chips suggestions dynamiques
  - "Convertir en WebP pour réduire 30-50%" (si format != webp)
  - "Ajouter alt text descriptif aux ${n} images" (si missing)
  - "Optimiser les images > 500 KB" (si applicable)

---

## 6. Règles techniques (non négociables)

- Zéro `any`, zéro `as any`, zéro `eslint-disable`
- `useCallback` avant deps `useEffect`
- `void` + `.catch()` sur promises event handlers
- Imports : `@verone/ui`, `@verone/utils`, `@verone/common/hooks`, `@verone/products` (useProductImages, ProductImageViewerModal), `lucide-react`, `next/image`
- Fichier < 400 lignes
- Touch targets `h-11 w-11 md:h-8 md:w-8`
- Charte graphique identique aux autres onglets (tokens dev-plan STOCK-001 section 2)

---

## 7. Ordre d'exécution

1. Créer 5 composants `_images-blocks/*`
2. Créer `product-images-dashboard.tsx` orchestrateur
3. Remplacer `product-images-tab.tsx` par wrapper minimal
4. Ajuster `page.tsx` pour les props
5. Enrichir `useProductImages` avec `updateAltText` (si pas déjà présent)
6. Type-check 4 packages + lint 0 warning
7. Commit + dev-report

---

## 8. Livrables attendus

- Branche `feat/BO-UI-PROD-IMG-001` avec commits ordonnés
- `pnpm --filter @verone/back-office type-check` PASS
- `pnpm --filter @verone/products type-check` PASS
- `pnpm --filter @verone/back-office lint` PASS 0 warning
- Rapport `docs/scratchpad/dev-report-2026-04-22-BO-UI-PROD-IMG-001.md`
- **NE PAS push** — je m'en occupe après validation visuelle

## 9. Points de vigilance

- Le hook `useProductImages` existant gère déjà upload/delete/setPrimary — **ne pas dupliquer**
- `display_order` drag & drop = **Phase 2** (sprint séparé). Pour Phase 1 : juste afficher le `display_order` sans drag fonctionnel.
- Si `alt_text` update pas dans hook → l'ajouter proprement (pattern `useInlineEdit` ou mutation Supabase directe avec `invalidateQueries`)
- Jointure `user_profiles` via `created_by` dans le bloc hero : pattern 2-requêtes séparées (comme `useStockMovements` après fix de la FK)
