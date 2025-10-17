-- Migration 006: Système Stock Professionnel - Réel vs Prévisionnel
-- Date: 18 septembre 2025
-- Objectif: Extension système stock pour gestion professionnelle avec stock réel/prévisionnel

-- =============================================
-- 1. CRÉATION ENUM MOTIFS SORTIE STOCK
-- =============================================

-- Motifs professionnels basés sur standards ERP/WMS
CREATE TYPE stock_reason_code AS ENUM (
  -- Sorties normales
  'sale',                    -- Vente client normale
  'transfer_out',           -- Transfert vers autre entrepôt

  -- Pertes & Dégradations
  'damage_transport',       -- Casse transport
  'damage_handling',        -- Casse manipulation
  'damage_storage',         -- Dégradation stockage
  'theft',                  -- Vol/disparition
  'loss_unknown',           -- Perte inexpliquée

  -- Usage Commercial
  'sample_client',          -- Échantillon client
  'sample_showroom',        -- Échantillon showroom/salon
  'marketing_event',        -- Événement marketing
  'photography',            -- Séance photo produits

  -- R&D & Production
  'rd_testing',             -- Tests R&D
  'prototype',              -- Développement prototype
  'quality_control',        -- Contrôle qualité destructif

  -- Retours & SAV
  'return_supplier',        -- Retour fournisseur défaut
  'return_customer',        -- Retour client SAV
  'warranty_replacement',   -- Remplacement garantie

  -- Ajustements & Corrections
  'inventory_correction',   -- Correction inventaire
  'write_off',             -- Mise au rebut
  'obsolete',              -- Produit obsolète

  -- Entrées spéciales
  'purchase_reception',     -- Réception commande fournisseur
  'return_from_client',     -- Retour client (échange)
  'found_inventory',        -- Trouvaille inventaire
  'manual_adjustment'       -- Ajustement manuel
);

-- =============================================
-- 2. EXTENSION TABLE PRODUCTS - STOCK DÉTAILLÉ
-- =============================================

-- Ajouter colonnes stock professionnel
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_real integer DEFAULT 0 CHECK (stock_real >= 0),
ADD COLUMN IF NOT EXISTS stock_forecasted_in integer DEFAULT 0 CHECK (stock_forecasted_in >= 0),
ADD COLUMN IF NOT EXISTS stock_forecasted_out integer DEFAULT 0 CHECK (stock_forecasted_out >= 0);

-- Commentaires explicatifs
COMMENT ON COLUMN products.stock_real IS 'Stock physique réellement présent en entrepôt';
COMMENT ON COLUMN products.stock_forecasted_in IS 'Stock prévu en entrée (commandes fournisseurs)';
COMMENT ON COLUMN products.stock_forecasted_out IS 'Stock prévu en sortie (commandes clients)';
COMMENT ON COLUMN products.stock_quantity IS 'Stock total actuel (legacy - sera remplacé par stock_real)';

-- =============================================
-- 3. EXTENSION TABLE STOCK_MOVEMENTS
-- =============================================

-- Ajouter colonnes pour traçabilité améliorée
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS reason_code stock_reason_code,
ADD COLUMN IF NOT EXISTS affects_forecast boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS forecast_type text CHECK (forecast_type IN ('in', 'out') OR forecast_type IS NULL);

-- Commentaires
COMMENT ON COLUMN stock_movements.reason_code IS 'Code motif précis du mouvement (casse, vol, échantillon, etc.)';
COMMENT ON COLUMN stock_movements.affects_forecast IS 'Indique si le mouvement affecte le stock prévisionnel';
COMMENT ON COLUMN stock_movements.forecast_type IS 'Type de prévisionnel affecté (in=entrée, out=sortie)';

-- =============================================
-- 4. FONCTION CALCUL STOCK DISPONIBLE AVANCÉ
-- =============================================

-- Remplace l'ancienne fonction get_available_stock
CREATE OR REPLACE FUNCTION get_available_stock_advanced(p_product_id uuid)
RETURNS TABLE (
  stock_real integer,
  stock_forecasted_in integer,
  stock_forecasted_out integer,
  stock_available integer,
  stock_total_forecasted integer
)
LANGUAGE plpgsql AS $$
DECLARE
  v_real integer := 0;
  v_forecast_in integer := 0;
  v_forecast_out integer := 0;
  v_reserved integer := 0;
