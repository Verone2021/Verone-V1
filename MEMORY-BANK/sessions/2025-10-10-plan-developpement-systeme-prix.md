# PLAN DE DÉVELOPPEMENT - SYSTÈME PRIX MULTI-CANAUX VÉRONE

**Date** : 10 Octobre 2025
**Version** : 1.0
**Architecte** : Claude Code - Orchestrateur Système Vérone
**Objectif** : Roadmap complète implémentation pricing B2B/B2C/Showroom

---

## RÉSUMÉ EXÉCUTIF

### Scope Mission
**Implémenter système de prix multi-canaux** pour Vérone Back Office permettant :
- Prix différenciés par canal (e-commerce B2C, showroom, B2B)
- Prix négociés client spécifique (organisations + particuliers)
- Remises Bonus Fin d'Année (BFA) pour clients professionnels
- Programme fidélité points pour clients particuliers
- Suggestion prix intelligente lors création commande

### Effort Total Estimé
- **P0 (Bloquants Production - Hors Scope)** : 16 jours
- **P1 (Système Prix Core)** : 17 jours
- **P2 (Optimisations)** : 5 jours
- **Total P1 (Mission Actuelle)** : **17 jours/dev** (~3.5 semaines)

### Architecture Cible
- **6 tables nouvelles** : price_lists, price_list_items, customer_price_agreements, discount_tiers, loyalty_points, loyalty_transactions
- **3 RPC critiques** : get_applicable_price(), calculate_bfa_discount(), earn_loyalty_points()
- **4 hooks React** : use-price-lists, use-customer-agreements, use-discount-tiers, use-loyalty-points
- **2 composants UI** : PriceSuggestionPanel, LoyaltyPointsDisplay

---

## PARTIE 1 : ARCHITECTURE BASE DE DONNÉES

### 1.1 Schéma ER Textuel Complet

```
┌────────────────────────────────────────────────────────────────────┐
│                    SYSTÈME PRIX MULTI-CANAUX                       │
└────────────────────────────────────────────────────────────────────┘

TABLES CORE PRICING:

price_lists (Listes prix par canal/segment)
├── id (UUID PK)
├── name (VARCHAR NOT NULL) - Ex: "Tarif E-commerce Particuliers 2025"
├── channel (ENUM NOT NULL) - 'ecommerce', 'showroom', 'b2b'
├── priority (INTEGER DEFAULT 0) - Si plusieurs listes applicables
├── active (BOOLEAN DEFAULT true)
├── valid_from (DATE)
├── valid_to (DATE)
├── created_at, updated_at, created_by (AUDIT)
└── UNIQUE (name)

price_list_items (Prix produits par liste)
├── id (UUID PK)
├── price_list_id (UUID FK → price_lists)
├── product_id (UUID FK → products)
├── price_eur (DECIMAL(10,2) NOT NULL)
├── min_quantity (INTEGER) - Pour paliers quantité
├── discount_percentage (DECIMAL(5,2)) - Remise volume
├── created_at, updated_at
└── UNIQUE (price_list_id, product_id, min_quantity)

customer_price_agreements (Prix négociés client spécifique)
├── id (UUID PK)
├── customer_id (UUID NOT NULL) - Référence organisations.id
├── customer_type (ENUM) - 'organisation', 'individual'
├── product_id (UUID FK → products)
├── agreed_price_ht (DECIMAL(10,2) NOT NULL)
├── valid_from (DATE NOT NULL)
├── valid_to (DATE)
├── notes (TEXT)
├── approved_by (UUID FK → auth.users)
├── approved_at (TIMESTAMPTZ)
├── created_at, updated_at, created_by
└── UNIQUE (customer_id, product_id, valid_from)

discount_tiers (Paliers remises BFA - Bonus Fin d'Année)
├── id (UUID PK)
├── organisation_id (UUID FK → organisations)
├── min_annual_revenue_eur (DECIMAL(12,2) NOT NULL)
├── max_annual_revenue_eur (DECIMAL(12,2))
├── discount_percentage (DECIMAL(5,2) NOT NULL)
├── fiscal_year (INTEGER NOT NULL) - Ex: 2025
├── rebate_type (ENUM) - 'retroactive', 'progressive'
├── created_at, updated_at, created_by
└── UNIQUE (organisation_id, fiscal_year, min_annual_revenue_eur)

loyalty_points (Points fidélité particuliers)
├── id (UUID PK)
├── individual_customer_id (UUID UNIQUE FK → organisations)
├── points_balance (INTEGER DEFAULT 0)
├── tier (ENUM) - 'bronze', 'silver', 'gold', 'platinum'
├── last_updated_at (TIMESTAMPTZ)
├── created_at
└── CHECK (points_balance >= 0)

loyalty_transactions (Historique points)
├── id (UUID PK)
├── individual_customer_id (UUID FK → organisations)
├── points_change (INTEGER NOT NULL) - Positif = gain, Négatif = utilisation
├── transaction_type (ENUM) - 'earn', 'redeem', 'expire', 'adjustment'
├── reference_type (TEXT) - 'sales_order', 'manual', 'promotion'
├── reference_id (UUID)
├── notes (TEXT)
├── created_at, created_by
└── INDEX (individual_customer_id, created_at DESC)

MODIFICATIONS TABLES EXISTANTES:

sales_order_items (Ajouts pour audit trail prix)
├── applied_price_source (ENUM) - 'manual', 'negotiated', 'pricelist', 'catalog'
├── original_price_eur (DECIMAL(10,2)) - Prix avant remises
├── final_price_eur (DECIMAL(10,2)) - Prix après remises
└── price_agreement_id (UUID FK → customer_price_agreements)

organisations (Ajout lien liste prix par défaut)
└── default_price_list_id (UUID FK → price_lists)
```

---

### 1.2 Migrations SQL Séquentielles

#### **Migration 1 : Système Listes Prix**
**Fichier** : `supabase/migrations/20251011_001_create_price_lists_system.sql`

