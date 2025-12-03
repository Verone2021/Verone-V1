-- ============================================================================
-- Migration: Trigger validation produits exclusifs par enseigne
-- Date: 2025-12-02
-- Description: Empêche l'ajout d'un produit avec enseigne_id différente dans une sélection LinkMe
-- Règle métier: Un produit d'une enseigne ne peut être utilisé QUE par cette enseigne
-- ============================================================================

-- Fonction de validation
CREATE OR REPLACE FUNCTION validate_enseigne_product_selection()
RETURNS TRIGGER AS $$
DECLARE
  v_product_enseigne_id UUID;
  v_affiliate_enseigne_id UUID;
  v_enseigne_name TEXT;
BEGIN
  -- Récupérer l'enseigne du produit
  SELECT enseigne_id INTO v_product_enseigne_id
  FROM products WHERE id = NEW.product_id;

  -- Si produit n'a pas d'enseigne → OK (produit catalogue général)
  IF v_product_enseigne_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer l'enseigne de l'affilié via la sélection
  SELECT a.enseigne_id INTO v_affiliate_enseigne_id
  FROM linkme_selections s
  JOIN linkme_affiliates a ON s.affiliate_id = a.id
  WHERE s.id = NEW.selection_id;

  -- Si affilié n'a pas d'enseigne → Bloquer (produit exclusif ne peut pas être utilisé)
  IF v_affiliate_enseigne_id IS NULL THEN
    SELECT name INTO v_enseigne_name FROM enseignes WHERE id = v_product_enseigne_id;
    RAISE EXCEPTION 'Ce produit appartient exclusivement à l''enseigne "%" et ne peut pas être ajouté à une sélection sans enseigne.',
      v_enseigne_name;
  END IF;

  -- Si les enseignes diffèrent → Bloquer
  IF v_product_enseigne_id != v_affiliate_enseigne_id THEN
    SELECT name INTO v_enseigne_name FROM enseignes WHERE id = v_product_enseigne_id;
    RAISE EXCEPTION 'Ce produit appartient exclusivement à l''enseigne "%" et ne peut pas être ajouté à une sélection d''une autre enseigne.',
      v_enseigne_name;
  END IF;

  -- OK: même enseigne
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Commentaire fonction
COMMENT ON FUNCTION validate_enseigne_product_selection() IS
'Valide que les produits avec enseigne_id ne peuvent être ajoutés qu''aux sélections de la même enseigne.
Règle métier LinkMe: Produits sourcés pour une enseigne = exclusifs à cette enseigne.
Ajouté: 2025-12-02';

-- Trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS check_enseigne_product_selection ON linkme_selection_items;

CREATE TRIGGER check_enseigne_product_selection
BEFORE INSERT OR UPDATE ON linkme_selection_items
FOR EACH ROW
EXECUTE FUNCTION validate_enseigne_product_selection();

-- Commentaire trigger
COMMENT ON TRIGGER check_enseigne_product_selection ON linkme_selection_items IS
'Trigger validation exclusivité produits par enseigne LinkMe. Empêche ajout produit enseigne A dans sélection enseigne B.';
