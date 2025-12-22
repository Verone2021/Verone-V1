-- =====================================================
-- MIGRATION: Rendre received_by nullable pour réceptions pending
-- Date: 2025-12-22
-- Description: Pour les réceptions d'affiliés en attente (pending),
--              received_by ne doit pas être requis car personne n'a encore réceptionné
-- =====================================================

-- Rendre received_by nullable
ALTER TABLE purchase_order_receptions
ALTER COLUMN received_by DROP NOT NULL;

-- Commentaire
COMMENT ON COLUMN purchase_order_receptions.received_by IS
'Utilisateur qui a receptionne. NULL pour les receptions en attente (pending).';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