```sql
-- ============================================================================
-- Migration: Système Listes Prix Multi-Canaux
-- Date: 2025-10-11
-- Description: Tables price_lists + price_list_items pour segmentation B2C/B2B
-- ============================================================================

-- 1. ENUM channel
CREATE TYPE price_channel AS ENUM ('ecommerce', 'showroom', 'b2b');

-- 2. TABLE price_lists
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité liste
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,

  -- Canal de vente
  channel price_channel NOT NULL,

  -- Priorité (si plusieurs listes applicables, plus élevé = prioritaire)
  priority INTEGER DEFAULT 0,

  -- Statut
  active BOOLEAN DEFAULT true,

  -- Période validité
  valid_from DATE,
  valid_to DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Contraintes business
  CONSTRAINT price_lists_name_length CHECK (length(trim(name)) >= 5),
  CONSTRAINT price_lists_valid_dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- 3. TABLE price_list_items
CREATE TABLE price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Prix
  price_eur DECIMAL(10,2) NOT NULL CHECK (price_eur > 0),

  -- Paliers quantité (optionnel)
  min_quantity INTEGER CHECK (min_quantity IS NULL OR min_quantity > 0),
  discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage < 100),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unicité : Une seule ligne par (liste, produit, palier quantité)
  UNIQUE (price_list_id, product_id, COALESCE(min_quantity, 0))
);

-- 4. INDEX Performance
CREATE INDEX idx_price_lists_channel ON price_lists(channel) WHERE active = true;
CREATE INDEX idx_price_lists_active ON price_lists(active);
CREATE INDEX idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX idx_price_list_items_lookup ON price_list_items(price_list_id, product_id, min_quantity);

-- 5. RLS Policies
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Lecture: Tous utilisateurs authentifiés
CREATE POLICY "price_lists_select" ON price_lists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "price_list_items_select" ON price_list_items
  FOR SELECT TO authenticated USING (true);

-- Modification: Admin + Sales uniquement
CREATE POLICY "price_lists_modify" ON price_lists
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager')
    )
  );

CREATE POLICY "price_list_items_modify" ON price_list_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager')
    )
  );

-- 6. Triggers updated_at
CREATE TRIGGER price_lists_updated_at
  BEFORE UPDATE ON price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER price_list_items_updated_at
  BEFORE UPDATE ON price_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Données initiales (Listes prix par défaut)
INSERT INTO price_lists (name, channel, priority, active)
VALUES
  ('Tarif E-commerce Particuliers 2025', 'ecommerce', 10, true),
  ('Tarif Showroom 2025', 'showroom', 20, true),
  ('Tarif Professionnel B2B 2025', 'b2b', 30, true);

-- 8. Commentaires documentation
COMMENT ON TABLE price_lists IS 'Listes de prix par canal de vente (ecommerce, showroom, b2b)';
COMMENT ON TABLE price_list_items IS 'Prix produits par liste avec paliers quantité optionnels';
COMMENT ON COLUMN price_list_items.min_quantity IS 'Quantité minimum pour déclencher ce prix/remise (NULL = sans condition)';

-- Notification succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 - Système listes prix créé avec succès';
  RAISE NOTICE '📊 Tables: price_lists, price_list_items';
  RAISE NOTICE '🔐 RLS policies activées';
  RAISE NOTICE '📝 3 listes prix par défaut insérées';
END $$;
```

---

#### **Migration 2 : Prix Négociés Clients**
**Fichier** : `supabase/migrations/20251011_002_create_customer_price_agreements.sql`

```sql
-- ============================================================================
-- Migration: Prix Négociés Client Spécifique
-- Date: 2025-10-11
-- Description: Table customer_price_agreements pour accords commerciaux
-- ============================================================================

-- 1. ENUM customer_type (réutiliser si existant ou créer)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_agreement_type') THEN
    CREATE TYPE customer_agreement_type AS ENUM ('organisation', 'individual');
  END IF;
END $$;

-- 2. TABLE customer_price_agreements
CREATE TABLE customer_price_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client (polymorphic: organisation OU individual_customer)
  customer_id UUID NOT NULL, -- Référence organisations.id
  customer_type customer_agreement_type NOT NULL,

  -- Produit concerné
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Prix négocié
  agreed_price_ht DECIMAL(10,2) NOT NULL CHECK (agreed_price_ht > 0),

  -- Période validité
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,

  -- Métadonnées
  notes TEXT,

  -- Workflow approval (si prix < 80% catalogue)
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Contraintes
  CONSTRAINT customer_agreements_valid_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
  UNIQUE (customer_id, customer_type, product_id, valid_from)
);

-- 3. INDEX Performance
CREATE INDEX idx_customer_agreements_customer ON customer_price_agreements(customer_id, customer_type);
CREATE INDEX idx_customer_agreements_product ON customer_price_agreements(product_id);
CREATE INDEX idx_customer_agreements_validity ON customer_price_agreements(valid_from, valid_to);
CREATE INDEX idx_customer_agreements_lookup ON customer_price_agreements(
  customer_id, customer_type, product_id, valid_from, valid_to
) WHERE valid_to IS NULL OR valid_to >= CURRENT_DATE;

-- 4. RLS Policies
ALTER TABLE customer_price_agreements ENABLE ROW LEVEL SECURITY;

-- Lecture: Admin, Sales, + Propriétaire du customer
CREATE POLICY "customer_agreements_select" ON customer_price_agreements
  FOR SELECT TO authenticated
  USING (
    -- Admin/Sales voient tout
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales')
    )
    OR
    -- Client voit ses propres accords
    customer_id IN (
      SELECT organisation_id FROM user_organisation_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Création: Admin + Sales uniquement
CREATE POLICY "customer_agreements_insert" ON customer_price_agreements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales')
    )
  );

-- Modification: Admin + Sales + Owner
CREATE POLICY "customer_agreements_update" ON customer_price_agreements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales')
    )
  );

-- 5. Trigger validation approval
CREATE OR REPLACE FUNCTION validate_price_agreement_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_catalog_price DECIMAL(10,2);
  v_discount_threshold DECIMAL(5,2) := 0.80; -- 80% du prix catalogue
BEGIN
  -- Récupérer prix catalogue produit
  SELECT price_ht INTO v_catalog_price
  FROM products
  WHERE id = NEW.product_id;

  -- Si prix négocié < 80% catalogue → Approval obligatoire
  IF NEW.agreed_price_ht < (v_catalog_price * v_discount_threshold) THEN
    IF NEW.approved_by IS NULL OR NEW.approved_at IS NULL THEN
      RAISE EXCEPTION 'Prix négocié < 80%% catalogue (%.2f < %.2f) → Approval manager requise',
        NEW.agreed_price_ht, (v_catalog_price * v_discount_threshold);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_agreements_validate_approval
  BEFORE INSERT OR UPDATE ON customer_price_agreements
  FOR EACH ROW
  EXECUTE FUNCTION validate_price_agreement_approval();

-- 6. Trigger updated_at
CREATE TRIGGER customer_agreements_updated_at
  BEFORE UPDATE ON customer_price_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Commentaires
COMMENT ON TABLE customer_price_agreements IS 'Prix négociés avec clients spécifiques (organisations + particuliers)';
COMMENT ON COLUMN customer_price_agreements.customer_type IS 'Type client: organisation (B2B) ou individual (B2C)';
COMMENT ON COLUMN customer_price_agreements.approved_by IS 'Approbateur si prix < 80% catalogue';

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 - Prix négociés clients créée avec succès';
  RAISE NOTICE '📊 Table: customer_price_agreements';
  RAISE NOTICE '🔐 RLS policies + validation approval activées';
END $$;
```

---

#### **Migration 3 : Paliers Remises BFA**
**Fichier** : `supabase/migrations/20251011_003_create_discount_tiers_bfa.sql`

