# [BO-BRAND-003] Canaux par marque + visibilité par canal — Plan

**Date** : 2026-05-01
**Branche** : `feat/BO-BRAND-003-channels-by-brand`
**Worktree** : `/Users/romeodossantos/verone-bo-brand-003`
**Statut** : 🚧 Plan en cours, en attente du GO Romeo pour appliquer la migration.

---

## Contexte

3e étape des fondations multi-marques (après BO-BRAND-001 + BO-BRAND-002 mergées).

Objectifs :

1. Lier les canaux de vente aux marques internes Vérone Group via `sales_channels.brand_id`
2. Préparer 3 nouveaux canaux site internet pour Boêmia / Solar / Flos
3. Permettre la publication granulaire produit × canal via `channel_pricing.is_published_on_channel`

**Atomique DB seulement** (pas d'UI dans cette PR). UI = `BO-BRAND-003b` séparé.

Brief : sections "BO-BRAND-003" de `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
Audit : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`

---

## Audit factuel (effectué)

### DB — état actuel

5 canaux existants (`sales_channels`) :

| code            | name                 | domain_url                             | site_name                             |
| --------------- | -------------------- | -------------------------------------- | ------------------------------------- |
| google_merchant | Google Merchant      | NULL                                   | NULL                                  |
| linkme          | LinkMe               | NULL                                   | NULL                                  |
| manuel          | Manuel               | NULL                                   | NULL                                  |
| meta_commerce   | Meta Commerce        | https://business.facebook.com/commerce | Verone Collections                    |
| site_internet   | Site Internet Vérone | https://veronecollections.fr           | Vérone - Mobilier & Décoration Design |

4 brands disponibles :

| slug   | id                                     |
| ------ | -------------------------------------- |
| verone | `8f5523ff-3b54-4c16-88e5-301fc14fd995` |
| boemia | `92f83cf7-8276-4460-8e53-e66e704b9d28` |
| solar  | `222e069a-6e09-40dc-b1bf-47c2d8eb6233` |
| flos   | `a007a335-7f7f-41df-b7d7-c640f684c3e3` |

**Aucune colonne `brand_id` ni `is_published_on_channel` n'existe encore** → migration safe.

### RLS — déjà en place (rien à ajouter)

`sales_channels` :

- `backoffice_full_access_sales_channels` (ALL → authenticated, staff)
- `sales_channels_select_authenticated` (SELECT → authenticated)

`channel_pricing` :

- `backoffice_full_access_channel_pricing` (ALL → authenticated, staff)
- `channel_pricing_select_authenticated` (SELECT → authenticated)

→ Pas de nouvelle policy nécessaire. La nouvelle colonne hérite du RLS de la table.

---

## Décisions verrouillées

1. **`brand_id` NULLABLE** sur `sales_channels`
   - NULL = canal multi-marques (google_merchant, meta_commerce, linkme, manuel)
   - NOT NULL = canal dédié à une marque (site_internet → verone, site_boemia → boemia, etc.)
2. **3 nouveaux canaux créés vides** : `domain_url` et `site_name` à NULL (sites pas encore créés, BO-BRAND-005/006/007). **Aucun placeholder fantôme** (cf. `no-phantom-data.md`).
3. **Mapping `site_internet` → verone** via UPDATE explicite (canal historique de Vérone).
4. **`is_published_on_channel` BOOLEAN NOT NULL DEFAULT FALSE** sur `channel_pricing`
   - Pas de migration douce automatique : Romeo bascule manuellement les 30 produits actuellement `is_published_online=TRUE` via l'UI BO-BRAND-003b.
   - `products.is_published_online` (existant, global) **reste en place** pour rétrocompat jusqu'à BO-BRAND-004.

---

## Plan de commits (4 commits, 1 PR)

### Commit 1 — Scaffold plan (ce commit)

```
[BO-BRAND-003] chore: scaffold channels by brand sprint plan
```

**Fichier** : `docs/scratchpad/dev-plan-BO-BRAND-003.md`
**But** : push draft immédiat pour visibilité.

---

### Commit 2 — Migration SQL : brand_id + 3 nouveaux canaux

```
[BO-BRAND-003] feat: add brand_id to sales_channels + create 3 brand-specific channels
```

**Fichier nouveau** : `supabase/migrations/20260501010000_add_brand_id_to_sales_channels.sql`

```sql
BEGIN;

-- 1. Colonne brand_id (NULLABLE pour canaux multi-marques)
ALTER TABLE sales_channels
  ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX idx_sales_channels_brand_id ON sales_channels(brand_id);

COMMENT ON COLUMN sales_channels.brand_id IS
  'Marque interne associée. NULL = canal multi-marques (google_merchant, meta_commerce, linkme, manuel). NOT NULL = canal dédié à une marque (site_*).';

-- 2. Mapping rétroactif : site_internet → Vérone (canal historique)
UPDATE sales_channels
SET brand_id = (SELECT id FROM brands WHERE slug = 'verone')
WHERE code = 'site_internet';

-- 3. Création des 3 nouveaux canaux site_* (1 par marque, vides volontairement)
INSERT INTO sales_channels (code, name, brand_id, is_active, domain_url, site_name)
VALUES
  ('site_boemia', 'Site Internet Boêmia',
   (SELECT id FROM brands WHERE slug = 'boemia'),
   true, NULL, NULL),
  ('site_solar',  'Site Internet Solar',
   (SELECT id FROM brands WHERE slug = 'solar'),
   true, NULL, NULL),
  ('site_flos',   'Site Internet Flos',
   (SELECT id FROM brands WHERE slug = 'flos'),
   true, NULL, NULL);

COMMIT;
```

Application : `mcp__supabase__execute_sql`.

---

### Commit 3 — Migration SQL : is_published_on_channel

```
[BO-BRAND-003] feat: add is_published_on_channel to channel_pricing
```

**Fichier nouveau** : `supabase/migrations/20260501020000_add_is_published_on_channel.sql`

```sql
BEGIN;

ALTER TABLE channel_pricing
  ADD COLUMN is_published_on_channel boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN channel_pricing.is_published_on_channel IS
  'Indique si le produit est publié sur ce canal spécifique. Permet la publication granulaire produit × canal. Coexiste avec products.is_published_online (global, sera déprécié BO-BRAND-004).';

COMMIT;
```

⚠️ **Pas de migration douce des 30 produits actuellement `is_published_online=TRUE`**. Romeo bascule manuellement via l'UI BO-BRAND-003b. Cf. `no-phantom-data.md`.

Application : `mcp__supabase__execute_sql`.

---

### Commit 4 — Régénération types Supabase

```
[BO-BRAND-003] chore: regenerate Supabase types after channels migration
```

**Fichier modifié** : `packages/@verone/types/src/supabase.ts`

Procédure (retex BO-BRAND-002) :

1. Tenter `pnpm run generate:types` (sans doute fail Unauthorized → fallback)
2. Sinon `mcp__supabase__generate_typescript_types`
3. Si CI types drift fail → utiliser l'artifact `supabase-types-drift` byte-for-byte

---

## Workflow

- ✅ Push draft IMMÉDIAT après commit 1
- 🔁 `git fetch origin staging && git rebase origin/staging` AVANT chaque push
- 🔒 `git push --force-with-lease`
- 🚫 `gh pr merge --admin` interdit absolu

---

## Acceptance criteria

- [ ] Migration commit 2 appliquée (brand*id + 3 canaux site*\*)
- [ ] Migration commit 3 appliquée (is_published_on_channel)
- [ ] Vérification SQL :
  ```sql
  SELECT code, name, brand_id IS NOT NULL AS has_brand FROM sales_channels ORDER BY created_at;
  ```
  → 8 lignes (5 historiques + 3 nouveaux), site_internet/site_boemia/site_solar/site_flos avec `has_brand = true`
- [ ] `channel_pricing.is_published_on_channel` existe (default false)
- [ ] Types Supabase régénérés (CI drift PASS)
- [ ] Aucune RLS modifiée (existante OK)
- [ ] `pnpm --filter @verone/back-office type-check` PASS
- [ ] `pnpm --filter @verone/back-office build` PASS
- [ ] `pnpm --filter @verone/site-internet build` PASS
- [ ] `pnpm --filter @verone/linkme build` PASS
- [ ] CI 100% verte
- [ ] Reviewer-agent PASS

---

## Hors scope (à NE PAS faire ici)

- ❌ UI toggle "Publier sur [canal]" sur fiche produit → **BO-BRAND-003b** (PR séparée)
- ❌ Migration douce auto des 30 produits `is_published_online=TRUE` → manuel via UI plus tard
- ❌ Modification de la RPC `get_site_internet_products()` → **BO-BRAND-004** (RPC paramétrée par brand_slug)
- ❌ Création apps `bohemia/solar/flos` → BO-BRAND-005/006/007
- ❌ Tests Playwright (rien d'UI dans cette PR)

---

## Estimation

- Commit 1 (plan + push draft) : 5 min ✅
- Commit 2 (migration brand_id + 3 canaux) : 15 min
- Commit 3 (migration is_published_on_channel) : 10 min
- Commit 4 (regen types + drift fix éventuel) : 30 min
- Builds + validation : 30 min
- **Total estimé** : ~1h30 de code + CI ~25 min

---

## Référence

- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Audit factuel : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Règles : `database.md`, `branch-strategy.md` (Q4 régen types), `no-phantom-data.md`, `multi-agent-workflow.md`
