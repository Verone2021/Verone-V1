/**
 * 🔧 Migration: Add customer_type column
 *
 * Ajoute la colonne customer_type manquante pour distinguer
 * les clients professionnels des particuliers
 */

-- Ajouter la colonne customer_type si elle n'existe pas
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS customer_type TEXT
CHECK (customer_type IN ('professional', 'individual'));

-- Ajouter la colonne prepayment_required si elle n'existe pas
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS prepayment_required BOOLEAN DEFAULT false;

-- Mettre à jour les clients existants avec un type par défaut
-- Basé sur les indices dans le nom ou les notes
UPDATE organisations
SET customer_type =
    CASE
        WHEN type = 'customer' AND (
            LOWER(name) LIKE '%hotel%' OR
            LOWER(name) LIKE '%restaurant%' OR
            LOWER(name) LIKE '%boutique%' OR
            LOWER(name) LIKE '%studio%' OR
            LOWER(name) LIKE '%entreprise%' OR
            LOWER(name) LIKE '%sarl%' OR
            LOWER(name) LIKE '%sas%' OR
            siret IS NOT NULL OR
            vat_number IS NOT NULL
        ) THEN 'professional'
        WHEN type = 'customer' THEN 'individual'
        ELSE NULL
    END
WHERE type = 'customer' AND customer_type IS NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_organisations_customer_type
ON organisations(customer_type)
WHERE type = 'customer';

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN organisations.customer_type IS 'Type de client: professional pour B2B, individual pour B2C';
COMMENT ON COLUMN organisations.prepayment_required IS 'Indique si le prépaiement est requis pour ce client';