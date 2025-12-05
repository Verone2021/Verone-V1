-- Migration: Ajouter default_margin_rate à user_app_roles
-- Date: 2025-12-05
-- Description: Permet aux utilisateurs LinkMe de définir un taux de marge par défaut
--              utilisé lors de l'ajout de produits à leurs sélections

-- Ajouter la colonne default_margin_rate
ALTER TABLE user_app_roles
ADD COLUMN IF NOT EXISTS default_margin_rate NUMERIC(5,2) DEFAULT 15.00;

-- Ajouter contrainte de validation (entre 1% et 100%)
ALTER TABLE user_app_roles
ADD CONSTRAINT check_default_margin_rate_range
CHECK (default_margin_rate IS NULL OR (default_margin_rate >= 1 AND default_margin_rate <= 100));

-- Commentaire explicatif
COMMENT ON COLUMN user_app_roles.default_margin_rate IS
'Taux de marge par défaut (%) pour les sélections LinkMe. Min 1%, Max 100%. Utilisé comme valeur initiale lors de l''ajout de produits à une sélection.';

-- Mettre à jour la vue v_linkme_users pour inclure default_margin_rate
DROP VIEW IF EXISTS v_linkme_users;

CREATE VIEW v_linkme_users AS
SELECT
  uar.user_id,
  up.email,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  uar.role AS linkme_role,
  uar.enseigne_id,
  uar.organisation_id,
  uar.permissions,
  uar.is_active,
  uar.created_at AS role_created_at,
  uar.default_margin_rate,
  e.name AS enseigne_name,
  e.logo_url AS enseigne_logo,
  o.legal_name AS organisation_name,
  o.logo_url AS organisation_logo
FROM user_app_roles uar
JOIN user_profiles up ON up.id = uar.user_id
LEFT JOIN enseignes e ON e.id = uar.enseigne_id
LEFT JOIN organisations o ON o.id = uar.organisation_id
WHERE uar.app = 'linkme'
  AND uar.is_active = true;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_app_roles_default_margin
ON user_app_roles(default_margin_rate)
WHERE app = 'linkme' AND default_margin_rate IS NOT NULL;
