# [BO-MKT-001] DAM Phase 1 — Bibliothèque centralisée d'images

**Date** : 2026-05-02
**Branche** : `feat/BO-MKT-001-dam-bibliotheque`
**Coordinateur** : Claude Opus 4.7

---

## 1. Contexte

Romeo veut une **bibliothèque centrale d'images** dans le back-office. Aujourd'hui :

- 460 photos sur Cloudflare, attachées à 187 produits sur 232.
- Une seule table : `product_images` (1:1 avec un produit, `image_type ∈ {primary, gallery}`).
- Aucun classement par marque sur les photos. La table `brands` existe mais `products.brand_ids` est vide pour les 232 produits.
- 100+ fichiers consomment `product_images` (apps + packages).

L'objectif est d'apporter une vraie bibliothèque (page dédiée, classement par marque, types variés, recherche) **sans casser l'existant**.

---

## 2. Décisions architecturales locked

### Décision 1 — `media_assets` est une NOUVELLE table en parallèle de `product_images`

Pas de remplacement. `product_images` reste la source de vérité pour les images de produits. `media_assets` est la table centrale du DAM, alimentée :

- Au démarrage : par recopie one-shot des 460 `product_images`
- En continu : par triggers `AFTER INSERT/UPDATE/DELETE` sur `product_images`
- Aussi : par upload direct depuis la page Bibliothèque (assets sans produit, ex: logos, ambiances)

### Décision 2 — Lien faible vers `product_images` via `source_product_image_id`

Chaque `media_assets` peut avoir un `source_product_image_id` qui pointe vers la ligne `product_images` originale (si dérivé). Cascade DELETE pour cohérence.

Pour les uploads "libres" depuis la bibliothèque : `source_product_image_id IS NULL`.

### Décision 3 — `brand_ids` sur les assets, INDÉPENDANT de `products.brand_ids`

`media_assets.brand_ids uuid[]` permet de classer un asset par marque même si le produit lié n'a pas de brand_ids (cas actuel, tous les produits ont brand_ids = []).

Pour les assets dérivés de `product_images` lors du seed initial : `brand_ids = []` (vide). Romeo backfillera via la page Bibliothèque ou en attribuant les marques aux produits dans une session ultérieure.

### Décision 4 — Pas de modification de `product_images` ni de la fiche produit Phase 1

La fiche produit (`/produits/catalogue/[productId]`) reste **inchangée**. Les 100+ consommateurs de `product_images` ne sont pas touchés. Romeo continue d'ajouter/retirer des photos depuis la fiche produit ; les triggers maintiennent `media_assets` en sync.

La rewire bidirectionnelle (depuis la bibliothèque, lier une photo à un produit) est **Phase 2**, séparée.

### Décision 5 — Page bibliothèque sous `/marketing/bibliotheque`

Cohérent avec la page existante `/marketing/prompts` (BO-MKT-002). Sidebar item ajouté sous "Marketing".

### Décision 6 — Upload depuis la bibliothèque utilise `smartUploadImage` existant

Pas de nouvelle route API. Réutilise `packages/@verone/utils/src/upload/smart-upload.ts` (Cloudflare avec fallback Supabase Storage).

### Décision 7 — Types d'assets via colonne enum text

`media_assets.asset_type text NOT NULL DEFAULT 'product'` avec valeurs autorisées dans une CHECK constraint :

