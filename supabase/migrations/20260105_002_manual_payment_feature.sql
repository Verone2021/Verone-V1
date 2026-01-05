-- Migration: Fonctionnalité Paiement Manuel
-- Date: 2026-01-05
-- Description: Permet de marquer manuellement une commande comme payée

-- 1. Créer le type ENUM pour les types de paiement manuel
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'manual_payment_type') THEN
        CREATE TYPE manual_payment_type AS ENUM (
            'cash',           -- Espèces
            'check',          -- Chèque
            'transfer_other', -- Virement autre banque
            'card',           -- Carte bancaire (hors Qonto)
            'compensation',   -- Compensation
            'verified_bubble' -- Vérifié dans Bubble
        );
    END IF;
END$$;

-- 2. Ajouter les colonnes à sales_orders
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS manual_payment_type manual_payment_type,
ADD COLUMN IF NOT EXISTS manual_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manual_payment_reference TEXT,
ADD COLUMN IF NOT EXISTS manual_payment_note TEXT,
ADD COLUMN IF NOT EXISTS manual_payment_by UUID REFERENCES auth.users(id);

-- 3. Créer ou remplacer la fonction de mise à jour du statut de paiement
CREATE OR REPLACE FUNCTION update_sales_order_payment_status_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour payment_status_v2 basé sur:
    -- 1. Existence d'un lien transaction_document_links
    -- 2. OU manual_payment_type est renseigné
    UPDATE sales_orders
    SET payment_status_v2 = CASE
        WHEN EXISTS (
            SELECT 1 FROM transaction_document_links tdl
            WHERE tdl.sales_order_id = sales_orders.id
        ) THEN 'paid'
        WHEN sales_orders.manual_payment_type IS NOT NULL THEN 'paid'
        ELSE 'pending'
    END
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer fonction pour mettre à jour le statut quand manual_payment_type change
CREATE OR REPLACE FUNCTION update_sales_order_manual_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si manual_payment_type est défini, mettre payment_status_v2 à 'paid'
    IF NEW.manual_payment_type IS NOT NULL AND OLD.manual_payment_type IS NULL THEN
        NEW.payment_status_v2 := 'paid';
        NEW.manual_payment_date := COALESCE(NEW.manual_payment_date, NOW());
    END IF;

    -- Si manual_payment_type est supprimé, recalculer le statut
    IF NEW.manual_payment_type IS NULL AND OLD.manual_payment_type IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM transaction_document_links tdl
            WHERE tdl.sales_order_id = NEW.id
        ) THEN
            NEW.payment_status_v2 := 'paid';
        ELSE
            NEW.payment_status_v2 := 'pending';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger sur sales_orders pour manual_payment
DROP TRIGGER IF EXISTS trg_update_sales_order_manual_payment ON sales_orders;
CREATE TRIGGER trg_update_sales_order_manual_payment
    BEFORE UPDATE OF manual_payment_type ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_order_manual_payment_status();

-- 6. Commentaires sur les colonnes
COMMENT ON COLUMN sales_orders.manual_payment_type IS 'Type de paiement manuel: cash, check, transfer_other, card, compensation, verified_bubble';
COMMENT ON COLUMN sales_orders.manual_payment_date IS 'Date du paiement manuel';
COMMENT ON COLUMN sales_orders.manual_payment_reference IS 'Référence du paiement manuel (numéro de chèque, etc.)';
COMMENT ON COLUMN sales_orders.manual_payment_note IS 'Note sur le paiement manuel';
COMMENT ON COLUMN sales_orders.manual_payment_by IS 'Utilisateur ayant enregistré le paiement manuel';

-- 7. Ajouter les mêmes colonnes à purchase_orders pour cohérence
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS manual_payment_type manual_payment_type,
ADD COLUMN IF NOT EXISTS manual_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manual_payment_reference TEXT,
ADD COLUMN IF NOT EXISTS manual_payment_note TEXT,
ADD COLUMN IF NOT EXISTS manual_payment_by UUID REFERENCES auth.users(id);

-- 8. Créer fonction similaire pour purchase_orders
CREATE OR REPLACE FUNCTION update_purchase_order_manual_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manual_payment_type IS NOT NULL AND OLD.manual_payment_type IS NULL THEN
        NEW.payment_status_v2 := 'paid';
        NEW.manual_payment_date := COALESCE(NEW.manual_payment_date, NOW());
    END IF;

    IF NEW.manual_payment_type IS NULL AND OLD.manual_payment_type IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM transaction_document_links tdl
            WHERE tdl.purchase_order_id = NEW.id
        ) THEN
            NEW.payment_status_v2 := 'paid';
        ELSE
            NEW.payment_status_v2 := 'pending';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_purchase_order_manual_payment ON purchase_orders;
CREATE TRIGGER trg_update_purchase_order_manual_payment
    BEFORE UPDATE OF manual_payment_type ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_manual_payment_status();