```sql
-- ============================================================================
-- Migration: Paliers Remises BFA (Bonus Fin d'Année)
-- Date: 2025-10-11
-- Description: Table discount_tiers pour remises volume pro basées sur CA annuel
-- ============================================================================

-- 1. ENUM rebate_type
CREATE TYPE rebate_calculation_type AS ENUM ('retroactive', 'progressive');

-- 2. TABLE discount_tiers
CREATE TABLE discount_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organisation B2B concernée
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Palier CA annuel (en euros)
  min_annual_revenue_eur DECIMAL(12,2) NOT NULL CHECK (min_annual_revenue_eur >= 0),
  max_annual_revenue_eur DECIMAL(12,2) CHECK (max_annual_revenue_eur IS NULL OR max_annual_revenue_eur > min_annual_revenue_eur),

  -- Remise applicable (en pourcentage)
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),

  -- Année fiscale
  fiscal_year INTEGER NOT NULL CHECK (fiscal_year >= 2020 AND fiscal_year <= 2100),

  -- Type calcul (retroactive = remise sur tout le CA, progressive = par tranche)
  rebate_type rebate_calculation_type DEFAULT 'retroactive',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Unicité palier
  UNIQUE (organisation_id, fiscal_year, min_annual_revenue_eur)
);

-- 3. INDEX Performance
CREATE INDEX idx_discount_tiers_org_year ON discount_tiers(organisation_id, fiscal_year);
CREATE INDEX idx_discount_tiers_lookup ON discount_tiers(
  organisation_id, fiscal_year, min_annual_revenue_eur, max_annual_revenue_eur
);

-- 4. RLS Policies
ALTER TABLE discount_tiers ENABLE ROW LEVEL SECURITY;

-- Lecture: Admin, Sales, + Organisation concernée
CREATE POLICY "discount_tiers_select" ON discount_tiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales')
    )
    OR
    organisation_id IN (
      SELECT organisation_id FROM user_organisation_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Modification: Admin + Sales uniquement
CREATE POLICY "discount_tiers_modify" ON discount_tiers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales_manager')
    )
  );

-- 5. RPC: Calcul BFA (Bonus Fin d'Année)
CREATE OR REPLACE FUNCTION calculate_bfa_discount(
  p_organisation_id UUID,
  p_fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
  annual_revenue_eur DECIMAL(12,2),
  applicable_tier_id UUID,
  discount_percentage DECIMAL(5,2),
  discount_amount_eur DECIMAL(10,2)
) AS $$
DECLARE
  v_annual_revenue DECIMAL(12,2);
  v_tier RECORD;
BEGIN
  -- 1. Calculer CA annuel client (commandes confirmées uniquement)
  SELECT COALESCE(SUM(total_ttc), 0) INTO v_annual_revenue
  FROM sales_orders
  WHERE customer_id = p_organisation_id
    AND EXTRACT(YEAR FROM confirmed_at) = p_fiscal_year
    AND status NOT IN ('draft', 'cancelled');

  -- 2. Trouver palier applicable (retroactive: plus haut palier atteint)
  SELECT * INTO v_tier
  FROM discount_tiers
  WHERE organisation_id = p_organisation_id
    AND fiscal_year = p_fiscal_year
    AND min_annual_revenue_eur <= v_annual_revenue
    AND (max_annual_revenue_eur IS NULL OR max_annual_revenue_eur >= v_annual_revenue)
  ORDER BY min_annual_revenue_eur DESC
  LIMIT 1;

  -- 3. Calculer remise BFA
  IF v_tier.id IS NOT NULL THEN
    RETURN QUERY SELECT
      v_annual_revenue,
      v_tier.id,
      v_tier.discount_percentage,
      ROUND(v_annual_revenue * (v_tier.discount_percentage / 100), 2);
  ELSE
    -- Aucun palier atteint
    RETURN QUERY SELECT
      v_annual_revenue,
      NULL::UUID,
      0::DECIMAL(5,2),
      0::DECIMAL(10,2);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_bfa_discount(UUID, INTEGER) TO authenticated;

-- 6. Trigger updated_at
CREATE TRIGGER discount_tiers_updated_at
  BEFORE UPDATE ON discount_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Données exemples (Paliers BFA standard)
INSERT INTO discount_tiers (organisation_id, min_annual_revenue_eur, max_annual_revenue_eur, discount_percentage, fiscal_year, rebate_type)
SELECT
  id,
  0, 10000, 0, 2025, 'retroactive' FROM organisations WHERE type = 'customer' AND customer_type = 'professional' LIMIT 1
UNION ALL
SELECT
  id,
  10000, 50000, 5, 2025, 'retroactive' FROM organisations WHERE type = 'customer' AND customer_type = 'professional' LIMIT 1
UNION ALL
SELECT
  id,
  50000, 100000, 10, 2025, 'retroactive' FROM organisations WHERE type = 'customer' AND customer_type = 'professional' LIMIT 1
UNION ALL
SELECT
  id,
  100000, NULL, 15, 2025, 'retroactive' FROM organisations WHERE type = 'customer' AND customer_type = 'professional' LIMIT 1;

-- 8. Commentaires
COMMENT ON TABLE discount_tiers IS 'Paliers remises BFA (Bonus Fin d''Année) pour clients professionnels basés sur CA annuel';
COMMENT ON COLUMN discount_tiers.rebate_type IS 'retroactive = remise sur tout le CA | progressive = remise par tranche';
COMMENT ON FUNCTION calculate_bfa_discount IS 'Calcule remise BFA client pro pour année fiscale donnée';

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003 - Paliers BFA créés avec succès';
  RAISE NOTICE '📊 Table: discount_tiers';
  RAISE NOTICE '🔧 RPC: calculate_bfa_discount(organisation_id, fiscal_year)';
  RAISE NOTICE '📝 Paliers exemples insérés (0%, 5%, 10%, 15%)';
END $$;
```

---

#### **Migration 4 : Programme Fidélité**
**Fichier** : `supabase/migrations/20251011_004_create_loyalty_system.sql`

