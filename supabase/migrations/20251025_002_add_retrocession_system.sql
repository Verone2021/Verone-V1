-- ============================================================================
-- Migration: Add Retrocession System (Commission per Order Line)
-- Date: 2025-10-25
-- Author: ÉTAPE 2 - Système Prix B2B Professionnel
--
-- Description:
--   Ajout du système de ristourne (commission) calculée par LIGNE de commande.
--   La ristourne est un pourcentage appliqué sur chaque ligne de produit,
--   permettant de calculer une commission totale par commande en fin d'ordre.
--
-- Business Logic (User Requirements):
--   - Ristourne configurée au niveau customer_pricing (par client/produit)
--   - Ristourne appliquée sur chaque sales_order_items (ligne de commande)
--   - Montant calculé automatiquement: retrocession_amount = total_ht * (retrocession_rate / 100)
--   - Commission totale commande = SUM(retrocession_amount) de toutes les lignes
--
-- Tables impactées:
--   1. customer_pricing      → retrocession_rate (configuration)
--   2. sales_order_items     → retrocession_rate + retrocession_amount (application)
--
-- Colonnes ajoutées: 3
-- ============================================================================

-- ============================================================================
-- SECTION 1: CUSTOMER_PRICING - Configuration Ristourne
-- ============================================================================

-- Ajouter le taux de ristourne à la table customer_pricing
-- Utilisé pour définir le % de commission par client/produit
ALTER TABLE public.customer_pricing
ADD COLUMN IF NOT EXISTS retrocession_rate NUMERIC(5,2) DEFAULT 0.00;

COMMENT ON COLUMN public.customer_pricing.retrocession_rate IS
'Taux de ristourne (commission) en pourcentage applicable sur ce prix client.
Exemple: 5.00 = 5% de commission sur les ventes de ce produit à ce client.
NULL = pas de ristourne, 0.00 = ristourne désactivée explicitement.';

-- Index pour les recherches de tarifs avec ristourne
CREATE INDEX IF NOT EXISTS idx_customer_pricing_retrocession
ON public.customer_pricing(retrocession_rate)
WHERE retrocession_rate IS NOT NULL AND retrocession_rate > 0;

-- ============================================================================
-- SECTION 2: SALES_ORDER_ITEMS - Application Ristourne par Ligne
-- ============================================================================

-- Ajouter le taux de ristourne appliqué à la ligne de commande
-- Copié depuis customer_pricing au moment de la commande
ALTER TABLE public.sales_order_items
ADD COLUMN IF NOT EXISTS retrocession_rate NUMERIC(5,2) DEFAULT 0.00;

COMMENT ON COLUMN public.sales_order_items.retrocession_rate IS
'Taux de ristourne (commission) appliqué sur cette ligne de commande.
Snapshot du taux configuré dans customer_pricing au moment de la commande.
Permet de calculer retrocession_amount = total_ht * (retrocession_rate / 100).';

-- Ajouter le montant de ristourne calculé pour cette ligne
-- Calculé automatiquement via trigger lors de l'insertion/update
ALTER TABLE public.sales_order_items
ADD COLUMN IF NOT EXISTS retrocession_amount NUMERIC(10,2) DEFAULT 0.00;

COMMENT ON COLUMN public.sales_order_items.retrocession_amount IS
'Montant de ristourne (commission) en euros pour cette ligne.
Calculé automatiquement: total_ht * (retrocession_rate / 100).
Commission totale commande = SUM(retrocession_amount) de toutes les lignes.';

-- Index pour les calculs de commission totale par commande
CREATE INDEX IF NOT EXISTS idx_sales_order_items_retrocession
ON public.sales_order_items(sales_order_id, retrocession_amount)
WHERE retrocession_amount IS NOT NULL AND retrocession_amount > 0;

-- ============================================================================
-- SECTION 3: TRIGGER - Calcul Automatique Ristourne
-- ============================================================================

