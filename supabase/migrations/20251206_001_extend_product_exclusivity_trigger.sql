-- ============================================================================
-- Migration: Étendre la validation produits exclusifs pour assigned_client_id
-- Date: 2025-12-06
-- Description: Ajoute la validation pour les produits assignés à une organisation
-- Règle métier: Un produit avec assigned_client_id = exclusif à cette organisation
-- ============================================================================

-- Fonction de validation étendue (remplace la précédente)
CREATE OR REPLACE FUNCTION validate_enseigne_product_selection()
RETURNS TRIGGER AS $$
DECLARE
  v_product_enseigne_id UUID;
  v_product_assigned_client_id UUID;
  v_affiliate_enseigne_id UUID;
  v_affiliate_organisation_id UUID;
  v_enseigne_name TEXT;
  v_org_name TEXT;
BEGIN
  -- Récupérer l'enseigne ET assigned_client du produit
  SELECT enseigne_id, assigned_client_id
  INTO v_product_enseigne_id, v_product_assigned_client_id
  FROM products WHERE id = NEW.product_id;

  -- Si produit n'a pas d'attribution exclusive → OK (produit catalogue général)
  IF v_product_enseigne_id IS NULL AND v_product_assigned_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'enseigne ET organisation de l'affilié via la sélection
  SELECT a.enseigne_id, a.organisation_id
  INTO v_affiliate_enseigne_id, v_affiliate_organisation_id
  FROM linkme_selections s
  JOIN linkme_affiliates a ON s.affiliate_id = a.id
  WHERE s.id = NEW.selection_id;

  -- ========================================
  -- CASE 1: Produit exclusif à une enseigne
  -- ========================================
  IF v_product_enseigne_id IS NOT NULL THEN
    -- Si affilié n'a pas d'enseigne → Bloquer
    IF v_affiliate_enseigne_id IS NULL THEN
      SELECT name INTO v_enseigne_name FROM enseignes WHERE id = v_product_enseigne_id;
      RAISE EXCEPTION 'Ce produit sur mesure appartient à l''enseigne "%" et ne peut pas être ajouté à votre sélection.',
        v_enseigne_name;
    END IF;

    -- Si les enseignes diffèrent → Bloquer
    IF v_product_enseigne_id != v_affiliate_enseigne_id THEN
      SELECT name INTO v_enseigne_name FROM enseignes WHERE id = v_product_enseigne_id;
      RAISE EXCEPTION 'Ce produit sur mesure appartient à l''enseigne "%" et ne peut pas être ajouté à une sélection d''une autre enseigne.',
        v_enseigne_name;
    END IF;

    -- OK: même enseigne
    RETURN NEW;
  END IF;

  -- ========================================
  -- CASE 2: Produit exclusif à une organisation (org_independante)
  -- ========================================
  IF v_product_assigned_client_id IS NOT NULL THEN
    -- Si affilié n'a pas d'organisation → Bloquer
    IF v_affiliate_organisation_id IS NULL THEN
      SELECT COALESCE(trade_name, legal_name) INTO v_org_name
      FROM organisations WHERE id = v_product_assigned_client_id;
      RAISE EXCEPTION 'Ce produit sur mesure appartient à l''organisation "%" et ne peut pas être ajouté à votre sélection.',
        v_org_name;
    END IF;

    -- Si les organisations diffèrent → Bloquer
    IF v_product_assigned_client_id != v_affiliate_organisation_id THEN
      SELECT COALESCE(trade_name, legal_name) INTO v_org_name
      FROM organisations WHERE id = v_product_assigned_client_id;
      RAISE EXCEPTION 'Ce produit sur mesure appartient à l''organisation "%" et ne peut pas être ajouté à une sélection d''une autre organisation.',
        v_org_name;
    END IF;
  END IF;

  -- OK: attribution correcte
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Commentaire fonction mis à jour
COMMENT ON FUNCTION validate_enseigne_product_selection() IS
'Valide que les produits avec enseigne_id ou assigned_client_id (produits sur mesure)
ne peuvent être ajoutés qu''aux sélections de la même enseigne ou organisation.
Règle métier LinkMe: Produits sourcés = exclusifs à leur client assigné.
Créé: 2025-12-02 | Étendu: 2025-12-06 (ajout assigned_client_id)';

-- Le trigger existe déjà, pas besoin de le recréer
-- Il utilise automatiquement la nouvelle version de la fonction
