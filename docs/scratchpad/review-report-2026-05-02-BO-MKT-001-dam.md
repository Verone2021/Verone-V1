# Review Report — 2026-05-02 BO-MKT-001 DAM Phase 1

**Branche** : `feat/BO-MKT-001-dam-bibliotheque`
**PR** : #884 (draft)
**Reviewer** : Claude Sonnet 4.6 (reviewer-agent)

---

## Verdict : FAIL

3 blockers identifiés. Promote ready impossible tant que CI drift est rouge et injection PostgREST non corrigée.

---

### Axe 1 — Migration SQL

- SECURITY DEFINER absent des fonctions mirror : CONFORME (commit `5d07e22a` a bien retiré le flag).
- RLS `staff_full_access_media_assets` : USING + WITH CHECK présents, `is_backoffice_user()` correct.
- `ON CONFLICT (source_product_image_id) DO NOTHING` : présent dans le trigger INSERT et le seed.
- Trigger UPDATE : clause `WHEN (OLD.* IS DISTINCT FROM NEW.*)` remplacée par une liste de colonnes explicites — plus précis, CONFORME.
- CASCADE DELETE via FK : CONFORME.
- Aucune modification de `product_images` (schéma, RLS, triggers existants) : CONFORME.
- Advisory Supabase : aucune alerte sur `media_assets`.

### Axe 2 — Hook `use-media-assets.ts`

- Select explicite via `MEDIA_ASSET_SELECT_COLS` : CONFORME.
- Flag `loaded` boolean (pas `array.length === N`) : CONFORME.
- `useCallback` sur toutes les fonctions exposées : CONFORME.
- Pagination via `.range()` : CONFORME.
- `createClient()` retourne un singleton global (stable) — fonctionnellement correct.

### Axe 3 — Composants MediaLibrary

- `ResponsiveToolbar` utilisé dans `MediaLibraryToolbar` : CONFORME.
- `CloudflareImage` utilisé dans `MediaAssetCard` et `MediaAssetDetailModal` : CONFORME.
- Touch targets 44px mobile (`min-h-[44px] md:min-h-[36px]`) : CONFORME sur tous les boutons.
- Pas de `w-auto` sur conteneur large : CONFORME.
- Modals avec scroll interne `h-screen flex flex-col` + `overflow-y-auto` : CONFORME.
- `AlertDialog` de confirmation avant archivage : CONFORME.
- Validation brand obligatoire (`brandIds.length > 0`) dans UploadAssetModal : CONFORME.

### Axe 4 — Page et Sidebar

- Pas de logique métier dans la page (fetch brands uniquement) : CONFORME.
- `select('id, slug, name, brand_color')` sur brands : CONFORME (pas de select star).
- Import `Image` de `lucide-react` (pas de `next/image`) : CONFORME.
- Entrée sidebar `/marketing/bibliotheque` avec icône `Image` : CONFORME.

### Axe 5 — Types Supabase et lockfile

- `packages/@verone/types/src/supabase.ts` contient `media_assets` : CONFORME.
- `pnpm-lock.yaml` mis à jour : CONFORME.
- **MAIS** : schema `graphql_public` absent des types régénérés (comportement MCP connu) → check CI `Supabase TS types drift (blocking)` en FAILURE.

---

## Blockers (à fixer avant promote ready)

- [BLOCKER] `packages/@verone/types/src/supabase.ts` — CI `Supabase TS types drift (blocking)` en FAILURE. Le schema `graphql_public` a été retiré des types lors de la régénération MCP (comportement connu, voir `branch-strategy.md` Q4). Fix : télécharger l'artifact `supabase-types-drift` du run #25251319930 et utiliser `supabase.ts.generated` pour remplacer le fichier courant, puis commit + push.

- [BLOCKER] `packages/@verone/products/src/hooks/use-media-assets.ts:128-130` — Injection PostgREST via interpolation de chaîne dans `.or()`. La valeur `escaped` n'est que `.trim()` — un utilisateur peut injecter `,id.neq.some-uuid` ou d'autres filtres PostgREST. Fix : utiliser l'overload Supabase avec filtre séparé plutôt qu'interpolation libre :

  ```ts
  query = query
    .or(`alt_text.ilike.%${escaped}%`)
    .or(`notes.ilike.%${escaped}%`);
  ```

  Note : `.or()` de Supabase JS encode les paramètres via le SDK — les appels chaînés sont plus sûrs. Alternative : regex-escape les caractères PostgREST spéciaux (`%`, `,`, `.`, `(`, `)`) avant interpolation.

- [BLOCKER] `packages/@verone/products/src/hooks/use-media-assets.ts` — Fichier 428 lignes, dépasse la limite absolue de 400 lignes (`code-standards.md` : "Fichier > 400 lignes = refactoring obligatoire"). Fix : extraire les mutations (`uploadAsset`, `uploadMultiple`, `updateAssetMetadata`, `archiveAsset`, `unarchiveAsset`) dans un hook séparé `use-media-asset-mutations.ts` (~120 lignes). Le hook principal garde fetch + filtres (~280 lignes).

---

## Notes (Phase 2)

- [NOTE] `packages/@verone/marketing/src/components/MediaLibrary/MediaAssetDetailModal.tsx:372 lignes` et `UploadAssetModal.tsx:373 lignes` — les deux composants dépassent la limite de 200 lignes pour un composant React. Pas bloquant pour cette PR (le diff est trop important pour extraire proprement maintenant), mais à découper en Phase 2 (sous-composants form édition séparés).

- [NOTE] `packages/@verone/products/src/hooks/use-media-assets.ts:279` — `refetch` est exclu des deps de `uploadAsset` (eslint-disable). En cas de changement de filtre pendant un upload long, le refetch post-upload utilisera la closure stale. Fonctionnellement acceptable en Phase 1 car les uploads sont courts, mais à stabiliser en Phase 2 via un `useRef` sur `fetchAssets`.

- [NOTE] `packages/@verone/marketing/src/components/MediaLibrary/UploadAssetModal.tsx:64-70` — cleanup `URL.revokeObjectURL` avec `entries` exclu des deps. Si des entrées sont ajoutées après le dernier render avant fermeture, leurs previews ne seront pas révoqués (fuite mémoire mineure). Acceptable Phase 1.

---

## Résumé des vérifications

| Zone                                           | Statut |
| ---------------------------------------------- | ------ |
| Migration SQL (SECURITY DEFINER absent)        | PASS   |
| RLS media_assets (USING + WITH CHECK)          | PASS   |
| Triggers mirror (INSERT + UPDATE WHEN clause)  | PASS   |
| CASCADE DELETE FK                              | PASS   |
| Pas de touche à product_images                 | PASS   |
| Hook select explicite                          | PASS   |
| Hook flag `loaded` (pas length === N)          | PASS   |
| Hook pagination range()                        | PASS   |
| Hook injection PostgREST search                | FAIL   |
| Hook > 400 lignes                              | FAIL   |
| Composants ResponsiveToolbar + CloudflareImage | PASS   |
| Modals scroll interne mobile                   | PASS   |
| Touch targets 44px                             | PASS   |
| AlertDialog avant archivage                    | PASS   |
| Validation brand obligatoire upload            | PASS   |
| Page sans logique métier                       | PASS   |
| Sidebar Image import lucide                    | PASS   |
| Types Supabase media_assets présents           | PASS   |
| CI Supabase TS types drift                     | FAIL   |
| pnpm-lock.yaml mis à jour                      | PASS   |
