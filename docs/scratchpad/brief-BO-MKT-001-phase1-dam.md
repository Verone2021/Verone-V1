# Brief technique — [BO-BRAND-002] Table `brands` + UI gestion (atomique)

**Date** : 2026-04-30
**Statut** : Cahier des charges v3 — RENUMÉROTÉ depuis BO-MKT-001 vers BO-BRAND-002
**Pour** : Claude Code + dev-agent (lecture obligatoire avant de coder)

> ⚠️ **CHANGEMENT DE TASK ID (2026-04-30 fin de session)** : ce brief s'appelait initialement `[BO-MKT-001]` mais a été renuméroté en **`[BO-BRAND-002]`** car il fait partie des fondations multi-marques, pas du marketing. Le contenu reste valide. Le nouveau Task ID `[BO-MKT-001]` désigne désormais la Bibliothèque DAM (à venir après les fondations BO-BRAND-\*).

> ⚠️ **DÉPENDANCE BLOQUANTE** : ce brief ne peut être exécuté qu'APRÈS merge de **[BO-BRAND-001]** (renommage `products.brand` → `manufacturer`). Voir `brief-BO-BRAND-001-rename-manufacturer.md`.

> **Lecture préalable obligatoire** :
>
> - `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
> - `.claude/work/BO-BRAND-MKT-roadmap-v3.md` (roadmap consolidée)

---

## 1. Contexte

Création de la **table `brands`** pour les marques internes du groupe Vérone (Vérone, Bohemia, Solar, Flos) + ajout d'une colonne `brand_ids uuid[]` sur `products` + UI BrandSwitcher dans le header global + UI minimale de gestion des marques (page `/parametres/marques`).

**Cette PR NE TOUCHE PAS aux images** — le DAM (`media_assets`, `media_asset_links`, migration `product_images`) est en Phase 2.

### Concept clarifié (validé Romeo 2026-04-30)

`enseignes` (existant) ≠ `brands` (à créer). Concepts orthogonaux :

| Concept            | Sémantique                                                                                          | Exemple                      |
| ------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| `enseignes`        | **Clients professionnels B2B partenaires** (chaînes de magasins). Utilisé pour produits sur mesure. | Pokawa                       |
| `organisations`    | Société/client (B2B ou B2C).                                                                        | Pokawa SAS                   |
| `brands` (nouveau) | **Marques internes Vérone Group**. Chacune aura son propre site internet dédié.                     | Vérone, Bohemia, Solar, Flos |

Un produit peut combiner les deux dimensions sans collision. Exemples :

- Lampe Vérone+Solar catalogue : `enseigne_id = NULL`, `brand_ids = [verone, solar]`
- Powerbank Solar uniquement : `enseigne_id = NULL`, `brand_ids = [solar]`
- Produit sur mesure pour Pokawa, sous marque Vérone : `enseigne_id = pokawa_id`, `brand_ids = [verone]`
- Produit white-label pour Pokawa, sans marque interne : `enseigne_id = pokawa_id`, `brand_ids = []`

---

## 2. Décisions architecturales verrouillées

### Décision 1 — `brands` est une table NOUVELLE et SÉPARÉE

Pas de recyclage de `enseignes`. Cohabitation propre.

### Décision 2 — `products.brand_ids uuid[]` à NULL/[] par défaut

**Pas de migration "tous les produits = Vérone"**. Initialisation à `[]`. L'attribution se fait au cas par cas via l'UI fiche produit (Phase 1) ou en batch via une opération admin ultérieure.

Raison : les produits sur mesure Pokawa / produits white-label peuvent légitimement avoir `brand_ids = []`. Forcer Vérone par défaut induirait une donnée fantôme (cf. `.claude/rules/no-phantom-data.md`).

### Décision 3 — Switch dropdown header avec mode "Toutes les marques"

Champ `active_brand_id uuid` dans `user_profiles`. NULL = "Toutes les marques" (mode admin). Filtrage côté client uniquement (pas de RLS) en Phase 1.

### Décision 4 — Pas de workflow d'approbation

Reporté Phase 4 quand le community manager arrivera.

### Décision 5 — Pas de `media_assets` ici

Reporté Phase 2.

---

## 3. Schéma DB de cette PR

```sql
-- ============================================================
-- Migration [BO-MKT-001] — Phase 1 : Marques internes Vérone Group
-- Périmètre : brands + products.brand_ids + user_profiles.active_brand_id
-- HORS PÉRIMÈTRE : media_assets, media_asset_links (Phase 2)
-- ============================================================

