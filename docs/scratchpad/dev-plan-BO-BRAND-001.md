# [BO-BRAND-001] Renommer `products.brand` → `manufacturer` — Plan de découpage

**Date** : 2026-04-30
**Branche** : `feat/BO-BRAND-001-rename-manufacturer`
**Worktree** : `/Users/romeodossantos/verone-bo-brand-001`
**Statut** : 🚧 Plan en cours, en attente du GO de Romeo pour attaquer le code.

---

## Contexte

Le champ `products.brand` actuel contient des libellés **fabricants** (OPJET, atmosphera, Five, HOME DECO FACTORY, Nordik Living, Florissima, Vérone Collections). Pour préparer l'introduction des **marques internes** (Vérone, Boêmia, Solar, Flos) en BO-BRAND-002, on renomme préventivement `brand` → `manufacturer` pour éviter la collision sémantique.

Brief complet : `docs/scratchpad/brief-BO-BRAND-001-rename-manufacturer.md`

---

## Audit factuel (effectué avant écriture du plan)

### DB — colonnes contenant "brand"

```sql
SELECT column_name FROM information_schema.columns WHERE column_name LIKE '%brand%';
```

Résultat :

| Table | Colonne | Action |
|---|---|---|
| `products` | `brand` (varchar, nullable) | ✅ À renommer en `manufacturer` |
| `collections` | `brand_id` (uuid, nullable) | ❌ Concept différent — NE PAS toucher |

### DB — fonctions RPC qui réfèrent `p.brand`

```sql
SELECT proname FROM pg_proc WHERE pg_get_functiondef(oid) LIKE '%p.brand%';
```

| Fonction | Type retour | Action |
|---|---|---|
| `get_site_internet_products()` | TABLE(..., brand text, ...) | ✅ DROP + recreate avec `manufacturer text` |
| `get_google_merchant_eligible_products()` | TABLE(..., brand varchar) | ✅ DROP + recreate avec `manufacturer varchar` |
| `get_product_detail_public(uuid, uuid)` | jsonb | ✅ CREATE OR REPLACE (signature jsonb inchangée, on renomme la clé `brand` → `manufacturer` dans le JSON) |

### Code TS/TSX — fichiers avec `.brand` (filtré pour exclure brand_id, brand_logo, brand_name)

35 fichiers identifiés via grep. Aucun chevauchement direct avec les fichiers modifiés par PR #861 (autre agent BO-VAR-FORM-002).

**Conflit potentiel à un seul endroit** : `packages/@verone/types/src/supabase.ts` (régénéré par les 2 PRs). Stratégie : rebaser souvent et regen au dernier moment avant ready.

### Migrations historiques avec `brand`

Plusieurs migrations historiques contiennent `ALTER TABLE products ADD COLUMN brand` ou `p.brand` dans des SELECT. Per le brief : **on ne touche PAS aux migrations historiques** (append-only). On crée une nouvelle migration de RENAME.

---

## Décisions à valider avec Romeo (avant d'attaquer le code)

1. **Nom du champ retourné par les RPC** : on renomme aussi en `manufacturer` (plus propre, code consommateur change), ou alias rétrocompat `AS brand` (pas de breakage code consommateur, mais incohérence) ?
   → **Proposition** : renommer aussi (`AS manufacturer`). Cohérent avec le but du sprint.
2. **Application de la migration SQL** : tu appliques toi-même via Supabase Studio (FEU ROUGE pour moi), ou tu m'autorises un `mcp__supabase__apply_migration` exceptionnel (bloqué dans settings.json) ?
   → **Proposition** : tu appliques. Je commit le fichier .sql, tu le passes dans Supabase Studio, tu me confirmes "appliqué".
3. **Régen types Supabase** : FEU ROUGE en théorie, mais le brief BO-BRAND-001 le demande explicitement. Tu confirmes l'autorisation pour ce sprint ?
   → **Proposition** : oui, c'est dans le scope du brief. Je le fais après application de la migration.
