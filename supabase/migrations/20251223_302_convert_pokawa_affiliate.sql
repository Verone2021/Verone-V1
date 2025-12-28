-- ============================================================================
-- Migration: Conversion des produits Pokawa en produits affiliés
-- Date: 2025-12-23
-- Description: Marquer "Poubelle à POKAWA" et "Meuble TABESTO à POKAWA" comme
--              produits d'affilié avec commission Vérone 15%
-- Modèle économique:
--   - Commission Vérone: 15% FIXE
--   - Prix de vente: VARIABLE (peut changer d'une commande à l'autre)
--   - Payout affilié = Prix × (1 - 0.15)
-- ============================================================================

BEGIN;

-- Variables pour stocker les IDs
DO $$
DECLARE
  v_pokawa_enseigne_id UUID;
  v_pokawa_affiliate_id UUID;
  v_products_updated INTEGER;
  v_product_names TEXT[];
BEGIN
  -- 1. Trouver l'enseigne Pokawa
  SELECT id INTO v_pokawa_enseigne_id
  FROM enseignes
  WHERE name ILIKE '%pokawa%' OR legal_name ILIKE '%pokawa%'
  LIMIT 1;

  IF v_pokawa_enseigne_id IS NULL THEN
    RAISE EXCEPTION 'Enseigne Pokawa non trouvée! Veuillez créer l''enseigne d''abord.';
  END IF;

  RAISE NOTICE 'Enseigne Pokawa trouvée: %', v_pokawa_enseigne_id;

  -- 2. Trouver ou créer le profil affilié LinkMe pour Pokawa
  SELECT id INTO v_pokawa_affiliate_id
  FROM linkme_affiliates
  WHERE enseigne_id = v_pokawa_enseigne_id
  LIMIT 1;

  IF v_pokawa_affiliate_id IS NULL THEN
    -- Créer le profil affilié s'il n'existe pas
    INSERT INTO linkme_affiliates (
      enseigne_id,
      display_name,
      slug,
      status,
      default_margin_rate,
      linkme_commission_rate
    )
    SELECT
      v_pokawa_enseigne_id,
      COALESCE(e.name, 'Pokawa'),
      LOWER(REGEXP_REPLACE(COALESCE(e.name, 'pokawa'), '[^a-zA-Z0-9]', '-', 'g')),
      'active',
      15.00,  -- Marge par défaut
      5.00    -- Commission LinkMe standard
    FROM enseignes e
    WHERE e.id = v_pokawa_enseigne_id
    RETURNING id INTO v_pokawa_affiliate_id;

    RAISE NOTICE 'Profil affilié LinkMe créé: %', v_pokawa_affiliate_id;
  ELSE
    RAISE NOTICE 'Profil affilié LinkMe existant: %', v_pokawa_affiliate_id;
  END IF;

  -- 3. Lister les produits Pokawa avant mise à jour
  SELECT ARRAY_AGG(name) INTO v_product_names
  FROM products
  WHERE name ILIKE '%pokawa%';

  RAISE NOTICE 'Produits Pokawa trouvés: %', v_product_names;

  -- 4. Convertir les produits Pokawa en produits affiliés
  UPDATE products
  SET
    created_by_affiliate = v_pokawa_affiliate_id,
    affiliate_approval_status = 'approved',
    affiliate_payout_ht = NULL,  -- Pas de payout fixe, calculé à la commande
    affiliate_commission_rate = 15.00,  -- 15% FIXE pour Vérone
    affiliate_approved_at = NOW()
  WHERE name ILIKE '%pokawa%'
    AND created_by_affiliate IS NULL;  -- Ne pas écraser si déjà configuré

  GET DIAGNOSTICS v_products_updated = ROW_COUNT;

  RAISE NOTICE '=== RÉSULTAT ===';
  RAISE NOTICE 'Produits convertis en affiliés: %', v_products_updated;
  RAISE NOTICE 'Commission Vérone configurée: 15%%';
END $$;

-- Vérification finale
DO $$
DECLARE
  v_check RECORD;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION ===';
  FOR v_check IN
    SELECT
      p.id,
      p.name,
      p.affiliate_commission_rate,
      la.display_name as affiliate_name
    FROM products p
    LEFT JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
    WHERE p.name ILIKE '%pokawa%'
  LOOP
    RAISE NOTICE 'Produit: % | Commission: %%% | Affilié: %',
      v_check.name,
      v_check.affiliate_commission_rate,
      v_check.affiliate_name;
  END LOOP;
END $$;

COMMIT;