-- Fonction pour calculer automatiquement le montant de ristourne
CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le montant de ristourne si taux > 0
  IF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    NEW.retrocession_amount := ROUND(
      NEW.total_ht * (NEW.retrocession_rate / 100),
      2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_retrocession_amount() IS
'Trigger function: Calcule automatiquement retrocession_amount lors de INSERT/UPDATE sur sales_order_items.
Formule: total_ht * (retrocession_rate / 100), arrondi à 2 décimales.';

-- Créer le trigger sur sales_order_items
DROP TRIGGER IF EXISTS trg_calculate_retrocession ON public.sales_order_items;
CREATE TRIGGER trg_calculate_retrocession
  BEFORE INSERT OR UPDATE OF total_ht, retrocession_rate
  ON public.sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_retrocession_amount();

COMMENT ON TRIGGER trg_calculate_retrocession ON public.sales_order_items IS
'Trigger: Recalcule retrocession_amount automatiquement quand total_ht ou retrocession_rate change.
Assure cohérence des calculs de commission.';

-- ============================================================================
-- SECTION 4: FONCTION UTILITAIRE - Calcul Commission Totale Commande
-- ============================================================================

-- Fonction RPC pour calculer la commission totale d'une commande
CREATE OR REPLACE FUNCTION get_order_total_retrocession(p_order_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_retrocession NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(retrocession_amount), 0.00)
  INTO v_total_retrocession
  FROM sales_order_items
  WHERE sales_order_id = p_order_id;

  RETURN v_total_retrocession;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_order_total_retrocession(UUID) IS
'Calcule la commission totale (ristourne) pour une commande.
Retourne: SUM(retrocession_amount) de toutes les lignes de la commande.
Usage: SELECT get_order_total_retrocession(''uuid-commande'');';

-- ============================================================================
-- SECTION 5: CONTRAINTES & VALIDATION
-- ============================================================================

-- Contrainte: Taux de ristourne entre 0 et 100%
ALTER TABLE public.customer_pricing
ADD CONSTRAINT chk_retrocession_rate_range
CHECK (retrocession_rate IS NULL OR (retrocession_rate >= 0 AND retrocession_rate <= 100));

ALTER TABLE public.sales_order_items
ADD CONSTRAINT chk_retrocession_rate_range
CHECK (retrocession_rate IS NULL OR (retrocession_rate >= 0 AND retrocession_rate <= 100));

-- Contrainte: Montant de ristourne >= 0
ALTER TABLE public.sales_order_items
ADD CONSTRAINT chk_retrocession_amount_positive
CHECK (retrocession_amount IS NULL OR retrocession_amount >= 0);

-- ============================================================================
-- VERIFICATION POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_customer_pricing_cols INTEGER;
  v_sales_order_items_cols INTEGER;
BEGIN
  -- Vérifier ajout colonnes customer_pricing
  SELECT COUNT(*)
  INTO v_customer_pricing_cols
  FROM information_schema.columns
  WHERE table_name = 'customer_pricing'
  AND column_name = 'retrocession_rate';

  -- Vérifier ajout colonnes sales_order_items
  SELECT COUNT(*)
  INTO v_sales_order_items_cols
  FROM information_schema.columns
  WHERE table_name = 'sales_order_items'
  AND column_name IN ('retrocession_rate', 'retrocession_amount');

  RAISE NOTICE 'Migration complétée avec succès.';
  RAISE NOTICE 'customer_pricing.retrocession_rate: % colonne(s) ajoutée(s)', v_customer_pricing_cols;
  RAISE NOTICE 'sales_order_items retrocession cols: % colonne(s) ajoutée(s)', v_sales_order_items_cols;
  RAISE NOTICE 'Trigger calculate_retrocession_amount créé.';
  RAISE NOTICE 'Fonction get_order_total_retrocession() créée.';

  IF v_customer_pricing_cols = 0 OR v_sales_order_items_cols < 2 THEN
    RAISE EXCEPTION 'Erreur: Colonnes ristourne non créées correctement';
  END IF;
END $$;

-- ============================================================================
-- NOTES POST-MIGRATION
-- ============================================================================

-- TODO APRES CETTE MIGRATION:
-- 1. Régénérer les types TypeScript:
--    supabase gen types typescript --local > src/types/supabase.ts
--
-- 2. Tester le trigger de calcul automatique:
--    INSERT INTO sales_order_items (..., total_ht, retrocession_rate)
--    VALUES (..., 1000.00, 5.00);
--    -- Devrait créer retrocession_amount = 50.00
--
-- 3. Tester la fonction RPC:
--    SELECT get_order_total_retrocession('uuid-commande');
--
-- 4. Vérifier le build: npm run build
--
-- 5. Commit: "feat(pricing): add B2B retrocession system (commission per line)"

-- BUSINESS RULES IMPLEMENTED:
-- ✅ Ristourne configurée au niveau customer_pricing
-- ✅ Ristourne appliquée par ligne de commande
-- ✅ Calcul automatique du montant via trigger
-- ✅ Fonction RPC pour commission totale commande
-- ✅ Contraintes de validation (0-100%, montants positifs)

-- NEXT STEPS (ÉTAPE 3-6):
-- → ÉTAPE 3: Créer page Prix Clients MVP (/canaux-vente/prix-clients)
-- → ÉTAPE 4: UI Gestion Conditionnement Avancé
-- → ÉTAPE 5: Compléter calculs automatiques (RPC + triggers)
-- → ÉTAPE 6: Dashboard & Analytics Prix Clients

-- ============================================================================