-- 1. Table brands (marques internes Vérone Group)
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  brand_color text,                  -- couleur primaire #XXXXXX pour chip header
  logo_url text,                     -- URL temporaire (remplacée par logo_asset_id en Phase 2)
  social_handles jsonb,              -- {"instagram":"...", "facebook":"...", "pinterest":"...", "tiktok":"..."}
  website_url text,                  -- URL du site dédié de la marque (vide pour Vérone car partagé avec back-office initial)
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed des 4 marques internes
INSERT INTO brands (slug, name, display_order) VALUES
  ('verone', 'Vérone', 1),
  ('bohemia', 'Bohemia', 2),
  ('solar', 'Solar', 3),
  ('flos', 'Flos', 4);

-- 2. Multi-marques sur products (orthogonal à enseigne_id existant)
ALTER TABLE products ADD COLUMN brand_ids uuid[] DEFAULT ARRAY[]::uuid[];
CREATE INDEX idx_products_brand_ids ON products USING gin(brand_ids);

-- 3. Marque active utilisateur (dropdown header)
ALTER TABLE user_profiles ADD COLUMN active_brand_id uuid REFERENCES brands(id);
-- NULL = mode "Toutes les marques" (par défaut)

-- 4. RLS — staff backoffice voit tout
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_brands" ON brands
  FOR ALL TO authenticated USING (is_backoffice_user());

-- 5. Trigger updated_at
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Volume : ~50 lignes SQL. Atomique. Zéro risque sur l'existant.

---

## 4. UI à livrer

### A. `<BrandSwitcher>` dans le header global

**Fichier cible** : à identifier via grep dans `apps/back-office/src/components/layout/` ou `apps/back-office/src/app/(protected)/layout.tsx`.

Dropdown avec :

- "Toutes les marques" (par défaut, `active_brand_id = NULL`)
- Vérone / Bohemia / Solar / Flos (chip avec `brand_color`)
- Persistance : update `user_profiles.active_brand_id` + invalidate React Query cache

### B. Hook `useActiveBrand()`

**Fichier** : `packages/@verone/hooks/src/use-active-brand.ts` (nouveau)

```typescript
export function useActiveBrand() {
  // Query user_profiles.active_brand_id + jointure brands
  // Return { activeBrandId, activeBrand, setActiveBrand, isAllBrands }
  // SSR-safe (cf. patterns existants dans @verone/hooks)
}
```

### C. Page `/parametres/marques` (gestion CRUD basique)

Tableau des 4 marques avec :

- Édition inline (name, brand_color, logo_url temporaire, website_url, social_handles, is_active)
- Pas de création/suppression (les 4 sont seedées et figées)
- Composant : `<ResponsiveDataView>` du package `@verone/ui`

### D. Section "Marques" dans la fiche produit

Dans le composant existant `ProductFormModal` ou équivalent :

- Multi-select des marques (composant `<BrandsMultiSelect>` à créer)
- Affichage des chips couleur des marques sélectionnées
- Sauvegarde dans `products.brand_ids`
- Pas de validation forcée (peut rester `[]` pour produits white-label)

### E. Indicateur visuel marques sur les listes produits

Sur les pages listes produits (`/produits/catalogue`, etc.) :

- Affichage des chips brands à côté du nom (sous tooltip si plusieurs)
- Filtre marque dans la toolbar (utilise `useActiveBrand()` pour pré-sélection)

---

## 5. Tests Playwright obligatoires

5 tailles : 375 / 768 / 1024 / 1440 / 1920 px (cf. `.claude/rules/responsive.md`)

Scénarios :

