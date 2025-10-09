-- =====================================================================
-- Migration: Price Calculation Function V2 - Waterfall Resolution
-- =====================================================================
-- Date: 2025-10-10
-- Version: 2.0.0
-- Auteur: Claude Code - Vérone Back Office
--
-- Description:
-- Nouvelle fonction calcul prix avec waterfall resolution:
-- 1. Prix contrat client spécifique
-- 2. Prix groupe client (B2B Gold, VIP, etc.)
-- 3. Prix canal de vente
-- 4. Prix catalogue base (fallback)
-- Support paliers quantités, dates validité, priorités
-- =====================================================================

-- =====================================================================
-- 1. FONCTION HELPER: get_applicable_price_lists
-- =====================================================================
-- Récupère toutes les listes de prix applicables pour un contexte

CREATE OR REPLACE FUNCTION get_applicable_price_lists(
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  price_list_id UUID,
  list_type VARCHAR,
  priority INTEGER,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH all_lists AS (
    -- 1. Listes client spécifique (plus haute priorité)
    SELECT DISTINCT
      cpl.price_list_id,
      pl.list_type,
      COALESCE(cpl.priority, pl.priority) as priority,
      'customer_specific'::VARCHAR as source
    FROM customer_price_lists cpl
    JOIN price_lists pl ON cpl.price_list_id = pl.id
    WHERE p_customer_id IS NOT NULL
      AND p_customer_type IS NOT NULL
      AND cpl.customer_id = p_customer_id
      AND cpl.customer_type = p_customer_type
      AND cpl.is_active = TRUE
      AND pl.is_active = TRUE
      AND (pl.valid_from IS NULL OR pl.valid_from <= p_date)
      AND (pl.valid_until IS NULL OR pl.valid_until >= p_date)
      AND (cpl.valid_from IS NULL OR cpl.valid_from <= p_date)
      AND (cpl.valid_until IS NULL OR cpl.valid_until >= p_date)

    UNION ALL

    -- 2. Listes groupe client
    SELECT DISTINCT
      gpl.price_list_id,
      pl.list_type,
      COALESCE(gpl.priority, pl.priority) as priority,
      'customer_group'::VARCHAR as source
    FROM customer_group_members cgm
    JOIN group_price_lists gpl ON cgm.group_id = gpl.group_id
    JOIN price_lists pl ON gpl.price_list_id = pl.id
    WHERE p_customer_id IS NOT NULL
      AND p_customer_type IS NOT NULL
      AND cgm.customer_id = p_customer_id
      AND cgm.customer_type = p_customer_type
      AND cgm.is_active = TRUE
      AND gpl.is_active = TRUE
      AND pl.is_active = TRUE
      AND (pl.valid_from IS NULL OR pl.valid_from <= p_date)
      AND (pl.valid_until IS NULL OR pl.valid_until >= p_date)
      AND (gpl.valid_from IS NULL OR gpl.valid_from <= p_date)
      AND (gpl.valid_until IS NULL OR gpl.valid_until >= p_date)

    UNION ALL

    -- 3. Listes canal de vente
    SELECT DISTINCT
      chpl.price_list_id,
      pl.list_type,
      COALESCE(chpl.priority, pl.priority) as priority,
      'channel'::VARCHAR as source
    FROM channel_price_lists chpl
    JOIN price_lists pl ON chpl.price_list_id = pl.id
    WHERE p_channel_id IS NOT NULL
      AND chpl.channel_id = p_channel_id
      AND chpl.is_active = TRUE
      AND pl.is_active = TRUE
      AND (pl.valid_from IS NULL OR pl.valid_from <= p_date)
      AND (pl.valid_until IS NULL OR pl.valid_until >= p_date)
      AND (chpl.valid_from IS NULL OR chpl.valid_from <= p_date)
      AND (chpl.valid_until IS NULL OR chpl.valid_until >= p_date)

    UNION ALL

    -- 4. Liste base catalogue (fallback)
    SELECT
      pl.id as price_list_id,
      pl.list_type,
      pl.priority,
      'base_catalog'::VARCHAR as source
    FROM price_lists pl
    WHERE pl.list_type = 'base'
      AND pl.is_active = TRUE
      AND (pl.valid_from IS NULL OR pl.valid_from <= p_date)
      AND (pl.valid_until IS NULL OR pl.valid_until >= p_date)
  )
  SELECT DISTINCT ON (al.price_list_id)
    al.price_list_id,
    al.list_type,
    al.priority,
    al.source
  FROM all_lists al
  ORDER BY al.price_list_id, al.priority ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- 2. FONCTION PRINCIPALE: calculate_product_price_v2
-- =====================================================================
-- Calcule prix optimal selon waterfall resolution

CREATE OR REPLACE FUNCTION calculate_product_price_v2(
  p_product_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  price_ht DECIMAL(12,2),
  original_price DECIMAL(12,2),
  discount_rate DECIMAL(5,4),
  price_list_id UUID,
  price_list_name VARCHAR,
  price_source VARCHAR,
  min_quantity INTEGER,
  max_quantity INTEGER,
  currency VARCHAR(3),
  margin_rate DECIMAL(5,4),
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH applicable_lists AS (
    -- Récupérer toutes les listes applicables
    SELECT * FROM get_applicable_price_lists(
      p_channel_id,
      p_customer_id,
      p_customer_type,
      p_date
    )
  ),
  prices_with_priority AS (
    -- Joindre avec les items de prix correspondants
    SELECT
      pli.price_ht,
      pli.price_ht as original_price_value,
      pli.discount_rate,
      pli.price_list_id,
      pl.name as price_list_name,
      al.source as price_source,
      pli.min_quantity,
      pli.max_quantity,
      COALESCE(pli.currency, pl.currency, 'EUR') as currency,
      pli.margin_rate,
      pli.notes,
      al.priority,
      -- Calculer score pour tri (priorité + compatibilité quantité)
      al.priority +
      CASE
        WHEN pli.min_quantity <= p_quantity
          AND (pli.max_quantity IS NULL OR pli.max_quantity >= p_quantity)
        THEN 0
        ELSE 10000 -- Pénalité si quantité incompatible
      END as sort_score
    FROM applicable_lists al
    JOIN price_list_items pli ON al.price_list_id = pli.price_list_id
    JOIN price_lists pl ON pli.price_list_id = pl.id
    WHERE pli.product_id = p_product_id
      AND pli.is_active = TRUE
      AND pli.min_quantity <= p_quantity
      AND (pli.max_quantity IS NULL OR pli.max_quantity >= p_quantity)
      AND (pli.valid_from IS NULL OR pli.valid_from <= p_date)
      AND (pli.valid_until IS NULL OR pli.valid_until >= p_date)
  )
  -- Sélectionner le meilleur prix (priorité la plus basse)
  SELECT
    pwp.price_ht,
    pwp.original_price_value,
    pwp.discount_rate,
    pwp.price_list_id,
    pwp.price_list_name,
    pwp.price_source,
    pwp.min_quantity,
    pwp.max_quantity,
    pwp.currency,
    pwp.margin_rate,
    pwp.notes
  FROM prices_with_priority pwp
  ORDER BY pwp.sort_score ASC, pwp.price_ht ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_product_price_v2 IS
  'Calcule le prix optimal pour un produit selon waterfall resolution avec support quantités et multi-contextes';

-- =====================================================================
-- 3. FONCTION BATCH: calculate_batch_prices_v2
-- =====================================================================
-- Calcul optimisé pour plusieurs produits

CREATE OR REPLACE FUNCTION calculate_batch_prices_v2(
  p_product_ids UUID[],
  p_quantity INTEGER DEFAULT 1,
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  product_id UUID,
  price_ht DECIMAL(12,2),
  original_price DECIMAL(12,2),
  discount_rate DECIMAL(5,4),
  price_list_id UUID,
  price_list_name VARCHAR,
  price_source VARCHAR,
  min_quantity INTEGER,
  max_quantity INTEGER,
  currency VARCHAR(3)
) AS $$
BEGIN
  RETURN QUERY
  WITH applicable_lists AS (
    SELECT * FROM get_applicable_price_lists(
      p_channel_id,
      p_customer_id,
      p_customer_type,
      p_date
    )
  ),
  batch_prices AS (
    SELECT DISTINCT ON (pli.product_id)
      pli.product_id,
      pli.price_ht,
      pli.price_ht as original_price_value,
      pli.discount_rate,
      pli.price_list_id,
      pl.name as price_list_name,
      al.source as price_source,
      pli.min_quantity,
      pli.max_quantity,
      COALESCE(pli.currency, pl.currency, 'EUR') as currency,
      al.priority +
      CASE
        WHEN pli.min_quantity <= p_quantity
          AND (pli.max_quantity IS NULL OR pli.max_quantity >= p_quantity)
        THEN 0
        ELSE 10000
      END as sort_score
    FROM applicable_lists al
    JOIN price_list_items pli ON al.price_list_id = pli.price_list_id
    JOIN price_lists pl ON pli.price_list_id = pl.id
    WHERE pli.product_id = ANY(p_product_ids)
      AND pli.is_active = TRUE
      AND pli.min_quantity <= p_quantity
      AND (pli.max_quantity IS NULL OR pli.max_quantity >= p_quantity)
      AND (pli.valid_from IS NULL OR pli.valid_from <= p_date)
      AND (pli.valid_until IS NULL OR pli.valid_until >= p_date)
    ORDER BY pli.product_id, sort_score ASC, pli.price_ht ASC
  )
  SELECT
    bp.product_id,
    bp.price_ht,
    bp.original_price_value,
    bp.discount_rate,
    bp.price_list_id,
    bp.price_list_name,
    bp.price_source,
    bp.min_quantity,
    bp.max_quantity,
    bp.currency
  FROM batch_prices bp;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- 4. FONCTION: get_quantity_breaks
-- =====================================================================
-- Récupère tous les paliers de prix pour un produit

CREATE OR REPLACE FUNCTION get_quantity_breaks(
  p_product_id UUID,
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  min_quantity INTEGER,
  max_quantity INTEGER,
  price_ht DECIMAL(12,2),
  discount_rate DECIMAL(5,4),
  price_list_name VARCHAR,
  savings_amount DECIMAL(12,2),
  savings_percent DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH applicable_lists AS (
    SELECT * FROM get_applicable_price_lists(
      p_channel_id,
      p_customer_id,
      p_customer_type,
      p_date
    )
  ),
  all_breaks AS (
    SELECT DISTINCT
      pli.min_quantity,
      pli.max_quantity,
      pli.price_ht,
      pli.discount_rate,
      pl.name as price_list_name,
      al.priority
    FROM applicable_lists al
    JOIN price_list_items pli ON al.price_list_id = pli.price_list_id
    JOIN price_lists pl ON pli.price_list_id = pl.id
    WHERE pli.product_id = p_product_id
      AND pli.is_active = TRUE
      AND (pli.valid_from IS NULL OR pli.valid_from <= p_date)
      AND (pli.valid_until IS NULL OR pli.valid_until >= p_date)
  ),
  ranked_breaks AS (
    SELECT
      ab.*,
      ROW_NUMBER() OVER (
        PARTITION BY ab.min_quantity
        ORDER BY ab.priority ASC, ab.price_ht ASC
      ) as rn
    FROM all_breaks ab
  ),
  final_breaks AS (
    SELECT
      rb.min_quantity,
      rb.max_quantity,
      rb.price_ht,
      rb.discount_rate,
      rb.price_list_name,
      FIRST_VALUE(rb.price_ht) OVER (ORDER BY rb.min_quantity) as base_price
    FROM ranked_breaks rb
    WHERE rb.rn = 1
  )
  SELECT
    fb.min_quantity,
    fb.max_quantity,
    fb.price_ht,
    fb.discount_rate,
    fb.price_list_name,
    (fb.base_price - fb.price_ht) * fb.min_quantity as savings_amount,
    CASE
      WHEN fb.base_price > 0
      THEN ROUND(((fb.base_price - fb.price_ht) / fb.base_price * 100)::NUMERIC, 2)
      ELSE 0
    END as savings_percent
  FROM final_breaks fb
  ORDER BY fb.min_quantity;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_quantity_breaks IS
  'Récupère tous les paliers de quantité disponibles pour un produit dans un contexte donné';

-- =====================================================================
-- 5. FONCTION: calculate_order_line_price
-- =====================================================================
-- Calcule prix ligne commande avec RFA optionnel

CREATE OR REPLACE FUNCTION calculate_order_line_price(
  p_product_id UUID,
  p_quantity INTEGER,
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_rfa_discount DECIMAL(5,4) DEFAULT 0,  -- Remise Fin d'Affaire
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  unit_price_ht DECIMAL(12,2),
  line_total_ht DECIMAL(12,2),
  line_total_after_rfa DECIMAL(12,2),
  total_discount_rate DECIMAL(5,4),
  price_list_name VARCHAR,
  price_source VARCHAR,
  currency VARCHAR(3)
) AS $$
DECLARE
  v_price_record RECORD;
BEGIN
  -- Récupérer le prix unitaire optimal
  SELECT * INTO v_price_record
  FROM calculate_product_price_v2(
    p_product_id,
    p_quantity,
    p_channel_id,
    p_customer_id,
    p_customer_type,
    p_date
  );

  -- Retourner les calculs
  RETURN QUERY
  SELECT
    v_price_record.price_ht as unit_price_ht,
    v_price_record.price_ht * p_quantity as line_total_ht,
    v_price_record.price_ht * p_quantity * (1 - COALESCE(p_rfa_discount, 0)) as line_total_after_rfa,
    CASE
      WHEN v_price_record.original_price > 0
      THEN 1 - ((v_price_record.price_ht * (1 - COALESCE(p_rfa_discount, 0))) / v_price_record.original_price)
      ELSE 0
    END as total_discount_rate,
    v_price_record.price_list_name,
    v_price_record.price_source,
    v_price_record.currency;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- 6. VUE: product_prices_summary
-- =====================================================================
-- Vue matérialisée pour performance dashboard

CREATE MATERIALIZED VIEW IF NOT EXISTS product_prices_summary AS
WITH base_prices AS (
  SELECT DISTINCT ON (pli.product_id)
    p.id as product_id,
    p.name as product_name,
    p.sku,
    pli.price_ht as base_price,
    pl.currency,
    pl.name as price_list_name
  FROM products p
  LEFT JOIN price_list_items pli ON p.id = pli.product_id
  LEFT JOIN price_lists pl ON pli.price_list_id = pl.id
  WHERE pl.list_type = 'base'
    AND pli.is_active = TRUE
    AND pl.is_active = TRUE
    AND pli.min_quantity = 1
  ORDER BY pli.product_id, pl.priority ASC
),
channel_prices AS (
  SELECT
    bp.product_id,
    sc.code as channel_code,
    sc.name as channel_name,
    MIN(pli.price_ht) FILTER (WHERE pli.min_quantity = 1) as min_price,
    MAX(pli.price_ht) FILTER (WHERE pli.min_quantity = 1) as max_price
  FROM base_prices bp
  CROSS JOIN sales_channels sc
  LEFT JOIN channel_price_lists cpl ON sc.id = cpl.channel_id
  LEFT JOIN price_list_items pli ON cpl.price_list_id = pli.price_list_id
    AND bp.product_id = pli.product_id
  WHERE cpl.is_active = TRUE
    AND pli.is_active = TRUE
  GROUP BY bp.product_id, sc.code, sc.name
)
SELECT
  bp.*,
  COALESCE(
    (SELECT COUNT(DISTINCT pli.min_quantity)
     FROM price_list_items pli
     WHERE pli.product_id = bp.product_id
       AND pli.is_active = TRUE), 0
  ) as quantity_break_count,
  (SELECT jsonb_object_agg(cp.channel_code, cp.min_price)
   FROM channel_prices cp
   WHERE cp.product_id = bp.product_id) as channel_prices,
  NOW() as last_updated
FROM base_prices bp;

-- Index pour refresh incrémental
CREATE UNIQUE INDEX idx_product_prices_summary_product
  ON product_prices_summary(product_id);

-- =====================================================================
-- 7. TRIGGERS: Refresh automatique vue matérialisée
-- =====================================================================

CREATE OR REPLACE FUNCTION refresh_product_prices_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh asynchrone pour ne pas bloquer les transactions
  PERFORM pg_notify('refresh_prices_summary', 'update');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur price_list_items
CREATE TRIGGER trigger_refresh_prices_on_items
  AFTER INSERT OR UPDATE OR DELETE ON price_list_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_product_prices_summary();

-- Trigger sur price_lists
CREATE TRIGGER trigger_refresh_prices_on_lists
  AFTER UPDATE ON price_lists
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION refresh_product_prices_summary();

-- =====================================================================
-- 8. INDEX ADDITIONNELS POUR PERFORMANCE
-- =====================================================================

-- Index pour recherche rapide prix par contexte
CREATE INDEX IF NOT EXISTS idx_price_items_context_lookup
  ON price_list_items(product_id, min_quantity, is_active)
  INCLUDE (price_ht, price_list_id)
  WHERE is_active = TRUE;

-- Index pour jointures customer_price_lists
CREATE INDEX IF NOT EXISTS idx_customer_price_lists_lookup
  ON customer_price_lists(customer_id, customer_type, is_active)
  WHERE is_active = TRUE;

-- Index pour jointures channel_price_lists
CREATE INDEX IF NOT EXISTS idx_channel_price_lists_lookup
  ON channel_price_lists(channel_id, is_active)
  WHERE is_active = TRUE;

-- =====================================================================
-- 9. PERMISSIONS ET SÉCURITÉ
-- =====================================================================

-- Grant execute sur les fonctions publiques
GRANT EXECUTE ON FUNCTION calculate_product_price_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_batch_prices_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION get_quantity_breaks TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_order_line_price TO authenticated;

-- Grant select sur la vue matérialisée
GRANT SELECT ON product_prices_summary TO authenticated;

-- =====================================================================
-- 10. TESTS ET VALIDATION
-- =====================================================================

DO $$
DECLARE
  v_test_product_id UUID;
  v_test_channel_id UUID;
  v_test_price RECORD;
  v_function_count INTEGER;
BEGIN
  -- Vérifier création des fonctions
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'calculate_product_price_v2',
    'calculate_batch_prices_v2',
    'get_quantity_breaks',
    'calculate_order_line_price',
    'get_applicable_price_lists'
  );

  IF v_function_count = 5 THEN
    RAISE NOTICE '✅ Toutes les fonctions créées avec succès';
  ELSE
    RAISE WARNING '⚠️ Seulement % fonctions créées sur 5', v_function_count;
  END IF;

  -- Test rapide si données existent
  SELECT p.id INTO v_test_product_id
  FROM products p
  LIMIT 1;

  SELECT sc.id INTO v_test_channel_id
  FROM sales_channels sc
  WHERE sc.code = 'retail'
  LIMIT 1;

  IF v_test_product_id IS NOT NULL AND v_test_channel_id IS NOT NULL THEN
    -- Tester la fonction principale
    SELECT * INTO v_test_price
    FROM calculate_product_price_v2(
      v_test_product_id,
      1,
      v_test_channel_id
    );

    IF v_test_price.price_ht IS NOT NULL THEN
      RAISE NOTICE '✅ Test fonction calcul: Prix trouvé = %€ (Liste: %)',
        v_test_price.price_ht, v_test_price.price_list_name;
    ELSE
      RAISE NOTICE '⚠️ Test fonction: Aucun prix trouvé (normal si pas de données)';
    END IF;
  END IF;

  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ Migration 20251010_005 terminée';
  RAISE NOTICE '===================================';
  RAISE NOTICE '📊 Fonctions créées:';
  RAISE NOTICE '  - calculate_product_price_v2()';
  RAISE NOTICE '  - calculate_batch_prices_v2()';
  RAISE NOTICE '  - get_quantity_breaks()';
  RAISE NOTICE '  - calculate_order_line_price()';
  RAISE NOTICE '  - get_applicable_price_lists()';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Vue matérialisée créée:';
  RAISE NOTICE '  - product_prices_summary';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Triggers refresh automatique créés';
  RAISE NOTICE '🚀 Index performance optimisés';
  RAISE NOTICE '🔒 Permissions accordées';
  RAISE NOTICE '===================================';
END $$;