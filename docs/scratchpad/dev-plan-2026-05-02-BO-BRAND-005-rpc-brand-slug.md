# [BO-BRAND-005] dev-plan — RPC paramétrée `get_site_internet_products(brand_slug)`

**Date** : 2026-05-02
**Branche** : `feat/BO-BRAND-005-rpc-brand-slug` (worktree `/Users/romeodossantos/verone-brand-005`)
**Estimation** : 1-2 jours
**Dépendances** : BO-BRAND-001 → 004 mergés sur staging.

---

## 1. Objectif

Permettre à `get_site_internet_products()` de filtrer par **marque interne** (`brand_slug`) pour préparer les apps `bohemia`, `solar`, `flos` (sprints suivants).

**Sans ce sprint** : l'app `apps/bohemia` afficherait les mêmes produits que `apps/site-internet` (Vérone). Bloque toute la suite.

---

## 2. Périmètre exact

### 2.1 Migration SQL

Nouveau fichier : `supabase/migrations/20260502000000_get_site_internet_products_brand_slug.sql`

```sql
-- ============================================================
-- [BO-BRAND-005] Paramétrer get_site_internet_products par brand_slug
-- ============================================================
-- Objectif : permettre aux 4 sites Next.js (Vérone/Bohemia/Solar/Flos)
-- d'appeler la même RPC en passant leur brand_slug et obtenir
-- uniquement leurs produits (filtrage via products.brand_ids).
--
-- Comportement par défaut (brand_slug = NULL) : rétrocompatible avec
-- le site-internet Vérone existant — retourne tous les produits publiés.
--
-- Le filtre additionnel s'active uniquement si brand_slug est fourni :
-- garde uniquement les produits où brand_ids contient l'id de la marque.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.get_site_internet_products();
DROP FUNCTION IF EXISTS public.get_site_internet_products(text);

CREATE OR REPLACE FUNCTION public.get_site_internet_products(p_brand_slug text DEFAULT NULL)
 RETURNS TABLE(...) -- même signature qu'avant
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $function$
DECLARE
  v_brand_id uuid;
BEGIN
  -- Si brand_slug fourni, résoudre l'id (ou erreur si inconnu)
  IF p_brand_slug IS NOT NULL THEN
    SELECT id INTO v_brand_id FROM brands WHERE slug = p_brand_slug AND is_active = TRUE;
    IF v_brand_id IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive brand_slug: %', p_brand_slug;
    END IF;
  END IF;

  RETURN QUERY
  SELECT ... -- corps existant
  FROM products p
  ...
  WHERE p.product_status = 'active'
    AND p.is_published_online = TRUE
    AND p.slug IS NOT NULL
    AND ...
    -- Nouveau filtre : si brand_slug fourni, p.brand_ids doit contenir v_brand_id
    AND (v_brand_id IS NULL OR v_brand_id = ANY(p.brand_ids))
  ORDER BY p.name ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_site_internet_products(text) TO anon, authenticated, service_role;

COMMIT;
```

### 2.2 Code TypeScript — apps/site-internet

Fichiers à mettre à jour (à confirmer via grep) :
- `apps/site-internet/src/hooks/use-catalogue.ts` (ou équivalent)
- Tout `supabase.rpc('get_site_internet_products', ...)` dans `apps/site-internet/`

Action : ajouter `{ p_brand_slug: 'verone' }` en argument explicite.
**Pour cette PR**, on passe `'verone'` partout dans `apps/site-internet`. Quand `apps/bohemia` sera créé (BO-BRAND-006), il passera `'bohemia'`.

### 2.3 Régénération types

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
```

À committer dans la même PR (cf. `.claude/rules/branch-strategy.md` Q4).

---

## 3. Hors scope (NE PAS toucher dans cette PR)

- ❌ Migration `is_published_online` → `is_published_on_channel` (sprint séparé, plus risqué — 30 produits à migrer)
- ❌ Création de `apps/bohemia` (= BO-BRAND-006, prochaine PR)
- ❌ Modification de la RPC `get_google_merchant_eligible_products` (pas concernée par marque interne — Google Merchant catalogue Vérone uniquement pour l'instant)
- ❌ Modification de `get_product_detail_public` (à voir au cas par cas si appelée par les futures apps de marque)

---

## 4. Acceptance criteria

- [ ] Migration SQL appliquée sans erreur (ALTER signature)
- [ ] `get_site_internet_products()` (sans param) retourne le même résultat qu'avant (rétrocompat)
- [ ] `get_site_internet_products('verone')` retourne uniquement produits avec `verone_id ∈ brand_ids`
- [ ] `get_site_internet_products('inconnu')` lève une exception explicite
- [ ] Régénération types Supabase committée dans la même PR
- [ ] Tous les appels `apps/site-internet/` passent `p_brand_slug: 'verone'`
- [ ] `pnpm --filter @verone/site-internet build` vert
- [ ] `pnpm --filter @verone/site-internet type-check` vert
- [ ] reviewer-agent PASS

---

## 5. Tests Playwright

**Site-internet = app PUBLIQUE** → cf. règle `responsive.md` mise à jour 2026-05-02 : tests 5 tailles obligatoires SI changement UX visible. Ici, **aucun changement UX** — la liste produits Vérone reste identique. Test smoke uniquement (1 taille desktop) pour vérifier que la home `/catalogue` affiche bien les produits.

---

## 6. Découpage commits

1. `[BO-BRAND-005] feat: RPC get_site_internet_products supports brand_slug param`
2. `[BO-BRAND-005] chore: regenerate Supabase types`
3. `[BO-BRAND-005] feat: pass 'verone' brand_slug from apps/site-internet hooks`

---

## 7. Validation pré-merge

- [ ] CI verte (type-check + build)
- [ ] Migration testée sur DB staging si possible
- [ ] reviewer-agent PASS
- [ ] Romeo OK pour squash merge

---

## 8. Sprint suivant

**BO-BRAND-006** = créer `apps/bohemia` (copie adaptée de `apps/site-internet`, port dédié, brand_slug 'bohemia' partout).