BEGIN
  -- Stock réel physique
  SELECT COALESCE(p.stock_real, p.stock_quantity, 0) INTO v_real
  FROM products p WHERE p.id = p_product_id;

  -- Stock prévisionnel entrées
  SELECT COALESCE(p.stock_forecasted_in, 0) INTO v_forecast_in
  FROM products p WHERE p.id = p_product_id;

  -- Stock prévisionnel sorties
  SELECT COALESCE(p.stock_forecasted_out, 0) INTO v_forecast_out
  FROM products p WHERE p.id = p_product_id;

  -- Réservations actives (inchangé)
  SELECT COALESCE(SUM(sr.reserved_quantity), 0) INTO v_reserved
  FROM stock_reservations sr
  WHERE sr.product_id = p_product_id
    AND (sr.released_at IS NULL OR sr.released_at > now())
    AND (sr.expires_at IS NULL OR sr.expires_at > now());

  -- Retourner résultats calculés
  RETURN QUERY SELECT
    v_real,
    v_forecast_in,
    v_forecast_out,
    GREATEST(v_real - v_forecast_out - v_reserved, 0) as available,
    v_real + v_forecast_in - v_forecast_out as total_forecasted;
END;
$$;

-- =============================================
-- 5. TRIGGER MISE À JOUR STOCK PRÉVISIONNEL
-- =============================================

-- Fonction trigger pour gérer stock réel + prévisionnel
CREATE OR REPLACE FUNCTION update_product_stock_advanced()
RETURNS TRIGGER AS $$
BEGIN
  -- Mise à jour stock réel pour mouvements physiques
  IF NEW.affects_forecast = false OR NEW.affects_forecast IS NULL THEN
    -- Mouvement stock réel classique
    CASE NEW.movement_type
      WHEN 'IN' THEN
        UPDATE products
        SET stock_real = COALESCE(stock_real, stock_quantity, 0) + NEW.quantity_change,
            updated_at = now()
        WHERE id = NEW.product_id;

      WHEN 'OUT' THEN
        UPDATE products
        SET stock_real = GREATEST(COALESCE(stock_real, stock_quantity, 0) + NEW.quantity_change, 0),
            updated_at = now()
        WHERE id = NEW.product_id;

      WHEN 'ADJUST' THEN
        -- Pour un ajustement, quantity_after représente la nouvelle quantité réelle
        UPDATE products
        SET stock_real = NEW.quantity_after,
            updated_at = now()
        WHERE id = NEW.product_id;
    END CASE;

  ELSE
    -- Mouvement affectant le prévisionnel
    IF NEW.forecast_type = 'in' THEN
      UPDATE products
      SET stock_forecasted_in = GREATEST(COALESCE(stock_forecasted_in, 0) + NEW.quantity_change, 0),
          updated_at = now()
      WHERE id = NEW.product_id;

    ELSIF NEW.forecast_type = 'out' THEN
      UPDATE products
      SET stock_forecasted_out = GREATEST(COALESCE(stock_forecasted_out, 0) + NEW.quantity_change, 0),
          updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remplacer le trigger existant
DROP TRIGGER IF EXISTS update_product_stock_trigger ON stock_movements;
CREATE TRIGGER update_product_stock_advanced_trigger
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_advanced();

-- =============================================
-- 6. FONCTIONS HELPER MOTIFS STOCK
-- =============================================