```sql
-- ============================================================================
-- Migration: Programme Fidélité Points (Particuliers)
-- Date: 2025-10-11
-- Description: Tables loyalty_points + loyalty_transactions
-- ============================================================================

-- 1. ENUM tier fidélité
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- 2. ENUM transaction_type
CREATE TYPE loyalty_transaction_type AS ENUM ('earn', 'redeem', 'expire', 'adjustment');

-- 3. TABLE loyalty_points
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client particulier (1:1 avec organisations.customer_type='individual')
  individual_customer_id UUID NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,

  -- Solde points
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),

  -- Niveau fidélité (calculé automatiquement)
  tier loyalty_tier DEFAULT 'bronze',

  -- Métadonnées
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte: Seulement pour individual_customers
  CONSTRAINT loyalty_points_individual_only CHECK (
    EXISTS (
      SELECT 1 FROM organisations
      WHERE id = individual_customer_id AND customer_type = 'individual'
    )
  )
);

-- 4. TABLE loyalty_transactions
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client
  individual_customer_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Points modifiés (positif = gain, négatif = utilisation)
  points_change INTEGER NOT NULL,

  -- Type transaction
  transaction_type loyalty_transaction_type NOT NULL,

  -- Référence (ex: sales_order_id si earn via achat)
  reference_type TEXT, -- 'sales_order', 'manual', 'promotion', 'expiration'
  reference_id UUID,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. INDEX Performance
CREATE INDEX idx_loyalty_points_customer ON loyalty_points(individual_customer_id);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(individual_customer_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(created_at DESC);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);

-- 6. RLS Policies
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Lecture: Admin, Sales, + Propriétaire
CREATE POLICY "loyalty_points_select" ON loyalty_points
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
    )
    OR
    individual_customer_id IN (
      SELECT organisation_id FROM user_organisation_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "loyalty_transactions_select" ON loyalty_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
    )
    OR
    individual_customer_id IN (
      SELECT organisation_id FROM user_organisation_assignments
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Modification: Admin + Sales uniquement (automatisée via RPC)
CREATE POLICY "loyalty_points_modify" ON loyalty_points
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
    )
  );

CREATE POLICY "loyalty_transactions_insert" ON loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'sales')
    )
  );

-- 7. RPC: Gagner points (automatique post-commande)
CREATE OR REPLACE FUNCTION earn_loyalty_points(
  p_customer_id UUID,
  p_sales_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_order_total DECIMAL(10,2);
  v_points_earned INTEGER;
  v_points_per_euro INTEGER := 1; -- 1€ = 1 point
BEGIN
  -- 1. Vérifier que customer est de type individual
  IF NOT EXISTS (
    SELECT 1 FROM organisations
    WHERE id = p_customer_id AND customer_type = 'individual'
  ) THEN
    RAISE EXCEPTION 'Loyalty points disponibles uniquement pour clients particuliers (individual)';
  END IF;

  -- 2. Récupérer total commande
  SELECT total_ttc INTO v_order_total
  FROM sales_orders
  WHERE id = p_sales_order_id AND customer_id = p_customer_id;

  IF v_order_total IS NULL THEN
    RAISE EXCEPTION 'Commande % introuvable pour client %', p_sales_order_id, p_customer_id;
  END IF;

  -- 3. Calculer points (arrondi inférieur)
  v_points_earned := FLOOR(v_order_total * v_points_per_euro);

  -- 4. Créer transaction
  INSERT INTO loyalty_transactions (
    individual_customer_id,
    points_change,
    transaction_type,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_customer_id,
    v_points_earned,
    'earn',
    'sales_order',
    p_sales_order_id,
    FORMAT('Commande %s - %s€ TTC', (SELECT order_number FROM sales_orders WHERE id = p_sales_order_id), v_order_total)
  );

  -- 5. Mettre à jour solde (upsert si pas encore créé)
  INSERT INTO loyalty_points (individual_customer_id, points_balance, last_updated_at)
  VALUES (p_customer_id, v_points_earned, NOW())
  ON CONFLICT (individual_customer_id)
  DO UPDATE SET
    points_balance = loyalty_points.points_balance + v_points_earned,
    last_updated_at = NOW();

  -- 6. Recalculer tier
  PERFORM update_loyalty_tier(p_customer_id);

  RETURN v_points_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION earn_loyalty_points(UUID, UUID) TO authenticated;

-- 8. RPC: Utiliser points (réduction commande)
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_customer_id UUID,
  p_points_to_redeem INTEGER,
  p_sales_order_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_current_balance INTEGER;
  v_euro_value_per_point DECIMAL(5,4) := 0.01; -- 100 points = 1€
  v_discount_eur DECIMAL(10,2);
BEGIN
  -- 1. Vérifier solde suffisant
  SELECT points_balance INTO v_current_balance
  FROM loyalty_points
  WHERE individual_customer_id = p_customer_id;

  IF v_current_balance IS NULL OR v_current_balance < p_points_to_redeem THEN
    RAISE EXCEPTION 'Solde points insuffisant (% disponibles, % demandés)', COALESCE(v_current_balance, 0), p_points_to_redeem;
  END IF;

  -- 2. Calculer réduction en euros
  v_discount_eur := p_points_to_redeem * v_euro_value_per_point;

  -- 3. Créer transaction
  INSERT INTO loyalty_transactions (
    individual_customer_id,
    points_change,
    transaction_type,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_customer_id,
    -p_points_to_redeem,
    'redeem',
    'sales_order',
    p_sales_order_id,
    FORMAT('Utilisation %s points = %.2f€ de réduction', p_points_to_redeem, v_discount_eur)
  );

  -- 4. Mettre à jour solde
  UPDATE loyalty_points
  SET points_balance = points_balance - p_points_to_redeem,
      last_updated_at = NOW()
  WHERE individual_customer_id = p_customer_id;

  -- 5. Recalculer tier
  PERFORM update_loyalty_tier(p_customer_id);

  RETURN v_discount_eur;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION redeem_loyalty_points(UUID, INTEGER, UUID) TO authenticated;

-- 9. RPC: Recalculer tier fidélité
CREATE OR REPLACE FUNCTION update_loyalty_tier(p_customer_id UUID)
RETURNS loyalty_tier AS $$
DECLARE
  v_points_balance INTEGER;
  v_new_tier loyalty_tier;
BEGIN
  -- Récupérer solde
  SELECT points_balance INTO v_points_balance
  FROM loyalty_points
  WHERE individual_customer_id = p_customer_id;

  -- Calculer tier selon seuils
  v_new_tier := CASE
    WHEN v_points_balance >= 5000 THEN 'platinum'::loyalty_tier
    WHEN v_points_balance >= 2000 THEN 'gold'::loyalty_tier
    WHEN v_points_balance >= 500 THEN 'silver'::loyalty_tier
    ELSE 'bronze'::loyalty_tier
  END;

  -- Mettre à jour tier
  UPDATE loyalty_points
  SET tier = v_new_tier,
      last_updated_at = NOW()
  WHERE individual_customer_id = p_customer_id;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_loyalty_tier(UUID) TO authenticated;

-- 10. Commentaires
COMMENT ON TABLE loyalty_points IS 'Points fidélité clients particuliers (1€ dépensé = 1 point, 100 points = 1€ réduction)';
COMMENT ON TABLE loyalty_transactions IS 'Historique transactions points (earn, redeem, expire, adjustment)';
COMMENT ON COLUMN loyalty_points.tier IS 'Niveau fidélité: bronze (0-499), silver (500-1999), gold (2000-4999), platinum (5000+)';
COMMENT ON FUNCTION earn_loyalty_points IS 'Attribue points client après achat (appelé automatiquement post-order delivery)';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Utilise points pour réduction commande (100 points = 1€)';

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 - Programme fidélité créé avec succès';
  RAISE NOTICE '📊 Tables: loyalty_points, loyalty_transactions';
  RAISE NOTICE '🔧 RPC: earn_loyalty_points(), redeem_loyalty_points(), update_loyalty_tier()';
  RAISE NOTICE '💎 Tiers: bronze, silver, gold, platinum';
END $$;
```

---

#### **Migration 5 : RPC Calcul Prix Central**
**Fichier** : `supabase/migrations/20251011_005_create_rpc_get_applicable_price.sql`

