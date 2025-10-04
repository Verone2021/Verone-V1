-- Migration: Import des 7 fournisseurs depuis Airtable
-- Date: 2025-10-03
-- Description: Import des vrais fournisseurs depuis la base Airtable

-- Nettoyage des données de test existantes
-- Vérifier d'abord qu'il n'y a pas de produits liés
DO $$
BEGIN
  -- Supprimer uniquement les organisations de type 'supplier' sans produits liés
  DELETE FROM organisations
  WHERE type = 'supplier'
    AND NOT EXISTS (
      SELECT 1 FROM products WHERE products.supplier_id = organisations.id
    );
END $$;

-- Insertion des 7 fournisseurs réels depuis Airtable
-- Vérifier d'abord si le fournisseur existe déjà avant d'insérer
DO $$
DECLARE
  v_supplier_name TEXT;
  v_supplier_website TEXT;
  v_count INTEGER;
BEGIN
  -- 1. Linhai Newlanston Arts And Crafts (Textil)
  v_supplier_name := 'Linhai Newlanston Arts And Crafts';
  v_supplier_website := 'https://cnnewlanston.en.alibaba.com/minisiteentrance.html';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;

  -- 2. Maisons Nomades (Decoration)
  v_supplier_name := 'Maisons Nomades';
  v_supplier_website := 'https://maisonsnomades.com';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;

  -- 3. Madeiragueda (Mobilier)
  v_supplier_name := 'Madeiragueda';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', NULL, true, NOW(), NOW());
  END IF;

  -- 4. DSA Menuiserie (Mobilier)
  v_supplier_name := 'DSA Menuiserie';
  v_supplier_website := 'https://dsamenuiserie.fr';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;

  -- 5. Yunnan Yeqiu Technology Co (Plantes)
  v_supplier_name := 'Yunnan Yeqiu Technology Co';
  v_supplier_website := 'https://yeqiu.en.alibaba.com';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;

  -- 6. Opjet (Decoration) - Fournisseur principal des Fauteuils Milo
  v_supplier_name := 'Opjet';
  v_supplier_website := 'https://www.opjet.com';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;

  -- 7. Lecomptoir (Decoration)
  v_supplier_name := 'Lecomptoir';
  v_supplier_website := 'https://www.lecomptoir.com';
  SELECT COUNT(*) INTO v_count FROM organisations WHERE name = v_supplier_name;
  IF v_count = 0 THEN
    INSERT INTO organisations (name, type, website, is_active, created_at, updated_at)
    VALUES (v_supplier_name, 'supplier', v_supplier_website, true, NOW(), NOW());
  END IF;
END $$;

-- Vérification du résultat
DO $$
DECLARE
  supplier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO supplier_count FROM organisations WHERE type = 'supplier';
  RAISE NOTICE 'Nombre de fournisseurs importés : %', supplier_count;
END $$;