-- Fonction pour obtenir la description d'un motif
CREATE OR REPLACE FUNCTION get_stock_reason_description(reason stock_reason_code)
RETURNS text AS $$
BEGIN
  RETURN CASE reason
    -- Sorties normales
    WHEN 'sale' THEN 'Vente client'
    WHEN 'transfer_out' THEN 'Transfert sortant'

    -- Pertes & Dégradations
    WHEN 'damage_transport' THEN 'Casse transport'
    WHEN 'damage_handling' THEN 'Casse manipulation'
    WHEN 'damage_storage' THEN 'Dégradation stockage'
    WHEN 'theft' THEN 'Vol/Disparition'
    WHEN 'loss_unknown' THEN 'Perte inexpliquée'

    -- Usage Commercial
    WHEN 'sample_client' THEN 'Échantillon client'
    WHEN 'sample_showroom' THEN 'Échantillon showroom'
    WHEN 'marketing_event' THEN 'Événement marketing'
    WHEN 'photography' THEN 'Séance photo'

    -- R&D & Production
    WHEN 'rd_testing' THEN 'Tests R&D'
    WHEN 'prototype' THEN 'Prototype'
    WHEN 'quality_control' THEN 'Contrôle qualité'

    -- Retours & SAV
    WHEN 'return_supplier' THEN 'Retour fournisseur'
    WHEN 'return_customer' THEN 'Retour client SAV'
    WHEN 'warranty_replacement' THEN 'Remplacement garantie'

    -- Ajustements
    WHEN 'inventory_correction' THEN 'Correction inventaire'
    WHEN 'write_off' THEN 'Mise au rebut'
    WHEN 'obsolete' THEN 'Produit obsolète'

    -- Entrées spéciales
    WHEN 'purchase_reception' THEN 'Réception fournisseur'
    WHEN 'return_from_client' THEN 'Retour client'
    WHEN 'found_inventory' THEN 'Trouvaille inventaire'
    WHEN 'manual_adjustment' THEN 'Ajustement manuel'

    ELSE 'Motif inconnu'
  END;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. MIGRATION DONNÉES EXISTANTES
-- =============================================

-- Migrer stock_quantity vers stock_real pour produits existants
UPDATE products
SET stock_real = COALESCE(stock_quantity, 0),
    stock_forecasted_in = 0,
    stock_forecasted_out = 0
WHERE stock_real IS NULL;

-- Ajouter reason_code par défaut aux mouvements existants
UPDATE stock_movements
SET reason_code = CASE movement_type
  WHEN 'IN' THEN 'manual_adjustment'::stock_reason_code
  WHEN 'OUT' THEN 'manual_adjustment'::stock_reason_code
  WHEN 'ADJUST' THEN 'inventory_correction'::stock_reason_code
  ELSE 'manual_adjustment'::stock_reason_code
END,
affects_forecast = false
WHERE reason_code IS NULL;

-- =============================================
-- 8. INDEXES OPTIMISATION PERFORMANCE
-- =============================================

-- Index pour requêtes stock par produit
CREATE INDEX IF NOT EXISTS idx_products_stock_real ON products(stock_real) WHERE stock_real > 0;
CREATE INDEX IF NOT EXISTS idx_products_stock_forecasted ON products(stock_forecasted_in, stock_forecasted_out);

-- Index pour recherche par motif
CREATE INDEX IF NOT EXISTS idx_stock_movements_reason_code ON stock_movements(reason_code);
CREATE INDEX IF NOT EXISTS idx_stock_movements_forecast ON stock_movements(affects_forecast, forecast_type) WHERE affects_forecast = true;

-- =============================================
-- 9. RLS POLICIES ÉTENDUES
-- =============================================

-- Policies pour nouvelles colonnes (héritent des existantes)
-- Les policies existantes sur products et stock_movements couvrent déjà les nouvelles colonnes

-- =============================================
-- 10. VALIDATION FINALE
-- =============================================

-- Vérifier cohérence données
DO $$
DECLARE
  v_products_count integer;
  v_movements_count integer;
BEGIN
  SELECT COUNT(*) INTO v_products_count FROM products WHERE stock_real IS NOT NULL;
  SELECT COUNT(*) INTO v_movements_count FROM stock_movements WHERE reason_code IS NOT NULL;

  RAISE NOTICE 'Migration terminée - % produits migrés, % mouvements avec reason_code',
    v_products_count, v_movements_count;
END
$$;

-- Commentaire migration
COMMENT ON TABLE products IS 'Produits avec système stock professionnel (réel + prévisionnel)';
COMMENT ON TABLE stock_movements IS 'Mouvements stock avec motifs détaillés et gestion prévisionnelle';