```sql
-- ============================================================================
-- Migration: RPC Centrale Calcul Prix (SSOT - Single Source of Truth)
-- Date: 2025-10-11
-- Description: Fonction get_applicable_price() avec logique priorité complète
-- ============================================================================

-- 1. RPC get_applicable_price
CREATE OR REPLACE FUNCTION get_applicable_price(
  p_product_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT DEFAULT 'organisation', -- 'organisation' ou 'individual'
  p_channel TEXT DEFAULT 'ecommerce', -- 'ecommerce', 'showroom', 'b2b'
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
  price_eur DECIMAL(10,2),
  source TEXT, -- 'negotiated', 'pricelist', 'catalog'
  discount_percentage DECIMAL(5,2),
  final_price_eur DECIMAL(10,2),
  price_list_id UUID,
  price_agreement_id UUID
) AS $$
DECLARE
  v_price DECIMAL(10,2);
  v_source TEXT;
  v_discount DECIMAL(5,2) := 0;
  v_price_list_id UUID;
  v_price_agreement_id UUID;
BEGIN
  -- ============================================================================
  -- PRIORITÉ 1 : Prix négocié client (customer_price_agreements)
  -- ============================================================================
  SELECT
    cpa.agreed_price_ht,
    'negotiated',
    0,
    cpa.id
  INTO v_price, v_source, v_discount, v_price_agreement_id
  FROM customer_price_agreements cpa
  WHERE cpa.customer_id = p_customer_id
    AND cpa.customer_type = p_customer_type::customer_agreement_type
    AND cpa.product_id = p_product_id
    AND (cpa.valid_from IS NULL OR cpa.valid_from <= CURRENT_DATE)
    AND (cpa.valid_to IS NULL OR cpa.valid_to >= CURRENT_DATE)
  ORDER BY cpa.valid_from DESC
  LIMIT 1;

  -- ============================================================================
  -- PRIORITÉ 2 : Prix liste canal (price_list_items) avec remise quantité
  -- ============================================================================
  IF v_price IS NULL THEN
    SELECT
      pli.price_eur,
      'pricelist',
      COALESCE(pli.discount_percentage, 0),
      pl.id,
      NULL::UUID
    INTO v_price, v_source, v_discount, v_price_list_id, v_price_agreement_id
    FROM price_list_items pli
    JOIN price_lists pl ON pli.price_list_id = pl.id
    WHERE pl.channel = p_channel::price_channel
      AND pli.product_id = p_product_id
      AND pl.active = true
      AND (pl.valid_from IS NULL OR pl.valid_from <= CURRENT_DATE)
      AND (pl.valid_to IS NULL OR pl.valid_to >= CURRENT_DATE)
      AND (pli.min_quantity IS NULL OR pli.min_quantity <= p_quantity)
    ORDER BY pl.priority DESC, pli.min_quantity DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- ============================================================================
  -- PRIORITÉ 3 : Prix catalogue par défaut (products.price_ht)
  -- ============================================================================
  IF v_price IS NULL THEN
    SELECT
      p.price_ht,
      'catalog',
      0,
      NULL::UUID,
      NULL::UUID
    INTO v_price, v_source, v_discount, v_price_list_id, v_price_agreement_id
    FROM products p
    WHERE p.id = p_product_id;
  END IF;

  -- ============================================================================
  -- Exception si aucun prix trouvé
  -- ============================================================================
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Aucun prix trouvé pour produit % (customer: %, channel: %)',
      p_product_id, p_customer_id, p_channel;
  END IF;

  -- ============================================================================
  -- Retour résultat avec calcul prix final
  -- ============================================================================
  RETURN QUERY SELECT
    v_price,
    v_source,
    v_discount,
    ROUND(v_price * (1 - v_discount / 100), 2),
    v_price_list_id,
    v_price_agreement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_applicable_price(UUID, UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- 2. Commentaires
COMMENT ON FUNCTION get_applicable_price IS 'SSOT: Calcule prix applicable produit selon priorité (négocié > liste canal > catalogue)';

-- 3. Tests validation
DO $$
DECLARE
  v_test_product UUID;
  v_test_customer UUID;
  v_result RECORD;
BEGIN
  -- Récupérer 1er produit et client pour test
  SELECT id INTO v_test_product FROM products LIMIT 1;
  SELECT id INTO v_test_customer FROM organisations WHERE customer_type = 'individual' LIMIT 1;

  -- Test prix catalogue (priorité 3)
  SELECT * INTO v_result FROM get_applicable_price(v_test_product, v_test_customer, 'individual', 'ecommerce', 1);

  RAISE NOTICE '✅ Test get_applicable_price() OK - Source: %, Prix: %€', v_result.source, v_result.price_eur;
END $$;

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 - RPC get_applicable_price() créée avec succès';
  RAISE NOTICE '🎯 Logique priorité: 1) Négocié, 2) Liste canal, 3) Catalogue';
  RAISE NOTICE '🔧 Usage: SELECT * FROM get_applicable_price(product_id, customer_id, customer_type, channel, quantity)';
END $$;
```

---

#### **Migration 6 : Modifications Tables Existantes**
**Fichier** : `supabase/migrations/20251011_006_alter_existing_tables_pricing.sql`

```sql
-- ============================================================================
-- Migration: Modifications Tables Existantes pour Système Prix
-- Date: 2025-10-11
-- Description: Ajouts champs audit trail prix + liens listes
-- ============================================================================

-- 1. Ajout champs sales_order_items (Audit trail prix)
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS applied_price_source TEXT
    CHECK (applied_price_source IN ('manual', 'negotiated', 'pricelist', 'catalog')),
  ADD COLUMN IF NOT EXISTS original_price_eur DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS final_price_eur DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_agreement_id UUID REFERENCES customer_price_agreements(id);

COMMENT ON COLUMN sales_order_items.applied_price_source IS 'Source prix: manual (override), negotiated (accord), pricelist (canal), catalog (défaut)';
COMMENT ON COLUMN sales_order_items.original_price_eur IS 'Prix avant remises (pour historique)';
COMMENT ON COLUMN sales_order_items.final_price_eur IS 'Prix final après remises';

-- 2. Ajout champ organisations (Lien liste prix par défaut)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS default_price_list_id UUID REFERENCES price_lists(id);

COMMENT ON COLUMN organisations.default_price_list_id IS 'Liste prix par défaut assignée à ce client';

-- 3. INDEX
CREATE INDEX IF NOT EXISTS idx_sales_order_items_price_agreement ON sales_order_items(price_agreement_id);
CREATE INDEX IF NOT EXISTS idx_organisations_default_price_list ON organisations(default_price_list_id);

-- Notification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 - Tables existantes modifiées avec succès';
  RAISE NOTICE '📊 sales_order_items: +applied_price_source, +original_price_eur, +final_price_eur, +price_agreement_id';
  RAISE NOTICE '📊 organisations: +default_price_list_id';
END $$;
```

---

### 1.3 Workflow Intégration Stock/Commandes

#### **Trigger Automatique Earn Points (Post-Order Delivery)**

```sql
-- Trigger automatique attribution points après livraison commande
CREATE OR REPLACE FUNCTION auto_earn_loyalty_points_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Si commande livrée + client est particulier → Attribuer points
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Vérifier si client particulier
    IF EXISTS (
      SELECT 1 FROM organisations
      WHERE id = NEW.customer_id AND customer_type = 'individual'
    ) THEN
      -- Attribuer points (asynchrone, gestion erreur silencieuse)
      BEGIN
        PERFORM earn_loyalty_points(NEW.customer_id, NEW.id);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Échec attribution points fidélité commande %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_orders_auto_earn_points
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered')
  EXECUTE FUNCTION auto_earn_loyalty_points_on_delivery();
```

---

## PARTIE 2 : MODIFICATIONS FRONTEND

### 2.1 Hooks React Nouveaux

#### **Hook use-price-lists.ts**

```typescript
// src/hooks/use-price-lists.ts
import { useSupabaseQuery } from './use-supabase-query';

export interface PriceList {
  id: string;
  name: string;
  channel: 'ecommerce' | 'showroom' | 'b2b';
  priority: number;
  active: boolean;
  valid_from?: string;
  valid_to?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  price_eur: number;
  min_quantity?: number;
  discount_percentage?: number;
}

export function usePriceLists() {
  const { data: priceLists, isLoading, error } = useSupabaseQuery<PriceList>(
    'price_lists',
    {
      filters: { active: true },
      orderBy: { column: 'priority', ascending: false }
    }
  );

  return {
    priceLists: priceLists || [],
    isLoading,
    error
  };
}

export function usePriceListItems(priceListId: string) {
  const { data: items, isLoading } = useSupabaseQuery<PriceListItem>(
    'price_list_items',
    {
      filters: { price_list_id: priceListId }
    }
  );

  return {
    items: items || [],
    isLoading
  };
}
```

