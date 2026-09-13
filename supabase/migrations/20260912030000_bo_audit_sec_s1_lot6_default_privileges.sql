-- [BO-AUDIT-SEC-S1] Lot 6 — garde-fou permanent : toute NOUVELLE fonction de `public` naît fermée au public.
--
-- Appliquée en production le 2026-09-12 via execute_sql (accord écrit de Roméo), inscrite au carnet
-- supabase_migrations.schema_migrations : 20260912030000 bo_audit_sec_s1_lot6_default_privileges.
--
-- Avant : droits par défaut des fonctions créées par `postgres` (propriétaire des 574 fonctions de `public`) =
--   EXECUTE implicite à PUBLIC + {anon, authenticated, service_role} dans `public`
--   ⇒ chaque nouvelle fonction naissait exécutable sans connexion.
-- Après :
--   - global (rôle postgres)   : {postgres=X}                                  (PUBLIC retiré)
--   - schéma public (postgres) : {postgres=X, authenticated=X, service_role=X} (anon retiré)
-- Le retrait de PUBLIC doit être global : un droit par défaut accordé globalement ne peut pas être retiré par schéma.
--
-- Démonstration préalable (bloc annulé par exception, rien de conservé) : une fonction créée après ces deux
-- instructions → anon=false, PUBLIC=false, authenticated=true, service_role=true.
-- Aucune fonction existante n'est modifiée (les droits par défaut ne s'appliquent qu'aux objets créés ensuite).
--
-- Conséquence : une future fonction destinée aux visiteurs non connectés (site, pages LinkMe publiques, règle RLS
-- visible d'anon) doit porter un `GRANT EXECUTE … TO anon;` explicite dans sa migration (.claude/rules/database.md R-GRANT).
-- Limite : les fonctions créées par `supabase_admin` gardent les droits par défaut de Supabase (non modifiables avec
-- le rôle postgres) ; le contrôle CI des advisors (bloquant sur les deux compteurs SECURITY DEFINER) couvre ce cas.
--
-- Retour arrière :
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
