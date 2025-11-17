-- Migration: Ajouter champs conditions commerciales à la table organisations
-- Date: 2025-11-17
-- Description: Ajoute payment_terms, minimum_order_amount, delivery_time_days, currency
--              pour supporter les conditions commerciales clients et fournisseurs

-- Ajouter les colonnes manquantes
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS minimum_order_amount NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_time_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$');

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_organisations_payment_terms
ON organisations(payment_terms)
WHERE payment_terms IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organisations_currency
ON organisations(currency)
WHERE currency IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN organisations.payment_terms IS 'Conditions de paiement (ex: "0 jours", "30 jours", "60 jours", "90 jours")';
COMMENT ON COLUMN organisations.minimum_order_amount IS 'Montant minimum: pour suppliers = montant minimum de commande, pour customers = montant minimum pour livraison gratuite';
COMMENT ON COLUMN organisations.delivery_time_days IS 'Délai de livraison habituel en jours ouvrés';
COMMENT ON COLUMN organisations.currency IS 'Devise utilisée (format ISO 4217: EUR, USD, GBP, CHF)';