- `product` (photo packshot d'un produit, dérivée d'un product_image)
- `lifestyle` (photo en situation, ambiance produit)
- `packshot` (photo studio détourée)
- `logo` (logo de marque)
- `ambiance` (photo d'ambiance générale, sans produit)
- `other`

Le seed des 460 product_images les met tous à `product`.

---

## 3. Schéma DB de cette PR

```sql
-- ============================================================
-- Migration [BO-MKT-001] DAM Phase 1 — Bibliothèque média centrale
-- Périmètre : media_assets (table) + triggers de sync depuis product_images
-- HORS PÉRIMÈTRE : modification de product_images, fiche produit, prompt builder
-- ============================================================

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudflare_image_id text,
  storage_path text,
  public_url text,
  filename text,
  alt_text text,
  width integer,
  height integer,
  file_size bigint,
  format text,
  asset_type text NOT NULL DEFAULT 'product'
    CHECK (asset_type IN ('product','lifestyle','packshot','logo','ambiance','other')),
  brand_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text,
  source_product_image_id uuid REFERENCES product_images(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX uq_media_assets_source_product_image_id
  ON media_assets(source_product_image_id)
  WHERE source_product_image_id IS NOT NULL;
CREATE INDEX idx_media_assets_cloudflare_image_id ON media_assets(cloudflare_image_id);
CREATE INDEX idx_media_assets_brand_ids ON media_assets USING gin(brand_ids);
CREATE INDEX idx_media_assets_asset_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_tags ON media_assets USING gin(tags);
CREATE INDEX idx_media_assets_archived_at ON media_assets(archived_at) WHERE archived_at IS NULL;

-- RLS : staff full access. Pas d'accès anon (la bibliothèque est interne).
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_media_assets" ON media_assets
  FOR ALL TO authenticated USING (is_backoffice_user());

-- Trigger updated_at
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger : mirror product_images INSERT vers media_assets
CREATE OR REPLACE FUNCTION mirror_product_image_to_media_asset()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO media_assets (
    cloudflare_image_id, storage_path, public_url, alt_text,
    width, height, file_size, format, asset_type, brand_ids,
    source_product_image_id, created_by, created_at, updated_at
  )
  SELECT
    NEW.cloudflare_image_id, NEW.storage_path, NEW.public_url, NEW.alt_text,
    NEW.width, NEW.height, NEW.file_size, NEW.format,
    'product',
    COALESCE(p.brand_ids, ARRAY[]::uuid[]),
    NEW.id, NEW.created_by, NEW.created_at, NEW.updated_at
  FROM products p
  WHERE p.id = NEW.product_id
  ON CONFLICT (source_product_image_id) WHERE source_product_image_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mirror_product_image_insert
  AFTER INSERT ON product_images
  FOR EACH ROW EXECUTE FUNCTION mirror_product_image_to_media_asset();

-- Trigger : mirror product_images UPDATE
CREATE OR REPLACE FUNCTION mirror_product_image_update_to_media_asset()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE media_assets SET
    cloudflare_image_id = NEW.cloudflare_image_id,
    storage_path = NEW.storage_path,
    public_url = NEW.public_url,
    alt_text = NEW.alt_text,
    width = NEW.width, height = NEW.height,
    file_size = NEW.file_size, format = NEW.format,
    updated_at = NEW.updated_at
  WHERE source_product_image_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mirror_product_image_update
  AFTER UPDATE ON product_images
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION mirror_product_image_update_to_media_asset();

-- (DELETE est géré par ON DELETE CASCADE de la FK source_product_image_id)

-- Seed : copie one-shot des 460 product_images existants
INSERT INTO media_assets (
  cloudflare_image_id, storage_path, public_url, alt_text,
  width, height, file_size, format, asset_type, brand_ids,
  source_product_image_id, created_by, created_at, updated_at
)
SELECT
  pi.cloudflare_image_id, pi.storage_path, pi.public_url, pi.alt_text,
  pi.width, pi.height, pi.file_size, pi.format,
  'product',
  COALESCE(p.brand_ids, ARRAY[]::uuid[]),
  pi.id, pi.created_by, pi.created_at, pi.updated_at
FROM product_images pi
JOIN products p ON p.id = pi.product_id
ON CONFLICT (source_product_image_id) WHERE source_product_image_id IS NOT NULL DO NOTHING;

-- Vérification post-seed (informationnel, pas un fail si écart)
-- SELECT COUNT(*) FROM media_assets WHERE source_product_image_id IS NOT NULL; -- attendu : 460
```

---

## 4. Code à livrer

### A. Hooks dans `packages/@verone/products/src/hooks/`

NOUVEAU `use-media-assets.ts` :

- `useMediaAssets({ brandId?, assetType?, search?, archived? })` — fetch + filtres
- `useMediaAssetMutation()` — create (upload), update (metadata), archive
- Réutilise `smartUploadImage` pour l'upload
- Pattern TanStack Query avec `queryKey: ['media_assets', filters]`, `staleTime: 30_000`
- `await queryClient.invalidateQueries()` dans `onSuccess` (cf. `code-standards.md`)
- Select explicite (pas de `select('*')`)

### B. Page `/marketing/bibliotheque` dans `apps/back-office/`

Fichier : `apps/back-office/src/app/(protected)/marketing/bibliotheque/page.tsx`

Layout :

- `<ResponsiveToolbar>` :
  - Titre : "Bibliothèque"
  - Sous-titre : "Toutes les photos du groupe Vérone, classées par marque"
  - Recherche : input texte (alt_text + filename)
  - Filtres : Select marque (4 marques + "Toutes" + "Sans marque"), Select type (6 types + "Tous")
  - Action primaire : Bouton "Ajouter des photos" → ouvre `<UploadAssetModal>`
- Grille principale (responsive grid 2/3/4/6 cols) avec :
  - Card par asset : `<CloudflareImage>` (variant thumbnail), badges marques (chip couleur), badge asset_type
  - Click card → ouvre `<MediaAssetDetailModal>`
- Pagination : 50 assets / page, bouton "Charger plus"
- État vide : "Aucune photo ne correspond à ces filtres"
- État chargement : skeleton de 12 cards

### C. Composants

- `apps/back-office/src/app/(protected)/marketing/bibliotheque/_components/UploadAssetModal.tsx`
  - Multi-files drag & drop (réutilise pattern `UploadDropZone` existant si applicable)
  - Pour chaque fichier : champ `asset_type` (Select), `brand_ids` (multi-select), `alt_text` (input), `tags` (chips)
  - Upload séquentiel via `smartUploadImage` puis insert dans `media_assets`
- `apps/back-office/src/app/(protected)/marketing/bibliotheque/_components/MediaAssetDetailModal.tsx`
  - Affichage grand format (variant `public`)
  - Métadonnées éditables : alt_text, brand_ids (multi-select), asset_type, tags, notes
  - Si `source_product_image_id` non null : badge "Lié au produit X" + bouton "Voir le produit"
  - Bouton "Archiver" (soft delete via archived_at = now())
- `apps/back-office/src/app/(protected)/marketing/bibliotheque/_components/MediaAssetCard.tsx`
  - Card individuelle de la grille
  - Hover : overlay avec actions rapides (édition métadonnées inline si désiré, ou redirection modal)

### D. Sidebar nav

Ajouter une entrée sous "Marketing" :

```ts
{
  label: 'Bibliothèque',
  href: '/marketing/bibliotheque',
  icon: 'image' (ou Lucide ImageIcon)
}
```

Fichier : `apps/back-office/src/components/layout/app-sidebar/sidebar-nav-items.ts` (ou équivalent — à grep).

### E. Régénération types Supabase

**OBLIGATOIRE** dans la même PR (cf. `.claude/rules/branch-strategy.md` Q4) :

```bash
mcp__supabase__generate_typescript_types
```

Mettre à jour `packages/@verone/types/src/supabase.ts` (et fichiers dérivés `dist/`, `apps/back-office/src/types/supabase.d.ts`).

### F. Documentation DB

```bash
python3 scripts/generate-docs.py --db
```

Mettre à jour `docs/current/database/schema/02-produits.md` ou `09-autres.md` avec la nouvelle table.

---

## 5. Hors scope Phase 1 (NE PAS implémenter ici)

- ❌ Modification de `product_images`, fiche produit, hook `useProductImages`
- ❌ Bidirectionnel : depuis la bibliothèque, lier un asset à un produit (Phase 2)
- ❌ Sélecteur "Picker depuis la bibliothèque" sur la fiche produit (Phase 2)
- ❌ Connexion bibliothèque ↔ générateur de prompts (Phase 3)
- ❌ Caractéristiques produit pour pré-remplir prompt (Phase 3)
- ❌ Backfill `products.brand_ids` (sprint séparé)
- ❌ Workflow d'approbation (Phase 4)

---

## 6. Acceptance criteria

- [ ] Migration SQL appliquée sans erreur via `mcp__supabase__execute_sql`
- [ ] Vérification post-seed : `SELECT COUNT(*) FROM media_assets WHERE source_product_image_id IS NOT NULL` = 460
- [ ] Triggers actifs : insert/update/delete sur `product_images` reflète sur `media_assets`
- [ ] Régénération types Supabase committée dans la même PR
- [ ] Page `/marketing/bibliotheque` accessible depuis sidebar
- [ ] Filtres marque + type + recherche fonctionnels
- [ ] Upload de nouveaux assets depuis la modal fonctionne (Cloudflare upload + insert media_assets)
- [ ] Édition métadonnées d'un asset depuis la modal détail
- [ ] Archivage d'un asset (soft delete)
- [ ] Aucune régression sur la fiche produit `/produits/catalogue/[id]` (les 100+ consommateurs de product_images doivent fonctionner inchangés)
- [ ] `pnpm --filter @verone/back-office type-check` vert
- [ ] `pnpm --filter @verone/back-office build` vert
- [ ] reviewer-agent verdict PASS

---

## 7. Découpage en commits (1 PR)

Branche : `feat/BO-MKT-001-dam-bibliotheque` (déjà créée)

1. `[BO-MKT-001] feat(db): add media_assets table + triggers from product_images + seed`
2. `[BO-MKT-001] chore: regenerate Supabase types after media_assets migration`
3. `[BO-MKT-001] feat(hooks): add useMediaAssets hook in @verone/products`
4. `[BO-MKT-001] feat(ui): add /marketing/bibliotheque page + grid + filters`
5. `[BO-MKT-001] feat(ui): add UploadAssetModal + MediaAssetDetailModal`
6. `[BO-MKT-001] feat(nav): add Marketing > Bibliothèque sidebar item`
7. `[BO-MKT-001] docs: regenerate DB schema docs after migration`

PR draft poussée dès le commit 2 pour visibilité, promote ready après reviewer-agent PASS.

---

## 8. Pièges identifiés (lecture obligatoire dev-agent)

- ⚠️ Ne JAMAIS toucher à `product_images` (schéma, RLS, triggers existants : `product_images_generate_url`, `product_images_single_primary`, `trg_update_product_has_images`, `trigger_recalculate_completion_images`).
- ⚠️ Le trigger mirror INSERT doit gérer le cas `cloudflare_image_id IS NULL` (fallback Supabase Storage encore possible).
- ⚠️ La policy RLS de `media_assets` n'autorise PAS anon (la bibliothèque est strictement back-office). Public lit toujours via `product_images.public_read_product_images` qui reste intacte.
- ⚠️ Lors de l'upload d'un asset libre (sans produit), `brand_ids` peut rester `[]` mais c'est un mauvais UX → forcer dans la modal au moins 1 brand sélectionnée.
- ⚠️ `brand_color` est NULL pour les 4 marques en DB. Pour le badge couleur dans les cards : fallback sur palette par défaut hard-codée par slug (ex: verone=orange, boemia=violet, solar=jaune, flos=vert).
- ⚠️ La marque est seedée avec slug `boemia` (et non `bohemia`). Utiliser les UUIDs depuis la table, pas les slugs en dur.
- ⚠️ Régénération TypeScript types **obligatoire dans la même PR** sinon le check CI `Supabase TS types drift (blocking)` fail au release main (incident 2026-04-28 PR #826).
- ⚠️ JAMAIS `select('*')` Supabase — colonnes explicites uniquement (cf. `data-fetching.md`).
- ⚠️ Wrappers `useCallback` pour les fonctions passées aux deps de `useEffect` (cf. `code-standards.md`).
- ⚠️ Mobile-first responsive : 5 techniques obligatoires (cf. `responsive.md`). Page `/marketing/bibliotheque` est admin → desktop suffit selon exception 2026-05-02, mais grille reste responsive de base (375 → 1920).
- ⚠️ Touch targets 44px sur mobile.

---

## 9. Phase 2 (sprint suivant, NE PAS faire ici)

Pour mémoire (à briefer plus tard) :

- Sélecteur "Choisir dans la bibliothèque" sur la fiche produit images.
- Lien N:N media_assets → products via table `media_asset_links` (ou ajout colonne `product_ids uuid[]` sur media_assets).
- Mise à jour bidirectionnelle quand on attache/détache un asset à un produit (insert/delete dans product_images via trigger).

## 10. Phase 3 (sprint suivant, NE PAS faire ici)

- Connexion `/marketing/prompts` à la bibliothèque : sélecteur de produit avec autocomplete sur `products`, récupération auto de `brand_ids` du produit choisi, pré-remplissage des caractéristiques produit dans le textarea description.
- Empêcher les croisements illégitimes (ex: produit Flos sélectionné → seul preset Flos disponible).
