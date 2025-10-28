-- Migration: Ajouter fonction set_current_user_id pour Server Actions
-- Date: 2025-10-27
-- Description: Permet aux Server Actions de stocker l'utilisateur courant en session PostgreSQL
--              pour que les triggers (notamment stock_movements) puissent récupérer performed_by

CREATE OR REPLACE FUNCTION public.set_current_user_id(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stocker l'utilisateur courant dans une variable de configuration
  -- LOCAL à la transaction courante (sera automatiquement nettoyée à la fin de la transaction)
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$;

-- Commentaire de documentation
COMMENT ON FUNCTION public.set_current_user_id(uuid) IS
'Stocke l''ID utilisateur courant dans une variable de session PostgreSQL.
Utilisé par les Server Actions pour transmettre l''utilisateur aux triggers.
La variable est LOCAL à la transaction (nettoyée automatiquement).
Usage dans triggers: current_setting(''app.current_user_id'', true)::uuid';
