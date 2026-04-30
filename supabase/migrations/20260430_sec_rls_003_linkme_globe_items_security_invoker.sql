-- =======================================================================
-- BO-SEC-RLS-003 — `linkme_globe_items` SECURITY DEFINER → security_invoker
-- =======================================================================
-- Date         : 2026-04-30
-- Suite de    : BO-SEC-RLS-002 (#842)
--
-- Cible : la dernière vue SECURITY DEFINER restante (security_definer_view ERROR).
--   `linkme_globe_items` est consommée publiquement par anon sur le site-internet
--   (globe 3D landing page) pour afficher produits + enseignes + organisations
--   indépendantes qui ont opté `show_on_linkme_globe = true`.
--
-- Audit RLS préalable :
--   - `products`        : ✅ policy `Allow anon read products on LinkMe globe`
--                          USING (show_on_linkme_globe = true) — couvre.
--   - `product_images`  : ✅ policy `public_read_product_images` USING true.
--   - `organisations`   : ⚠️ policy `organisations_anon_read_published_enseigne`
--                          couvre seulement les orgs RATTACHÉES À UNE ENSEIGNE.
--                          La vue globe filtre `enseigne_id IS NULL`
--                          (orgs indépendantes) → policy actuelle NE passe PAS.
--   - `enseignes`       : ❌ AUCUNE policy anon (table protégée par défaut).
--
-- Stratégie : ajouter 2 policies anon ciblées (`show_on_linkme_globe = true`
-- + `logo_url IS NOT NULL`) AVANT d'activer `security_invoker = true`.
-- Préserve l'UX globe 3D anon, ferme la `security_definer_view` ERROR.
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. Nouvelle policy anon — `enseignes` affichées sur le globe LinkMe
-- -----------------------------------------------------------------------
-- Rationale : la vue `linkme_globe_items` UNION-projette 3 sources
-- (products / organisations / enseignes). Sans cette policy, anon ne
-- pourra plus voir les enseignes après `security_invoker = true`.
-- Le filtre `show_on_linkme_globe = true` + `logo_url IS NOT NULL`
-- empêche l'énumération des enseignes hors-globe.

CREATE POLICY enseignes_anon_read_linkme_globe
  ON public.enseignes
  FOR SELECT
  TO anon
  USING (show_on_linkme_globe = true AND logo_url IS NOT NULL);

-- -----------------------------------------------------------------------
-- 2. Nouvelle policy anon — `organisations` indépendantes sur le globe
-- -----------------------------------------------------------------------
-- Rationale : couvre les orgs SANS enseigne_id (cas non couvert par la
-- policy existante `organisations_anon_read_published_enseigne` qui
-- demande `enseigne_id IS NOT NULL`). Ajout du filtre `archived_at IS NULL`
-- par cohérence avec les autres policies anon `organisations`.

CREATE POLICY organisations_anon_read_linkme_globe
  ON public.organisations
  FOR SELECT
  TO anon
  USING (
    show_on_linkme_globe = true
    AND logo_url IS NOT NULL
    AND enseigne_id IS NULL
    AND archived_at IS NULL
  );

-- -----------------------------------------------------------------------
-- 3. ALTER VIEW security_invoker = true sur `linkme_globe_items`
-- -----------------------------------------------------------------------
-- Maintenant que les 4 sources de la vue (products / product_images /
-- organisations indépendantes / enseignes) ont des policies SELECT anon
-- qui couvrent les éléments du globe, on peut activer security_invoker
-- sans casser l'affichage public.

ALTER VIEW public.linkme_globe_items SET (security_invoker = true);

COMMIT;
