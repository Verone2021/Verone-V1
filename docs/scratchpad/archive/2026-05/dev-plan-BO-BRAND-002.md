# [BO-BRAND-002] Table `brands` + UI multi-marques — Plan de découpage

**Date** : 2026-05-01
**Branche** : `feat/BO-BRAND-002-internal-brands`
**Worktree** : `/Users/romeodossantos/verone-bo-brand-002`
**Statut** : 🚧 Plan en cours, en attente du GO de Romeo et du merge de PR #867 avant code DB.

---

## Contexte

2e étape des fondations multi-marques (après BO-BRAND-001 mergé). Création de la table `brands` + colonne `products.brand_ids[]` + UI BrandSwitcher header + page de gestion + multi-select sur fiche produit.

Brief : `docs/scratchpad/brief-BO-MKT-001-phase1-dam.md` (renommé mentalement BO-BRAND-002).

---

## Audit factuel (effectué avant écriture du plan)

### DB — état actuel

- `brands` n'existe pas ✅ (à créer)
- `enseignes` existe (concept B2B partenaires, orthogonal aux brands)
- `user_profiles` existe (~17 colonnes, pas de `active_brand_id`)
- Rappel : BO-BRAND-001 a déjà renommé `products.brand` → `products.manufacturer`

### Code — état actuel

- Aucune occurrence existante de `BrandSwitcher`, `useActiveBrand`, ou `active_brand_id` ✅
- Header global : `apps/back-office/src/components/layout/app-header.tsx` (où injecter le BrandSwitcher)
- `/parametres/` existe avec sous-dossiers (emails, webhooks, notifications) — structure pour ajouter `/parametres/marques`

### Conflits potentiels avec autres PRs

- **PR #867 (BO-VAR-NAME-PATTERN-001)** est en cours de merge :
  - Touche `packages/@verone/types/src/supabase.ts` (régen)
  - Touche `supabase/migrations/20260430_add_name_position_to_variant_groups.sql`
  - Touche `packages/@verone/products/src/components/modals/Variant*` + hooks variant-group
- **Stratégie** : j'attends que #867 merge avant d'appliquer ma migration DB + regen types. Sinon double drift sur `supabase.ts`.

---

## Décisions verrouillées (Romeo)

1. **Orthographe**
   - Slug technique : `verone`, `boemia`, `solar`, `flos` (sans h, sans accent — cohérent BO-DS-001)
   - Label humain : `Vérone`, `Boêmia`, `Solar`, `Flos` (avec accent ê)
   - ⚠️ Le brief original dit "Bohemia" — c'est une erreur, j'utilise `boemia`/`Boêmia`
2. **`brand_ids` DEFAULT `[]`** — pas de migration "tous à Vérone" (cf. no-phantom-data)
3. **`active_brand_id` NULLABLE** — NULL = "Toutes les marques" (mode admin)
4. **Pas de workflow d'approbation** — reporté Phase 4
5. **Pas de média/DAM ici** — reporté BO-MKT-001 (Phase 2)

---

## Plan de commits (5 commits, 1 PR)

### Commit 1 — Scaffold plan (ce commit)

```
[BO-BRAND-002] chore: scaffold internal brands sprint plan
```

**Fichier** : `docs/scratchpad/dev-plan-BO-BRAND-002.md`
**But** : push draft immédiat pour visibilité multi-agents.

---

### Commit 2 — Migration SQL (à appliquer APRÈS merge PR #867)

```
[BO-BRAND-002] feat: SQL migration create brands table + products.brand_ids + user_profiles.active_brand_id
```

**Fichier nouveau** : `supabase/migrations/20260501_NNNNNN_create_brands_table.sql`

Contenu :