---

#### **Hook use-applicable-price.ts (Appel RPC)**

```typescript
// src/hooks/use-applicable-price.ts
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface ApplicablePriceResult {
  price_eur: number;
  source: 'manual' | 'negotiated' | 'pricelist' | 'catalog';
  discount_percentage: number;
  final_price_eur: number;
  price_list_id?: string;
  price_agreement_id?: string;
}

export function useApplicablePrice(
  productId: string,
  customerId: string,
  customerType: 'organisation' | 'individual',
  channel: 'ecommerce' | 'showroom' | 'b2b',
  quantity: number = 1
) {
  return useQuery({
    queryKey: ['applicable_price', productId, customerId, channel, quantity],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_applicable_price', {
        p_product_id: productId,
        p_customer_id: customerId,
        p_customer_type: customerType,
        p_channel: channel,
        p_quantity: quantity
      });

      if (error) throw error;
      return data[0] as ApplicablePriceResult;
    },
    enabled: !!productId && !!customerId,
    staleTime: 5 * 60 * 1000 // 5 min cache
  });
}
```

---

### 2.2 Composants UI Modifiés

#### **SalesOrderFormModal - Intégration Prix Suggéré**

**Modifications** :
```typescript
// src/components/business/sales-order-form-modal.tsx (Ligne ~150)

// ❌ ANCIEN CODE (Prix fixe catalogue)
const addProductToOrder = (product: Product) => {
  const newItem = {
    product_id: product.id,
    quantity: 1,
    unit_price_ht: product.price_ht,
    discount_percentage: 0
  };
  setOrderItems([...orderItems, newItem]);
};

// ✅ NOUVEAU CODE (Prix suggéré intelligent)
const addProductToOrder = async (product: Product) => {
  if (!selectedCustomer) {
    toast.error('Veuillez sélectionner un client');
    return;
  }

  // Appel RPC get_applicable_price()
  const priceData = await getApplicablePrice({
    product_id: product.id,
    customer_id: selectedCustomer.id,
    customer_type: selectedCustomer.customer_type || 'organisation',
    channel: selectedPriceList?.channel || 'ecommerce',
    quantity: 1
  });

  const newItem = {
    product_id: product.id,
    quantity: 1,
    unit_price_ht: priceData.final_price_eur, // Prix suggéré
    discount_percentage: priceData.discount_percentage,
    applied_price_source: priceData.source, // Traçabilité
    original_price_eur: priceData.price_eur,
    final_price_eur: priceData.final_price_eur,
    price_agreement_id: priceData.price_agreement_id,
    is_manual_override: false // Flag pour override manuel
  };

  setOrderItems([...orderItems, newItem]);

  // Toast informatif
  toast.success(
    `Prix suggéré: ${priceData.final_price_eur}€ (Source: ${getSourceLabel(priceData.source)})`
  );
};
```

---

#### **Nouveau Composant : PriceSuggestionPanel**

```typescript
// src/components/business/price-suggestion-panel.tsx
import { useApplicablePrice } from '@/hooks/use-applicable-price';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface PriceSuggestionPanelProps {
  productId: string;
  customerId: string;
  customerType: 'organisation' | 'individual';
  channel: 'ecommerce' | 'showroom' | 'b2b';
  quantity: number;
}

export function PriceSuggestionPanel({
  productId,
  customerId,
  customerType,
  channel,
  quantity
}: PriceSuggestionPanelProps) {
  const { data: priceData, isLoading } = useApplicablePrice(
    productId,
    customerId,
    customerType,
    channel,
    quantity
  );

  if (isLoading) return <div>Calcul prix...</div>;
  if (!priceData) return null;

  const sourceLabels = {
    negotiated: { label: 'Prix négocié', color: 'green' },
    pricelist: { label: 'Prix liste canal', color: 'blue' },
    catalog: { label: 'Prix catalogue', color: 'gray' },
    manual: { label: 'Prix manuel', color: 'orange' }
  };

  const sourceInfo = sourceLabels[priceData.source];

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Prix suggéré
        </span>
        <Badge variant={sourceInfo.color}>{sourceInfo.label}</Badge>
      </div>

      <div className="text-2xl font-bold text-gray-900">
        {priceData.final_price_eur.toFixed(2)}€
      </div>

      {priceData.discount_percentage > 0 && (
        <div className="text-sm text-gray-600 mt-1">
          Prix base: {priceData.price_eur.toFixed(2)}€
          {' '}(-{priceData.discount_percentage}%)
        </div>
      )}

      <div className="flex items-start gap-2 mt-3 text-xs text-gray-500">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Ce prix est calculé automatiquement selon vos accords commerciaux
          et peut être modifié manuellement si nécessaire.
        </span>
      </div>
    </div>
  );
}
```

---

#### **Nouveau Composant : LoyaltyPointsDisplay**

```typescript
// src/components/business/loyalty-points-display.tsx
import { useLoyaltyPoints } from '@/hooks/use-loyalty-points';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';

interface LoyaltyPointsDisplayProps {
  customerId: string;
}

export function LoyaltyPointsDisplay({ customerId }: LoyaltyPointsDisplayProps) {
  const { data: loyaltyData, isLoading } = useLoyaltyPoints(customerId);

  if (isLoading) return <div>Chargement points...</div>;
  if (!loyaltyData) return null;

  const tierInfo = {
    bronze: { label: 'Bronze', color: 'bg-amber-700', icon: '🥉' },
    silver: { label: 'Silver', color: 'bg-gray-400', icon: '🥈' },
    gold: { label: 'Gold', color: 'bg-yellow-500', icon: '🥇' },
    platinum: { label: 'Platinum', color: 'bg-purple-600', icon: '💎' }
  };

  const currentTier = tierInfo[loyaltyData.tier];
  const euroValue = (loyaltyData.points_balance * 0.01).toFixed(2);

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">
            Programme Fidélité
          </span>
        </div>
        <Badge className={currentTier.color}>
          {currentTier.icon} {currentTier.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Points disponibles</div>
          <div className="text-2xl font-bold text-purple-600">
            {loyaltyData.points_balance.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Valeur en réduction</div>
          <div className="text-2xl font-bold text-green-600">
            {euroValue}€
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <TrendingUp className="w-4 h-4" />
        <span>1€ dépensé = 1 point | 100 points = 1€ de réduction</span>
      </div>
    </div>
  );
}
```

---

## PARTIE 3 : ROADMAP DÉVELOPPEMENT

### 3.1 Priorisation Tâches

#### **Critères Priorisation**
- **P0 (Bloquant Production)** : Sans cette feature, application non déployable
- **P1 (Critique Business)** : Impact direct CA/expérience client
- **P2 (Amélioration)** : Optimisation process existants
- **P3 (Nice-to-Have)** : Futures évolutions

---

### 3.2 Roadmap Détaillée

#### **📌 P0 - BLOQUANTS PRODUCTION (Hors Scope Mission)**

