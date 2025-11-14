-- Migration: Ajout colonnes content + content_value pour Packlink
-- Date: 2025-11-14
-- Auteur: Claude Code
-- Description: Ajoute les colonnes content (description contenu colis) et content_value (valeur déclarée)
--              pour conformité douanes Packlink

\echo '🚀 Migration: Ajout colonnes content et content_value à shipments';

-- Colonne content (description contenu colis)
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN shipments.content IS 'Description du contenu du colis (requis pour douanes internationales)';

-- Colonne content_value (valeur déclarée en EUR)
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS content_value DECIMAL(10,2);

COMMENT ON COLUMN shipments.content_value IS 'Valeur déclarée du contenu en EUR (requis pour douanes)';

\echo '✅ Colonnes content et content_value ajoutées avec succès';
