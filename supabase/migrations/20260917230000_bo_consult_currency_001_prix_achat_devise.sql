-- [BO-CONSULT-CURRENCY-001] Prix d'achat en dollars — figés sur la ligne
--
-- Demande Roméo (17/09/2026) : un prix d'ACHAT peut être libellé en euros ou
-- en dollars — au formulaire de sourcing comme sur une ligne de consultation.
-- Les prix de VENTE, la marge et le CA restent TOUJOURS en euros.
-- Taux initial : 1 USD = 0,87 EUR (valeur saisie manuellement ; la récupération
-- automatique du taux est un chantier ultérieur).
--
-- Exigence clé : le taux est FIGÉ (recopié) sur la ligne au moment de la saisie,
-- pour qu'une consultation ancienne ne change plus de valeur quand le dollar bouge.
--
-- Procédure safe (database-modeling-patterns.md règle 4) :
--   1. Ajouter colonne NULLABLE avec DEFAULT
--   2. Backfill des lignes existantes
--   3. Passer NOT NULL + CHECK
--
-- Périmètre :
--   - consultation_products : prix d'achat de la ligne (cost_price_override)
--   - consultation_supplier_costs : frais fournisseur (port, douane, autres)
--   - products : prix d'achat de base du produit (cost_price)
--
-- DATE : 2026-09-17

-- =============================================================================
-- CONSULTATION_PRODUCTS
-- =============================================================================

-- 1. Ajouter les colonnes NULLABLE avec DEFAULT

ALTER TABLE public.consultation_products
  ADD COLUMN IF NOT EXISTS cost_price_currency TEXT DEFAULT 'EUR';

ALTER TABLE public.consultation_products
  ADD COLUMN IF NOT EXISTS cost_price_exchange_rate NUMERIC DEFAULT 1;

-- 2. Backfill : toutes les lignes existantes ont leurs prix en EUR au taux 1

UPDATE public.consultation_products
  SET cost_price_currency    = 'EUR',
      cost_price_exchange_rate = 1
  WHERE cost_price_currency IS NULL
     OR cost_price_exchange_rate IS NULL;

-- 3. NOT NULL + CHECK

ALTER TABLE public.consultation_products
  ALTER COLUMN cost_price_currency    SET NOT NULL;

ALTER TABLE public.consultation_products
  ALTER COLUMN cost_price_exchange_rate SET NOT NULL;

ALTER TABLE public.consultation_products
  DROP CONSTRAINT IF EXISTS consultation_products_cost_price_currency_check;

ALTER TABLE public.consultation_products
  ADD CONSTRAINT consultation_products_cost_price_currency_check
  CHECK (cost_price_currency IN ('EUR', 'USD'));

ALTER TABLE public.consultation_products
  DROP CONSTRAINT IF EXISTS consultation_products_cost_price_exchange_rate_check;

ALTER TABLE public.consultation_products
  ADD CONSTRAINT consultation_products_cost_price_exchange_rate_check
  CHECK (cost_price_exchange_rate > 0);

COMMENT ON COLUMN public.consultation_products.cost_price_currency IS
  'Monnaie du prix d''achat de la ligne (cost_price_override). EUR par défaut. Le taux est figé au moment de la saisie. [BO-CONSULT-CURRENCY-001]';

COMMENT ON COLUMN public.consultation_products.cost_price_exchange_rate IS
  'Taux de change → EUR figé au moment de la saisie (1 USD = 0,87 EUR au 17/09/2026). [BO-CONSULT-CURRENCY-001]';

-- =============================================================================
-- CONSULTATION_SUPPLIER_COSTS
-- =============================================================================
-- La colonne `currency` TEXT existe déjà (DEFAULT ''EUR'').
-- On lui ajoute le CHECK si pas encore présent, et on ajoute exchange_rate.

-- CHECK sur currency existante

ALTER TABLE public.consultation_supplier_costs
  DROP CONSTRAINT IF EXISTS consultation_supplier_costs_currency_check;

ALTER TABLE public.consultation_supplier_costs
  ADD CONSTRAINT consultation_supplier_costs_currency_check
  CHECK (currency IN ('EUR', 'USD'));

-- 1. exchange_rate NULLABLE avec DEFAULT

ALTER TABLE public.consultation_supplier_costs
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- 2. Backfill

UPDATE public.consultation_supplier_costs
  SET exchange_rate = 1
  WHERE exchange_rate IS NULL;

-- 3. NOT NULL + CHECK

ALTER TABLE public.consultation_supplier_costs
  ALTER COLUMN exchange_rate SET NOT NULL;

ALTER TABLE public.consultation_supplier_costs
  DROP CONSTRAINT IF EXISTS consultation_supplier_costs_exchange_rate_check;

ALTER TABLE public.consultation_supplier_costs
  ADD CONSTRAINT consultation_supplier_costs_exchange_rate_check
  CHECK (exchange_rate > 0);

COMMENT ON COLUMN public.consultation_supplier_costs.exchange_rate IS
  'Taux de change → EUR figé au moment de la saisie. Complète la colonne currency existante. [BO-CONSULT-CURRENCY-001]';

-- =============================================================================
-- PRODUCTS
-- =============================================================================

-- 1. Ajouter les colonnes NULLABLE avec DEFAULT

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price_currency TEXT DEFAULT 'EUR';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price_exchange_rate NUMERIC DEFAULT 1;

-- 2. Backfill

UPDATE public.products
  SET cost_price_currency    = 'EUR',
      cost_price_exchange_rate = 1
  WHERE cost_price_currency IS NULL
     OR cost_price_exchange_rate IS NULL;

-- 3. NOT NULL + CHECK

ALTER TABLE public.products
  ALTER COLUMN cost_price_currency    SET NOT NULL;

ALTER TABLE public.products
  ALTER COLUMN cost_price_exchange_rate SET NOT NULL;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_price_currency_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_cost_price_currency_check
  CHECK (cost_price_currency IN ('EUR', 'USD'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_price_exchange_rate_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_cost_price_exchange_rate_check
  CHECK (cost_price_exchange_rate > 0);

COMMENT ON COLUMN public.products.cost_price_currency IS
  'Monnaie du prix d''achat de base (cost_price). EUR par défaut. Le taux est figé au moment de la saisie. [BO-CONSULT-CURRENCY-001]';

COMMENT ON COLUMN public.products.cost_price_exchange_rate IS
  'Taux de change → EUR figé au moment de la saisie du prix d''achat. [BO-CONSULT-CURRENCY-001]';
