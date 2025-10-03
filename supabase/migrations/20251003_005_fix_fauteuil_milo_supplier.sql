-- Migration: Fix Fauteuil Milo Tissu Supplier Assignment
-- Date: 2025-10-03
-- Description: Corriger l'assignation fournisseur des 16 produits "Fauteuil Milo Tissu"
--              FROM: Linhai Newlanston Arts And Crafts
--              TO: Opjet
--              ET corriger le variant_group également

DO $$
DECLARE
  v_opjet_org_id UUID;
  v_opjet_supplier_id UUID;
  v_linhai_org_id UUID;
  v_variant_group_id UUID;
  v_products_updated INTEGER;
BEGIN
  -- Récupérer l'ID d'Opjet dans organisations
  SELECT id INTO v_opjet_org_id
  FROM organisations
  WHERE name = 'Opjet' AND type = 'supplier'
  LIMIT 1;

  IF v_opjet_org_id IS NULL THEN
    RAISE EXCEPTION 'Fournisseur "Opjet" non trouvé dans la table organisations';
  END IF;

  -- Récupérer l'ID d'Opjet dans suppliers
  SELECT id INTO v_opjet_supplier_id
  FROM suppliers
  WHERE name = 'Opjet'
  LIMIT 1;

  IF v_opjet_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Fournisseur "Opjet" non trouvé dans la table suppliers';
  END IF;

  -- Récupérer l'ID de Linhai dans organisations (pour vérification)
  SELECT id INTO v_linhai_org_id
  FROM organisations
  WHERE name = 'Linhai Newlanston Arts And Crafts' AND type = 'supplier'
  LIMIT 1;

  -- Récupérer l'ID du variant_group "Fauteuil Milo Tissu"
  SELECT id INTO v_variant_group_id
  FROM variant_groups
  WHERE name = 'Fauteuil Milo Tissu'
  LIMIT 1;

  IF v_variant_group_id IS NULL THEN
    RAISE EXCEPTION 'Variant group "Fauteuil Milo Tissu" non trouvé';
  END IF;

  -- 1. Mettre à jour le variant_group pour pointer vers Opjet
  UPDATE variant_groups
  SET
    supplier_id = v_opjet_supplier_id,
    updated_at = NOW()
  WHERE id = v_variant_group_id;

  RAISE NOTICE 'Variant group "Fauteuil Milo Tissu" mis à jour: supplier_id = %', v_opjet_supplier_id;

  -- 2. Mettre à jour tous les produits du groupe pour pointer vers Opjet
  UPDATE products
  SET
    supplier_id = v_opjet_org_id,
    updated_at = NOW()
  WHERE variant_group_id = v_variant_group_id
    AND supplier_id = v_linhai_org_id;

  GET DIAGNOSTICS v_products_updated = ROW_COUNT;

  RAISE NOTICE '% produits mis à jour: supplier_id = %', v_products_updated, v_opjet_org_id;

  -- Vérification finale
  IF v_products_updated != 16 THEN
    RAISE WARNING 'Attendu 16 produits mis à jour, mais % ont été modifiés', v_products_updated;
  END IF;

  RAISE NOTICE '✅ Migration terminée avec succès!';
  RAISE NOTICE '   - Variant group: Fauteuil Milo Tissu → Opjet (suppliers table)';
  RAISE NOTICE '   - % produits: Linhai → Opjet (organisations table)', v_products_updated;

END $$;
