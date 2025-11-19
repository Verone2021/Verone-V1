-- Migration: Ajouter ENUM payment_terms_type
-- Date: 2025-11-19
-- Description: Transformer payment_terms de TEXT vers ENUM strict pour garantir
--              la cohérence entre organisations et commandes fournisseurs.
--              Règle métier : Les conditions de paiement sont héritées de l'organisation
--              et ne peuvent pas être modifiées au niveau de la commande.

-- ========================================
-- 1. CRÉER L'ENUM payment_terms_type
-- ========================================

DO $$ BEGIN
  CREATE TYPE payment_terms_type AS ENUM (
    'PREPAID',      -- Prépaiement obligatoire (0 jours)
    'NET_30',       -- 30 jours net
    'NET_60',       -- 60 jours net
    'NET_90'        -- 90 jours net
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Le type payment_terms_type existe déjà';
END $$;

COMMENT ON TYPE payment_terms_type IS
  'Conditions de paiement standardisées pour organisations et commandes.
   PREPAID: Paiement à la commande
   NET_30: Paiement sous 30 jours
   NET_60: Paiement sous 60 jours
   NET_90: Paiement sous 90 jours';

-- ========================================
-- 2. MIGRER organisations.payment_terms
-- ========================================

-- Convertir les valeurs TEXT existantes vers ENUM
-- Si valeurs non conformes, mettre NULL
ALTER TABLE organisations
  ALTER COLUMN payment_terms TYPE payment_terms_type
  USING CASE
    WHEN payment_terms = 'PREPAID' THEN 'PREPAID'::payment_terms_type
    WHEN payment_terms = 'NET_30' THEN 'NET_30'::payment_terms_type
    WHEN payment_terms = 'NET_60' THEN 'NET_60'::payment_terms_type
    WHEN payment_terms = 'NET_90' THEN 'NET_90'::payment_terms_type
    WHEN payment_terms IN ('Prépaiement obligatoire', 'prépaiement') THEN 'PREPAID'::payment_terms_type
    WHEN payment_terms IN ('30 jours net', '30 jours', 'NET30') THEN 'NET_30'::payment_terms_type
    WHEN payment_terms IN ('60 jours net', '60 jours', 'NET60') THEN 'NET_60'::payment_terms_type
    WHEN payment_terms IN ('90 jours net', '90 jours', 'NET90') THEN 'NET_90'::payment_terms_type
    ELSE NULL
  END;

COMMENT ON COLUMN organisations.payment_terms IS
  'Conditions de paiement négociées avec ce partenaire commercial.
   Valeur héritée automatiquement par les commandes associées.
   Non modifiable au niveau commande (garantit cohérence contractuelle).';

-- ========================================
-- 3. MIGRER purchase_orders.payment_terms
-- ========================================

-- Convertir les valeurs TEXT existantes vers ENUM
ALTER TABLE purchase_orders
  ALTER COLUMN payment_terms TYPE payment_terms_type
  USING CASE
    WHEN payment_terms = 'PREPAID' THEN 'PREPAID'::payment_terms_type
    WHEN payment_terms = 'NET_30' THEN 'NET_30'::payment_terms_type
    WHEN payment_terms = 'NET_60' THEN 'NET_60'::payment_terms_type
    WHEN payment_terms = 'NET_90' THEN 'NET_90'::payment_terms_type
    WHEN payment_terms IN ('Prépaiement obligatoire', 'prépaiement') THEN 'PREPAID'::payment_terms_type
    WHEN payment_terms IN ('30 jours net', '30 jours', 'NET30') THEN 'NET_30'::payment_terms_type
    WHEN payment_terms IN ('60 jours net', '60 jours', 'NET60') THEN 'NET_60'::payment_terms_type
    WHEN payment_terms IN ('90 jours net', '90 jours', 'NET90') THEN 'NET_90'::payment_terms_type
    ELSE NULL
  END;

COMMENT ON COLUMN purchase_orders.payment_terms IS
  'Conditions de paiement héritées depuis organisations.payment_terms.
   Capturée au moment de la création de commande.
   Read-only : Ne peut pas être modifiée manuellement.
   Garantit traçabilité des conditions contractuelles.';

-- ========================================
-- 4. CRÉER FONCTION HELPER : payment_terms_label
-- ========================================

-- Fonction pour obtenir le label lisible d'un payment_terms_type
CREATE OR REPLACE FUNCTION payment_terms_label(term payment_terms_type)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE term
    WHEN 'PREPAID' THEN 'Prépaiement obligatoire'
    WHEN 'NET_30' THEN '30 jours net'
    WHEN 'NET_60' THEN '60 jours net'
    WHEN 'NET_90' THEN '90 jours net'
    ELSE 'Non défini'
  END;
$$;

COMMENT ON FUNCTION payment_terms_label IS
  'Convertit un payment_terms_type ENUM vers son label lisible.
   Utilisé dans les rapports et affichages UI.
   Exemple: payment_terms_label(''NET_30''::payment_terms_type) → ''30 jours net''';

-- ========================================
-- 5. CRÉER FONCTION HELPER : payment_terms_days
-- ========================================

-- Fonction pour obtenir le nombre de jours d'un payment_terms_type
CREATE OR REPLACE FUNCTION payment_terms_days(term payment_terms_type)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE term
    WHEN 'PREPAID' THEN 0
    WHEN 'NET_30' THEN 30
    WHEN 'NET_60' THEN 60
    WHEN 'NET_90' THEN 90
    ELSE 0
  END;
$$;

COMMENT ON FUNCTION payment_terms_days IS
  'Convertit un payment_terms_type ENUM vers le nombre de jours.
   Utilisé pour calculer dates d''échéance paiement.
   Exemple: payment_terms_days(''NET_30''::payment_terms_type) → 30';

-- ========================================
-- 6. CRÉER INDEX POUR PERFORMANCE
-- ========================================

-- Index pour recherche rapide commandes par payment_terms
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_terms
  ON purchase_orders(payment_terms)
  WHERE payment_terms IS NOT NULL;

COMMENT ON INDEX idx_purchase_orders_payment_terms IS
  'Index pour filtres/rapports par conditions de paiement.
   Exemple: Lister toutes commandes avec paiement à 30 jours.';

-- Index pour recherche rapide organisations par payment_terms
CREATE INDEX IF NOT EXISTS idx_organisations_payment_terms
  ON organisations(payment_terms)
  WHERE payment_terms IS NOT NULL;

COMMENT ON INDEX idx_organisations_payment_terms IS
  'Index pour filtres organisations par conditions de paiement.
   Exemple: Lister tous fournisseurs acceptant paiement à 60 jours.';

-- ========================================
-- 7. VALIDATION DE LA MIGRATION
-- ========================================

DO $$
BEGIN
  -- Vérifier que l'ENUM existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'payment_terms_type'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: ENUM payment_terms_type non créé';
  END IF;

  -- Vérifier que organisations.payment_terms est bien de type ENUM
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    JOIN pg_type t ON c.udt_name = t.typname
    WHERE c.table_name = 'organisations'
    AND c.column_name = 'payment_terms'
    AND t.typname = 'payment_terms_type'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: organisations.payment_terms pas converti en ENUM';
  END IF;

  -- Vérifier que purchase_orders.payment_terms est bien de type ENUM
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    JOIN pg_type t ON c.udt_name = t.typname
    WHERE c.table_name = 'purchase_orders'
    AND c.column_name = 'payment_terms'
    AND t.typname = 'payment_terms_type'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: purchase_orders.payment_terms pas converti en ENUM';
  END IF;

  -- Vérifier que les fonctions helper existent
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'payment_terms_label'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: fonction payment_terms_label non créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'payment_terms_days'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: fonction payment_terms_days non créée';
  END IF;

  RAISE NOTICE '✅ Migration réussie: payment_terms_type ENUM + helper functions créés';
END $$;
