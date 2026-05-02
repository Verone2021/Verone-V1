# Brief technique — [BO-BRAND-001] Renommer `products.brand` → `manufacturer`

**Date** : 2026-04-30
**Statut** : Cahier des charges v1 — atomique, refactoring pur
**Pour** : Claude Code + dev-agent (lecture obligatoire avant de coder)

> **Lecture préalable obligatoire** : `docs/scratchpad/audit-marques-canaux-2026-04-30.md` (concept enseignes/brands/manufacturer)

---

## 1. Contexte

Le champ `products.brand` actuel contient des libellés **fabricants** (OPJET = 124 produits, atmosphera = 16, Five = 2, HOME DECO FACTORY = 2, Nordik Living = 1, Florissima = 1, Vérone Collections = 2). Ce sont les fournisseurs.

Romeo veut introduire le concept de **marques internes Vérone Group** (Vérone, Bohemia, Solar, Flos) en Phase BO-BRAND-002. Pour éviter une collision sémantique (`brand` = fabricant vs `brand_ids` = marque interne), on renomme préventivement le champ existant.

**Décision Roméo (2026-04-30)** : option "Renommer en `manufacturer`".

---

## 2. Périmètre

### Migration DB (atomique)

```sql
-- ============================================================
-- Migration [BO-BRAND-001] — Renommer products.brand → manufacturer
-- Périmètre : refactoring pur, aucun ajout de table
-- ============================================================

ALTER TABLE products RENAME COLUMN brand TO manufacturer;

-- Si un index existe sur brand, le renommer aussi
-- À vérifier via :
-- SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE '%brand%';
```

### Code à mettre à jour (refactoring)

Toutes les références à `products.brand` dans :

- `packages/@verone/types/src/supabase.ts` (régénération automatique)
- `apps/back-office/src/`
- `apps/site-internet/src/`
- `apps/linkme/src/`
- `packages/@verone/*/`
- `supabase/migrations/*` (uniquement les migrations qui FONT référence à `products.brand` dans un SELECT — les migrations historiques avec `ALTER TABLE products ADD COLUMN brand` ne sont PAS modifiées, c'est l'historique)
- Toutes les RPC qui retournent `p.brand` (notamment `get_site_internet_products()`)

### Régénération types Supabase

Obligatoire dans la même PR (cf. `.claude/rules/branch-strategy.md` Q4) :

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
git commit -m "[BO-BRAND-001] chore: regenerate Supabase types after brand rename"
```

---

## 3. Procédure

1. **Audit préalable** : grep exhaustif des occurrences `products.brand` et `.brand` (en contexte products)

   ```bash
   grep -rn "\.brand" --include="*.ts" --include="*.tsx" apps/ packages/ | grep -v node_modules
   grep -rn "p\.brand\|products\.brand" --include="*.sql" supabase/migrations/
   ```

2. **Migration SQL** : appliquer le ALTER TABLE
3. **Régénération types** : `pnpm run generate:types`
4. **Refactoring code** : remplacer chaque occurrence par `manufacturer`
5. **Vérification RPC** : adapter `get_site_internet_products()` et autres RPC qui retournent `brand`
6. **Tests Playwright** : sur les pages où le fabricant est affiché (fiche produit, listes, fournisseurs)
7. **Build + type-check** verts
8. **Reviewer-agent** PASS

---

## 4. Anti-patterns à éviter

- ❌ Renommer aussi un champ `brand` qui ne serait PAS sur products (ex: peut exister sur `suppliers` ou autre — vérifier avant)
- ❌ Faire la migration dans une PR qui contient aussi BO-BRAND-002 (table brands). Doit rester atomique.
- ❌ Oublier les RPC qui retournent ce champ — un type drift apparaîtra à l'usage

---

## 5. Acceptance criteria

- [ ] `ALTER TABLE products RENAME COLUMN brand TO manufacturer` appliqué sans erreur
- [ ] `pnpm run generate:types` exécuté + types committés
- [ ] Aucune occurrence restante de `products.brand` ou `p.brand` dans le code TS/TSX/SQL (grep exhaustif)
- [ ] RPC `get_site_internet_products()` mise à jour
- [ ] `pnpm --filter @verone/back-office build` vert
- [ ] `pnpm --filter @verone/site-internet build` vert
- [ ] `pnpm --filter @verone/linkme build` vert
- [ ] Tests Playwright sur fiche produit OK
- [ ] Reviewer-agent PASS

---

## 6. Découpage (1 PR, 2-3 commits)

Branche : `feat/BO-BRAND-001-rename-manufacturer`

1. `[BO-BRAND-001] feat: rename products.brand → manufacturer (DB migration + types)`
2. `[BO-BRAND-001] refactor: update code references brand → manufacturer`
3. `[BO-BRAND-001] feat: update RPC get_site_internet_products with manufacturer`

PR vers `staging`.

---

## 7. Hors scope

- ❌ Création table `brands` → [BO-BRAND-002]
- ❌ Ajout `products.brand_ids[]` → [BO-BRAND-002]
- ❌ Création table `manufacturers` (FK propre) → backlog futur, pas urgent

---

## 8. Estimation

1-2 jours. Refactoring pur, faible risque, mais à faire AVANT BO-BRAND-002 pour éviter la confusion `brand` (fabricant) vs `brand_ids` (marques internes) qui se cohabiteraient sinon dans la même PR.
