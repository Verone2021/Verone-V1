-- BO-FIN-046 — fix sécurité : ajouter SET search_path sur set_updated_by
--
-- Le reviewer-agent et l'auditeur Supabase signalent une fonction
-- SECURITY DEFINER sans clause SET search_path. C'est un vecteur de
-- search-path injection documenté par Supabase. La règle .claude/rules/database.md
-- exige `SET search_path = public` sur toutes les fonctions SECURITY DEFINER.
--
-- Migration additive, append-only. Pas de logique métier modifiée.

BEGIN;

CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

COMMIT;
