-- Migration: Import Fauteuil Milo Tissu - 16 variants complets
-- Date: 2025-10-03
-- Description: Import du variant group "Fauteuil Milo Tissu" avec tous les 16 variants depuis Airtable
--              Produits 101-105 et 115-125

DO $$
DECLARE
  v_variant_group_id UUID;
  v_subcategory_id UUID;
  v_supplier_id_suppliers UUID;  -- Pour variant_groups (référence suppliers)
  v_supplier_id_organisations UUID;  -- Pour products (référence organisations)
BEGIN
  -- Récupérer l'ID de la sous-catégorie "Fauteuil"
  SELECT id INTO v_subcategory_id
  FROM subcategories
  WHERE name = 'Fauteuil'
  LIMIT 1;

  IF v_subcategory_id IS NULL THEN
    RAISE EXCEPTION 'Sous-catégorie "Fauteuil" non trouvée';
  END IF;

  -- Récupérer l'ID du fournisseur depuis la table suppliers (pour variant_groups)
  SELECT id INTO v_supplier_id_suppliers
  FROM suppliers
  WHERE name = 'Linhai Newlanston Arts And Crafts'
  LIMIT 1;

  IF v_supplier_id_suppliers IS NULL THEN
    RAISE EXCEPTION 'Fournisseur "Linhai Newlanston Arts And Crafts" non trouvé dans la table suppliers';
  END IF;

  -- Récupérer l'ID du fournisseur depuis la table organisations (pour products)
  SELECT id INTO v_supplier_id_organisations
  FROM organisations
  WHERE name = 'Linhai Newlanston Arts And Crafts' AND type = 'supplier'
  LIMIT 1;

  IF v_supplier_id_organisations IS NULL THEN
    RAISE EXCEPTION 'Fournisseur "Linhai Newlanston Arts And Crafts" non trouvé dans la table organisations';
  END IF;

  -- Créer le variant group
  INSERT INTO variant_groups (
    name,
    base_sku,
    subcategory_id,
    variant_type,
    common_dimensions,
    common_weight,
    suitable_rooms,
    supplier_id,
    has_common_supplier,
    auto_name_pattern,
    product_count,
    created_at,
    updated_at
  ) VALUES (
    'Fauteuil Milo Tissu',
    'MILO-TISSU',
    v_subcategory_id,
    'color',
    '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
    8.0,
    ARRAY['chambre', 'salon', 'bureau']::room_type[],
    v_supplier_id_suppliers,  -- Utilise l'ID depuis suppliers
    true,
    '{name} - {color}',
    16,
    NOW(),
    NOW()
  ) RETURNING id INTO v_variant_group_id;

  -- Insérer les 16 variants
  -- Produits 101-105 (5 variants)
  INSERT INTO products (
    name, sku, cost_price, variant_group_id, variant_position,
    variant_attributes, dimensions, weight, suitable_rooms,
    subcategory_id, supplier_id, creation_mode, created_at, updated_at
  ) VALUES
    -- 1. Beige
    (
      'Fauteuil Milo Tissu - Beige',
      'MILO-TISSU-BEIGE',
      150.00,
      v_variant_group_id,
      1,
      '{"color": "Beige"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 2. Violet
    (
      'Fauteuil Milo Tissu - Violet',
      'MILO-TISSU-VIOLET',
      150.00,
      v_variant_group_id,
      2,
      '{"color": "Violet"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 3. Marron
    (
      'Fauteuil Milo Tissu - Marron',
      'MILO-TISSU-MARRON',
      150.00,
      v_variant_group_id,
      3,
      '{"color": "Marron"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 4. Ocre
    (
      'Fauteuil Milo Tissu - Ocre',
      'MILO-TISSU-OCRE',
      150.00,
      v_variant_group_id,
      4,
      '{"color": "Ocre"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 5. Vert
    (
      'Fauteuil Milo Tissu - Vert',
      'MILO-TISSU-VERT',
      150.00,
      v_variant_group_id,
      5,
      '{"color": "Vert"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- Produits 115-125 (11 variants)
    -- 6. Jaune
    (
      'Fauteuil Milo Tissu - Jaune',
      'MILO-TISSU-JAUNE',
      150.00,
      v_variant_group_id,
      6,
      '{"color": "Jaune"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 7. Caramel
    (
      'Fauteuil Milo Tissu - Caramel',
      'MILO-TISSU-CARAMEL',
      150.00,
      v_variant_group_id,
      7,
      '{"color": "Caramel"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 8. Rose Poudré
    (
      'Fauteuil Milo Tissu - Rose Poudré',
      'MILO-TISSU-ROSE-POUDRE',
      150.00,
      v_variant_group_id,
      8,
      '{"color": "Rose Poudré"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 9. Bleu Indigo
    (
      'Fauteuil Milo Tissu - Bleu Indigo',
      'MILO-TISSU-BLEU-INDIGO',
      150.00,
      v_variant_group_id,
      9,
      '{"color": "Bleu Indigo"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 10. Rouille
    (
      'Fauteuil Milo Tissu - Rouille',
      'MILO-TISSU-ROUILLE',
      150.00,
      v_variant_group_id,
      10,
      '{"color": "Rouille"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 11. Vert Foncé
    (
      'Fauteuil Milo Tissu - Vert Foncé',
      'MILO-TISSU-VERT-FONCE',
      150.00,
      v_variant_group_id,
      11,
      '{"color": "Vert Foncé"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 12. Naturel (Doudou)
    (
      'Fauteuil Milo Tissu - Naturel',
      'MILO-TISSU-NATUREL',
      150.00,
      v_variant_group_id,
      12,
      '{"color": "Naturel"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 13. Orange
    (
      'Fauteuil Milo Tissu - Orange',
      'MILO-TISSU-ORANGE',
      150.00,
      v_variant_group_id,
      13,
      '{"color": "Orange"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 14. Kaki
    (
      'Fauteuil Milo Tissu - Kaki',
      'MILO-TISSU-KAKI',
      150.00,
      v_variant_group_id,
      14,
      '{"color": "Kaki"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 15. Bleu
    (
      'Fauteuil Milo Tissu - Bleu',
      'MILO-TISSU-BLEU',
      150.00,
      v_variant_group_id,
      15,
      '{"color": "Bleu"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    ),
    -- 16. Bleu Vert Doux
    (
      'Fauteuil Milo Tissu - Bleu Vert Doux',
      'MILO-TISSU-BLEU-VERT-DOUX',
      150.00,
      v_variant_group_id,
      16,
      '{"color": "Bleu Vert Doux"}',
      '{"length_cm": 58, "width_cm": 73, "height_cm": 71}',
      8.0,
      ARRAY['chambre', 'salon', 'bureau']::room_type[],
      v_subcategory_id,
      v_supplier_id_organisations,  -- Utilise l'ID depuis organisations
      'complete',
      NOW(),
      NOW()
    );

  RAISE NOTICE 'Variant group "Fauteuil Milo Tissu" créé avec 16 variants';
END $$;