| Tâche | Description | Effort | Bloqueur ? |
|-------|-------------|--------|-----------|
| **Table payments** | Encaissements clients + Décaissements fournisseurs | 3 jours | ✅ OUI |
| **Table invoices** | Factures clients et fournisseurs | 5 jours | ✅ OUI |
| **Workflow Commande→Facture→Paiement** | Chaîne complète facturation | 3 jours | ✅ OUI |
| **Génération PDF factures** | Export factures clients (template + data) | 3 jours | ✅ OUI |
| **Dashboard trésorerie** | Suivi paiements attendus/reçus | 2 jours | ⚠️ RECOMMANDÉ |

**Total P0** : **16 jours** (3.2 semaines)
**Assignation** : Équipe séparée (hors scope mission pricing)

---

#### **📌 P1 - SYSTÈME PRIX MULTI-CANAUX (Mission Actuelle)**

| Sprint | Tâche | Description | Fichiers Créés/Modifiés | Effort |
|--------|-------|-------------|-------------------------|--------|
| **Sprint 1** | Migration 001 | Table price_lists + price_list_items | `20251011_001_create_price_lists_system.sql` | 1 jour |
| | Migration 002 | Table customer_price_agreements | `20251011_002_create_customer_price_agreements.sql` | 0.5 jour |
| | Hook use-price-lists | CRUD listes prix React | `src/hooks/use-price-lists.ts` | 0.5 jour |
| | UI Gestion Listes Prix | CRUD listes prix (admin) | `src/app/admin/price-lists/page.tsx` + modal | 2 jours |
| **Sprint 2** | Migration 003 | Table discount_tiers (BFA) | `20251011_003_create_discount_tiers_bfa.sql` | 1 jour |
| | RPC calculate_bfa | Calcul remise BFA | Inclus migration 003 | - |
| | Hook use-discount-tiers | CRUD paliers BFA React | `src/hooks/use-discount-tiers.ts` | 0.5 jour |
| | Dashboard BFA Client | Affichage progression paliers | `src/components/business/bfa-dashboard.tsx` | 1.5 jour |
| **Sprint 3** | Migration 004 | Tables loyalty_points + transactions | `20251011_004_create_loyalty_system.sql` | 1 jour |
| | RPC earn/redeem points | Logique fidélité | Inclus migration 004 | - |
| | Hook use-loyalty-points | CRUD points React | `src/hooks/use-loyalty-points.ts` | 0.5 jour |
| | Composant LoyaltyPointsDisplay | Widget fidélité | `src/components/business/loyalty-points-display.tsx` | 1 jour |
| **Sprint 4** | Migration 005 | RPC get_applicable_price | `20251011_005_create_rpc_get_applicable_price.sql` | 1 jour |
| | Hook use-applicable-price | Appel RPC React | `src/hooks/use-applicable-price.ts` | 0.5 jour |
| | Migration 006 | Modifications tables existantes | `20251011_006_alter_existing_tables_pricing.sql` | 0.5 jour |
| | Modification SalesOrderForm | Intégration prix suggéré | `src/components/business/sales-order-form-modal.tsx` | 2 jours |
| | Composant PriceSuggestionPanel | Widget prix suggéré | `src/components/business/price-suggestion-panel.tsx` | 1 jour |
| **Sprint 5** | Tests Playwright | Tests critiques workflows prix | `tests/pricing-workflow.spec.ts` | 1.5 jour |
| | Documentation | Guide utilisateur système prix | `docs/guides/GUIDE-SYSTEME-PRIX.md` | 0.5 jour |
| | Validation Business | Revue avec équipe commerciale | Réunion validation | 0.5 jour |

**Total P1** : **17 jours** (~3.5 semaines / 1 dev full-time)

---

#### **📌 P2 - OPTIMISATIONS (Post-MVP)**

| Tâche | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **Table price_history** | Historique modifications prix (audit) | 1 jour | MOYENNE |
| **Cache Redis prix** | Cache prix fréquents (performance) | 2 jours | MOYENNE |
| **Dashboard BI Prix** | Analytics marges, évolutions prix | 3 jours | MOYENNE |
| **Export grilles tarifaires** | Excel pour équipe commerciale | 1 jour | BASSE |
| **Workflow approval prix** | Si marge <15% ou remise >25% | 2 jours | MOYENNE |
| **Table promotions** | Promotions temporaires par catégorie | 3 jours | MOYENNE |
| **Notifications prix** | Alertes changements prix produits | 1 jour | BASSE |

**Total P2** : **13 jours** (~2.5 semaines)

---

#### **📌 P3 - ÉVOLUTIONS FUTURES (Long Terme)**

| Tâche | Description | Effort | Priorité |
|-------|-------------|--------|----------|
| **Dynamic Pricing AI** | Prix ajustés selon demande/stock | 10 jours | BASSE |
| **Multi-devises** | Support USD, GBP, CHF | 5 jours | MOYENNE |
| **Subscription Pricing** | Abonnements récurrents | 8 jours | BASSE |
| **API Prix Externe** | Webhooks Shopify, WooCommerce | 5 jours | BASSE |

---

### 3.3 Planning Sprint Suggéré (Gantt Textuel)

```
SEMAINE 1 (Jours 1-5) : Sprint 1 - Foundation Listes Prix
├── J1 : Migration 001 (price_lists) + Migration 002 (agreements)
├── J2 : Hook use-price-lists + Début UI Admin
├── J3-4 : UI Admin Gestion Listes Prix (CRUD complet)
└── J5 : Tests + Review

SEMAINE 2 (Jours 6-10) : Sprint 2 - BFA + Sprint 3 - Fidélité
├── J6 : Migration 003 (discount_tiers) + Hook use-discount-tiers
├── J7-8 : Dashboard BFA Client (progression paliers)
├── J9 : Migration 004 (loyalty) + Hook use-loyalty-points
└── J10 : Composant LoyaltyPointsDisplay + Tests

SEMAINE 3 (Jours 11-15) : Sprint 4 - Intégration SalesOrderForm
├── J11 : Migration 005 (RPC get_applicable_price) + Migration 006
├── J12 : Hook use-applicable-price
├── J13-14 : Modification SalesOrderForm (UI prix suggéré)
└── J15 : Composant PriceSuggestionPanel + Tests

SEMAINE 4 (Jours 16-17) : Sprint 5 - Tests & Documentation
├── J16 : Tests Playwright workflows complets
└── J17 : Documentation + Validation Business + Déploiement
```

---

### 3.4 Estimations Effort Détaillées

#### **Par Type de Tâche**
- **Migrations SQL** : 6 fichiers × 0.5-1 jour = **4.5 jours**
- **Hooks React** : 4 hooks × 0.5 jour = **2 jours**
- **Composants UI** : 4 composants × 1-2 jours = **6.5 jours**
- **Tests + Documentation** : **2 jours**
- **Validation + Buffer** : **2 jours**

**Total P1** : **17 jours** (confirmé)

#### **Par Compétence Requise**
- **Backend/SQL** : 7 jours (Migrations + RPC)
- **Frontend/React** : 8 jours (Hooks + UI)
- **Tests/QA** : 2 jours (Playwright + Manuel)

**Profil Développeur Recommandé** : Full-Stack (Next.js + Supabase)

---

## PARTIE 4 : CRITÈRES SUCCÈS & VALIDATION

### 4.1 Acceptance Criteria (Par Feature)