4. **Coordination avec autre agent (PR #861)** : on accepte un conflit potentiel sur `supabase.ts` à résoudre via rebase + regen ?
   → **Proposition** : oui, on rebase + regen au dernier moment juste avant promote ready.

---

## Plan de commits (5 commits, 1 PR)

### Commit 1 — Scaffold plan (ce commit)

```
[BO-BRAND-001] chore: scaffold rename brand to manufacturer plan
```

**Fichier** : `docs/scratchpad/dev-plan-BO-BRAND-001.md`
**But** : push draft immédiat pour visibilité multi-agents.

---

### Commit 2 — Fichier migration SQL (non appliqué)

```
[BO-BRAND-001] feat: SQL migration rename products.brand to manufacturer
```

**Fichier nouveau** : `supabase/migrations/20260430XXXXXX_rename_products_brand_to_manufacturer.sql`

Contenu :

```sql
-- ============================================================
-- Migration [BO-BRAND-001] — Rename products.brand → manufacturer
-- ============================================================
-- Refactoring pur. La colonne contient des libellés fabricants
-- (OPJET, atmosphera, Five, etc.) — pas des marques internes.
-- Renommage préventif AVANT introduction de table 'brands' (BO-BRAND-002).
-- ============================================================

-- 1. Rename de la colonne products.brand → products.manufacturer
ALTER TABLE products RENAME COLUMN brand TO manufacturer;

-- 2. Recréer get_site_internet_products() avec manufacturer
DROP FUNCTION IF EXISTS get_site_internet_products();
CREATE OR REPLACE FUNCTION get_site_internet_products() ...
  -- p.manufacturer::TEXT AS manufacturer (au lieu de p.brand::TEXT AS brand)
  -- + RETURNS TABLE(..., manufacturer text, ...)

-- 3. Recréer get_google_merchant_eligible_products() avec manufacturer
DROP FUNCTION IF EXISTS get_google_merchant_eligible_products();
CREATE OR REPLACE FUNCTION get_google_merchant_eligible_products() ...

-- 4. Mettre à jour get_product_detail_public(uuid, uuid)
-- (RETURNS jsonb — pas besoin de DROP, juste CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION get_product_detail_public(...) ...
  -- 'manufacturer', v_product.manufacturer (au lieu de 'brand', v_product.brand)
```

⚠️ **Action de Romeo entre commit 2 et commit 3** : appliquer la migration via Supabase Studio, confirmer "appliqué". Sans cette étape, les commits 3-5 ne peuvent pas avancer.

---

### Commit 3 — Régénération types Supabase

```
[BO-BRAND-001] chore: regenerate Supabase types after manufacturer rename
```

**Fichier modifié** : `packages/@verone/types/src/supabase.ts`

Régénéré via `mcp__supabase__generate_typescript_types` après application de la migration. Propagation automatique du nom `manufacturer` partout dans les types (Row, Insert, Update + signatures RPC).

⚠️ Conflit potentiel avec PR #861 (autre agent regen pour ses propres changes). Si l'autre agent merge en premier : rebase + regen + résolution.

---

### Commit 4 — Refactor code TS/TSX

```
[BO-BRAND-001] refactor: rename brand to manufacturer in TS/TSX code
```

**~35 fichiers modifiés**. Stratégie : remplacer chaque `.brand` qui réfère products par `.manufacturer`. Garder intacts `brand_id`, `brand_logo`, `brand_name`, `brands` (pluriel = autres concepts).

#### Apps

`apps/back-office/` :
- `src/app/(protected)/canaux-vente/site-internet/components/EditSiteInternetProductModal/TabInformations.tsx`
- `src/app/(protected)/canaux-vente/site-internet/components/ProductPreviewModal.tsx`
- `src/app/(protected)/canaux-vente/site-internet/produits/[id]/components/ProductInfoSection.tsx`
- `src/app/(protected)/produits/catalogue/[productId]/_components/_characteristics-blocks/IdentificationCommerceCard.tsx`
- `src/app/(protected)/produits/catalogue/[productId]/_components/types.ts`
- `src/app/api/exports/products/route.ts`
- `src/app/api/sourcing/import/route.ts`
- `src/components/business/wizard-sections/supplier-section.tsx`
- `src/components/forms/use-quick-variant-form.ts`

`apps/site-internet/` :
- `src/app/produit/[id]/page.tsx`
- `src/app/produit/[id]/components/ProductSidebar.tsx`
- `src/app/api/feeds/products.xml/route.ts` (Google Merchant feed — `<g:brand>` reste car c'est le nom XML imposé par Google, mais la valeur lue côté product change)
- `src/components/SearchOverlay.tsx`
- `src/components/analytics/GoogleAnalytics.tsx` (`item_brand` reste = nom GA imposé, mais valeur change)
- `src/components/catalogue/CatalogueSidebar.tsx`
- `src/hooks/use-catalogue-filters.ts`

`apps/linkme/` :
- `src/components/catalogue/ProductDetailModal.tsx`

#### Packages

`packages/@verone/products/` (~13 fichiers — aucun chevauchement avec PR #861) :
- `src/components/cards/SourcingProductEditCard/SourcingProductDetailsSection.tsx`
- `src/components/cards/SourcingProductEditCard/index.tsx`
- `src/components/sections/IdentifiersCompleteEditSection.tsx`
- `src/components/sections/ProductEditMode/ProductEditManagementColumn.tsx`
- `src/components/sections/ProductEditMode/hooks.ts`
- `src/components/sections/ProductViewMode.tsx`
- `src/components/sourcing/SourcingQuickForm/components/ProductFieldsSection.tsx`
- `src/components/sourcing/SourcingQuickForm/hooks.ts`
- `src/components/wizards/complete-product/useCompleteProductWizard.ts`
- `src/components/wizards/sections/TechnicalSection.tsx`
- `src/hooks/sourcing/use-sourcing-create-update.ts`
- `src/hooks/use-products.ts`
- `src/hooks/use-variant-products-create.ts`

`packages/@verone/integrations/` (Google Merchant — attention noms externes) :
- `src/google-merchant/excel-transformer.ts`
- `src/google-merchant/product-mapper.ts`
- `src/google-merchant/transformer.ts`

`packages/@verone/common/` :
- `src/components/sections/IdentifiersCompleteEditSection.tsx`

`packages/@verone/ui-business/` :
- `src/components/sections/RelationsEditSection.tsx`

#### Cas particuliers à traiter manuellement

- **XML feed Google Merchant** : la balise `<g:brand>` reste (norme externe), mais la valeur lue côté `product.brand` devient `product.manufacturer`.
- **Google Analytics** : `item_brand` reste (norme GA4), mais la valeur passée change.
- **Champs UI label** : si du texte affiche "Marque" ou "Brand", on garde le label tel quel (UX) ou on le change en "Fabricant" ? À valider avec Romeo (proposition : "Fabricant" pour clarifier).

---

### Commit 5 — Validation finale

Pas de fichier modifié — juste un commit récap si nécessaire (souvent omis).

Validations à effectuer AVANT promote ready :
- [ ] `pnpm --filter @verone/back-office build` PASS
- [ ] `pnpm --filter @verone/site-internet build` PASS
- [ ] `pnpm --filter @verone/linkme build` PASS
- [ ] `pnpm --filter @verone/back-office type-check` PASS
- [ ] Tests Playwright fiche produit (catalogue + canaux site-internet)
- [ ] Reviewer-agent PASS
- [ ] Rebase final sur `origin/staging` (capture potentiel merge PR #861)
- [ ] Regen types post-rebase si supabase.ts modifié entre temps
- [ ] CI 100% verte

---

## Workflow obligatoire (rappel)

- ✅ Push draft IMMÉDIAT après commit 1
- 🔁 `git fetch origin staging && git rebase origin/staging` AVANT chaque push
- 🔒 `git push --force-with-lease`
- 🚫 `gh pr merge --admin` interdit absolu
- 🛡️ Worktree isolé `/Users/romeodossantos/verone-bo-brand-001`
- ⏸ J'attends GO Romeo avant code (point f de l'ordre d'exécution)

---

## Estimation

- Commit 1 (plan + push draft) : 5 min
- Commit 2 (migration SQL) : 1h (3 RPC à recréer avec leur body complet — il faut lire les versions actuelles pour préserver toute la logique métier)
- Application migration par Romeo : ~5 min côté Romeo
- Commit 3 (regen types) : 5 min
- Commit 4 (refactor code 35 fichiers) : 2h30 (Edit tool par fichier, attention aux faux-positifs)
- Validation + rebase + promote : 30 min
- **Total estimé** : ~4h30

---

## Référence

- Brief technique : `docs/scratchpad/brief-BO-BRAND-001-rename-manufacturer.md`
- Audit factuel : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Règles : `.claude/rules/multi-agent-workflow.md`, `branch-strategy.md` (Q4 régen types), `code-standards.md`, `database.md`