```sql
-- 1. Table brands
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  brand_color text,
  logo_url text,
  social_handles jsonb,
  website_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed des 4 marques (orthographe verrouillée)
INSERT INTO brands (slug, name, display_order) VALUES
  ('verone', 'Vérone', 1),
  ('boemia', 'Boêmia', 2),
  ('solar', 'Solar', 3),
  ('flos', 'Flos', 4);

-- 3. Multi-marques sur products
ALTER TABLE products ADD COLUMN brand_ids uuid[] DEFAULT ARRAY[]::uuid[];
CREATE INDEX idx_products_brand_ids ON products USING gin(brand_ids);

-- 4. Marque active utilisateur
ALTER TABLE user_profiles ADD COLUMN active_brand_id uuid REFERENCES brands(id);

-- 5. RLS staff
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_brands" ON brands
  FOR ALL TO authenticated USING (is_backoffice_user());

-- 6. Trigger updated_at
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Application : via `mcp__supabase__execute_sql` (cf. flow validé BO-BRAND-001).

⚠️ **Synchronisation** : ATTENDRE merge PR #867 avant push commit 3 (pour éviter double drift `supabase.ts`).

---

### Commit 3 — Régénération types Supabase

```
[BO-BRAND-002] chore: regenerate Supabase types after brands migration
```

**Fichier modifié** : `packages/@verone/types/src/supabase.ts`

Procédure :

1. Si conflit avec staging : rebaser, puis regen
2. `mcp__supabase__generate_typescript_types`
3. Si CI types drift fail → utiliser l'artifact `supabase-types-drift` (cf. BO-BRAND-001 retex)

---

### Commit 4 — BrandSwitcher header + useActiveBrand hook

```
[BO-BRAND-002] feat: BrandSwitcher header + useActiveBrand hook
```

**Fichiers nouveaux** :

- `packages/@verone/hooks/src/use-active-brand.ts` (TanStack Query, SSR-safe)
- `packages/@verone/hooks/src/index.ts` (export hook)
- `apps/back-office/src/components/layout/brand-switcher.tsx` (composant dropdown)

**Fichier modifié** :

- `apps/back-office/src/components/layout/app-header.tsx` (injection du `<BrandSwitcher>`)

Contenu :

- `useActiveBrand()` : retourne `{ activeBrandId, activeBrand, brands, setActiveBrand, isAllBrands }`
- `<BrandSwitcher>` : dropdown avec "Toutes les marques" + 4 marques (chip couleur)
- Persistance : update `user_profiles.active_brand_id` + invalidate React Query
- Responsive (44px touch target sur mobile, 36px desktop)

---

### Commit 5 — Page /parametres/marques + BrandsMultiSelect + chips/filtre listes

```
[BO-BRAND-002] feat: brands settings page + multi-select on product form + chips on lists
```

**Fichiers nouveaux** :

- `apps/back-office/src/app/(protected)/parametres/marques/page.tsx`
- `apps/back-office/src/app/(protected)/parametres/marques/_components/BrandsTable.tsx`
- `apps/back-office/src/app/(protected)/parametres/marques/_components/BrandEditModal.tsx`
- `packages/@verone/products/src/components/forms/BrandsMultiSelect.tsx`
- `packages/@verone/products/src/components/badges/BrandChip.tsx`

**Fichiers modifiés** :

- `packages/@verone/products/src/components/forms/ProductFormModal.tsx` (intégration BrandsMultiSelect)
- `apps/back-office/src/app/(protected)/produits/catalogue/page.tsx` (chips + filtre marque dans toolbar)

Contenu :

- Page `/parametres/marques` : `<ResponsiveDataView>` avec édition inline (name, brand_color, logo_url, website_url, social_handles, is_active)
- Pas de création/suppression (4 marques figées seedées)
- `<BrandsMultiSelect>` : composant multi-select avec chips colorées
- `<BrandChip>` : composant atomique (badge avec brand_color)
- Filtre toolbar : intègre useActiveBrand pour pré-sélection si active_brand_id != NULL

---

## Tests Playwright (avant promote ready)

5 tailles : 375 / 768 / 1024 / 1440 / 1920 px

Scénarios :

- [ ] Switch dropdown marque header → persistance après reload
- [ ] Mode "Toutes les marques" → liste produits non filtrée
- [ ] Mode "Solar" → seuls produits avec brand_ids @> ARRAY['solar_id']
- [ ] Édition inline `/parametres/marques` → persisté
- [ ] Multi-select fiche produit → chips affichées
- [ ] Produit avec `brand_ids = []` → affichage neutre

---

## Workflow obligatoire

- ✅ Push draft IMMÉDIAT après commit 1 (visibilité multi-agents)
- ⏸ ATTENDRE merge PR #867 avant push commit 3 (regen types)
- 🔁 `git fetch origin staging && git rebase origin/staging` AVANT chaque push
- 🔒 `git push --force-with-lease`
- 🚫 `gh pr merge --admin` interdit absolu
- 🛡️ Worktree isolé `/Users/romeodossantos/verone-bo-brand-002`

---

## Acceptance criteria

- [ ] Migration SQL appliquée sans erreur (table brands + 4 colonnes)
- [ ] 4 brands seedés (verone, boemia, solar, flos)
- [ ] RLS staff full access via `is_backoffice_user()`
- [ ] Types Supabase régénérés (CI drift PASS)
- [ ] BrandSwitcher visible dans header sur 5 tailles (mobile/desktop)
- [ ] Page `/parametres/marques` accessible et fonctionnelle
- [ ] Multi-select brands sur fiche produit fonctionne
- [ ] Chips brands affichées sur listes produits
- [ ] Filtre toolbar fonctionne avec useActiveBrand
- [ ] 5 techniques responsives respectées (cf. responsive.md)
- [ ] Tests Playwright passent
- [ ] Type-check + build verts pour back-office, linkme, site-internet
- [ ] Reviewer-agent PASS

---

## Hors scope

- ❌ Table `media_assets` et bibliothèque DAM → BO-MKT-001 (Phase 2)
- ❌ Migration des `product_images` existantes → Phase 2
- ❌ Workflow d'approbation contenu → Phase 4
- ❌ Création/suppression de brands via UI (4 figées via seed)
- ❌ Logo upload (Cloudflare Images) → Phase 2 avec DAM
- ❌ Filtrage RLS server-side par brand → Phase ultérieure (Phase 1 = filtre client)

---

## Estimation

- Commit 1 (plan + push draft) : 5 min ✅
- Attente merge PR #867 : variable
- Commit 2 (migration SQL) : 30 min
- Commit 3 (regen types + résolution drift) : 30 min
- Commit 4 (BrandSwitcher + hook) : 2h
- Commit 5 (page params + multi-select + chips/filtre) : 3h
- Tests Playwright + validation : 1h
- **Total estimé** : ~7h de code + 30 min validation

---

## Référence

- Brief : `docs/scratchpad/brief-BO-MKT-001-phase1-dam.md`
- Audit factuel : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Règles : `multi-agent-workflow.md`, `branch-strategy.md` (Q4), `database.md` (RLS), `responsive.md` (5 techniques), `code-standards.md`, `data-fetching.md`, `no-phantom-data.md`