- [ ] Switch dropdown marque dans header → persistance après reload
- [ ] Mode "Toutes les marques" → liste produits non filtrée
- [ ] Mode "Solar" → seuls les produits avec `solar` dans brand_ids visibles
- [ ] Édition inline d'une marque dans `/parametres/marques` → persisté en DB
- [ ] Attribution multi-marques sur fiche produit → chips affichées correctement
- [ ] Produit avec `brand_ids = []` → affichage neutre (pas de chip), pas de bug

---

## 6. Acceptance criteria

- [ ] Migration SQL appliquée sans erreur
- [ ] Régénération types Supabase committée dans la même PR (cf. `.claude/rules/branch-strategy.md` Q4)
- [ ] Aucune régression sur les pages existantes
- [ ] BrandSwitcher visible et fonctionnel dans le header sur les 5 tailles
- [ ] Page `/parametres/marques` accessible et fonctionnelle
- [ ] Section "Marques" dans la fiche produit (création + édition)
- [ ] Tests Playwright passent
- [ ] `pnpm --filter @verone/back-office type-check` vert
- [ ] `pnpm --filter @verone/back-office build` vert
- [ ] reviewer-agent PASS

---

## 7. Découpage en commits (1 PR)

Branche : `feat/BO-MKT-001-internal-brands`

1. `[BO-MKT-001] feat: add brands table + products.brand_ids + user_profiles.active_brand_id`
2. `[BO-MKT-001] chore: regenerate Supabase types after brands migration`
3. `[BO-MKT-001] feat: BrandSwitcher header + useActiveBrand hook`
4. `[BO-MKT-001] feat: /parametres/marques CRUD UI + BrandsMultiSelect on product form`
5. `[BO-MKT-001] feat: brand chips + brand filter on product lists`

PR vers `staging` quand bloc complet.

---

## 8. Hors scope Phase 1 (à NE PAS implémenter ici)

- ❌ Table `media_assets` et toute la bibliothèque DAM → **Phase 2 [BO-MKT-002]**
- ❌ Migration des `product_images` existantes → Phase 2
- ❌ Studio Prompts Nano Banana → Phase 3
- ❌ Création fiche produit depuis photo (Gemini Vision) → Phase 3
- ❌ Connecteurs Meta/Pinterest/TikTok/Metricool → Phase 4 (par redirections d'abord)
- ❌ Workflow d'approbation contenu → Phase 4

---

## 9. En cas de blocage

- Si la migration `ALTER TABLE products ADD COLUMN brand_ids` rencontre un lock long en prod, faire en heures creuses ou utiliser `ALTER TABLE ... ADD COLUMN ... NOT VALID` puis valider.
- Si `useActiveBrand()` doit accéder à un contexte non disponible côté serveur, l'isoler dans un Provider client uniquement.
- Si Romeo n'est pas dispo pour valider une décision UI, marquer en `[BLOCKED]` dans le scratchpad et attendre.

---

## 10. Liens rapides

- **Audit factuel obligatoire** : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Audit principal : `docs/scratchpad/audit-2026-04-30-bibliotheque-images-marketing.md`
- Roadmap : `.claude/work/BO-MKT-roadmap.md` (v1, partiellement obsolète) + `.claude/work/BO-MKT-roadmap-v2.md` (à jour)
- Règles internes :
  - `.claude/rules/database.md` (RLS, migrations)
  - `.claude/rules/code-standards.md` (TS, hooks)
  - `.claude/rules/responsive.md` (UI)
  - `.claude/rules/branch-strategy.md` (Q4 régen types)
  - `.claude/rules/no-phantom-data.md` (pas d'init forcée à Vérone)

---

## 11. Notes pour Phase 2 (DAM, brief séparé à venir)

Ce qui dépendra de Phase 1 :

- `media_assets.brand_ids[]` référencera `brands.id`
- `media_asset_links.brand_id` référencera `brands.id`
- `useActiveBrand()` filtrera la bibliothèque par marque active
- `brands.logo_asset_id` sera ajouté en Phase 2 (FK vers `media_assets`)