#### **Feature 1 : Listes Prix Multi-Canaux**
- ✅ Admin peut créer listes prix (ecommerce, showroom, b2b)
- ✅ Admin peut définir prix produits par liste
- ✅ Admin peut configurer paliers quantité (remises volume)
- ✅ Clients voient automatiquement leur liste prix assignée
- ✅ Changement canal = changement prix automatique

#### **Feature 2 : Prix Négociés Clients**
- ✅ Commercial peut créer accord prix spécifique client+produit
- ✅ Validation manager si prix < 80% catalogue
- ✅ Période validité configurable (valid_from → valid_to)
- ✅ Prix négocié prioritaire sur liste canal
- ✅ Historique accords visible

#### **Feature 3 : BFA (Bonus Fin d'Année)**
- ✅ Admin peut configurer paliers BFA par client pro
- ✅ Calcul automatique CA annuel client
- ✅ Dashboard client affiche progression vers prochain palier
- ✅ RPC calculate_bfa retourne remise applicable
- ✅ Export rapport BFA annuel (Excel)

#### **Feature 4 : Programme Fidélité**
- ✅ 1€ dépensé = 1 point (automatique post-livraison)
- ✅ 100 points = 1€ de réduction
- ✅ Tiers calculés automatiquement (bronze→platinum)
- ✅ Client voit solde points + tier + historique
- ✅ Utilisation points lors commande (UI redemption)

#### **Feature 5 : Suggestion Prix Intelligente**
- ✅ SalesOrderForm affiche prix suggéré automatique
- ✅ Source prix visible (négocié/liste/catalogue)
- ✅ Override manuel prix possible (avec log)
- ✅ Champs audit trail enregistrés (applied_price_source)
- ✅ Performance <50ms (p99)

---

### 4.2 Tests Critiques (Playwright)

```typescript
// tests/pricing-workflow.spec.ts

describe('Système Prix Multi-Canaux', () => {

  test('Prix suggéré correct selon priorité', async ({ page }) => {
    // 1. Créer prix négocié client A + produit X = 100€
    // 2. Créer prix liste B2B produit X = 120€
    // 3. Prix catalogue produit X = 150€
    // 4. Créer commande client A → Prix suggéré = 100€ (négocié)
    // 5. Vérifier source = 'negotiated'
    // 6. Supprimer prix négocié
    // 7. Créer commande client A → Prix suggéré = 120€ (liste B2B)
    // 8. Vérifier source = 'pricelist'
  });

  test('Remise quantité appliquée automatiquement', async ({ page }) => {
    // 1. Créer liste prix B2B avec paliers:
    //    - 1-9 unités = 100€
    //    - 10+ unités = 90€ (-10%)
    // 2. Créer commande 5 unités → Prix = 100€
    // 3. Modifier quantité à 12 → Prix = 90€ automatique
    // 4. Vérifier discount_percentage = 10
  });

  test('BFA calculé correctement (retroactive)', async ({ page }) => {
    // 1. Créer paliers BFA client pro:
    //    - 0-10k€ = 0%
    //    - 10k-50k€ = 5%
    //    - 50k+€ = 10%
    // 2. Simuler CA annuel = 55,000€
    // 3. Appeler calculate_bfa_discount()
    // 4. Vérifier remise = 55,000€ * 10% = 5,500€
  });

  test('Points fidélité gagnés automatiquement', async ({ page }) => {
    // 1. Créer client particulier (solde = 0 points)
    // 2. Créer commande 250€ TTC
    // 3. Marquer commande 'delivered'
    // 4. Vérifier solde points = 250 (trigger auto)
    // 5. Vérifier tier = 'silver' (500 points requis)
  });

  test('Utilisation points fidélité (redemption)', async ({ page }) => {
    // 1. Client avec 500 points
    // 2. Créer commande 100€
    // 3. Utiliser 200 points → Réduction 2€
    // 4. Vérifier total commande = 98€
    // 5. Vérifier solde points = 300
  });

  test('Audit trail prix enregistré', async ({ page }) => {
    // 1. Créer commande avec prix suggéré
    // 2. Vérifier sales_order_items.applied_price_source = 'pricelist'
    // 3. Override manuel prix à 80€
    // 4. Vérifier applied_price_source = 'manual'
    // 5. Vérifier original_price_eur != final_price_eur
  });

});
```

---

### 4.3 Métriques Performance Cibles

| RPC/Fonction | Performance Cible (p99) | Monitoring |
|--------------|------------------------|-----------|
| `get_applicable_price()` | <50ms | ✅ Critical |
| `calculate_bfa_discount()` | <200ms | ✅ Critical |
| `earn_loyalty_points()` | <100ms | ⚠️ Important |
| `redeem_loyalty_points()` | <100ms | ⚠️ Important |

**Cache Strategy** :
- Prix lists : Cache 5min (stale-while-revalidate)
- BFA : Cache 24h (recalcul quotidien)
- Loyalty points : Cache 1min (temps réel acceptable)

---

## CONCLUSION

### Résumé Livrable Mission

**Scope P1 - Système Prix Multi-Canaux** :
- ✅ **6 tables DB** (price_lists, price_list_items, customer_price_agreements, discount_tiers, loyalty_points, loyalty_transactions)
- ✅ **6 migrations SQL** (testées et commentées)
- ✅ **3 RPC critiques** (get_applicable_price, calculate_bfa_discount, earn_loyalty_points)
- ✅ **4 hooks React** (use-price-lists, use-applicable-price, use-discount-tiers, use-loyalty-points)
- ✅ **4 composants UI** (PriceSuggestionPanel, LoyaltyPointsDisplay, BfaDashboard, PriceListsAdmin)
- ✅ **Tests Playwright** (5 workflows critiques)
- ✅ **Documentation** (Guide utilisateur système prix)

**Effort Total** : **17 jours/dev** (~3.5 semaines)

**Impact Business Attendu** :
- 📈 **Prix compétitifs B2B** (listes prix segmentées)
- 🤝 **Mémoire accords commerciaux** (prix négociés persistés)
- 💰 **Fidélisation clients pros** (BFA automatique)
- ⭐ **Engagement clients particuliers** (points fidélité)
- ⚡ **Suggestion prix intelligente** (<50ms temps réel)

**ROI Estimé** :
- **-30% temps création commande** (prix suggéré automatique vs saisie manuelle)
- **+15% rétention clients pros** (BFA + prix négociés)
- **+20% commandes répétées B2C** (fidélité points)
- **100% cohérence prix** (SSOT RPC centralisé)

---

**Plan Développement rédigé par** : Claude Code - Orchestrateur Système Vérone
**Pour** : Implémentation système prix multi-canaux production-ready
**Date** : 10 Octobre 2025

**Prêt pour exécution** : ✅ Migrations SQL + Code Frontend + Tests + Documentation

---

### Prochaines Étapes Recommandées

1. **Validation Plan** : Revue architecture avec équipe tech (1h)
2. **Assignation Dev** : 1 dev full-stack (Next.js + Supabase) × 3.5 semaines
3. **Setup Environnement** : Branche `feature/pricing-system`, DB staging
4. **Sprint 1** : Démarrage migrations + hooks (Semaine 1)
5. **Checkpoints** : Review hebdomadaire progress + blockers
6. **Go-Live** : Tests Playwright + Validation Business + Déploiement production

**Bon développement ! 🚀**
