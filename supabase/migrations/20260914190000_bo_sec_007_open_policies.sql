-- =====================================================================
-- [BO-SEC-007] Fermer 4 policies « ouvertes à tous » (user_sessions, user_activity_logs,
--              notifications, stock_movements)
-- =====================================================================
--
--   ***  PRÉPARÉ, NON APPLIQUÉ — attend l'accord écrit de Roméo  ***
--
--   Ne pas appliquer sans cet accord. Touche la table protégée stock_movements
--   (policy uniquement : aucune fonction, aucun déclencheur modifié).
--
-- Constats du 2026-09-14 (base de production, lecture + essais annulés) :
--   1. user_sessions : policy `service_manage_sessions` FOR ALL TO public USING (true).
--      Mesuré : un visiteur non connecté (anon) lit les 12 828 sessions (user_id,
--      organisation_id, ip_address, user_agent, pages visitées) et peut les modifier /
--      supprimer. Un affilié LinkMe connecté lit aussi les 12 828 (au lieu de ses 90).
--   2. user_activity_logs : `service_insert_activity` INSERT TO public CHECK (true) →
--      anon peut insérer des journaux d'activité.
--   3. notifications : `notifications_insert_system` INSERT TO public CHECK (true) →
--      anon peut créer une notification.
--   4. stock_movements : `system_triggers_can_insert_stock_movements` INSERT TO public
--      CHECK (true) → anon peut créer un mouvement de stock (déclenche la mise à jour
--      du stock produit et des alertes).
--
-- Usages légitimes vérifiés (détail : docs/scratchpad/audit-2026-09-12/
-- BO-SEC-007-preparation-2026-09-14.md) :
--   - Aucun usage anon légitime en écriture sur les 4 tables (0 écriture anon dans
--     pg_stat_statements ; les 65 appels anon sur stock_movements sont des LECTURES du
--     back-office hors session, qui échouent déjà aujourd'hui en 42883).
--   - Suivi d'activité (back-office + LinkMe) : navigateur connecté, INSERT dans
--     user_activity_logs avec user_id = utilisateur connecté ; le déclencheur INVOKER
--     update_user_session fait un INSERT … ON CONFLICT DO UPDATE dans user_sessions
--     SOUS LE RÔLE authenticated → il faut une policy INSERT + UPDATE « ses propres
--     sessions » pour les affiliés LinkMe (les salariés passent par
--     backoffice_full_access_user_sessions).
--   - Fonctions SECURITY DEFINER (propriétaire postgres, BYPASSRLS) et routes serveur
--     service_role : non concernées par la RLS.
--   - Déclencheur INVOKER handle_so_item_quantity_change_confirmed (écrit
--     stock_movements) : ne s'active que pour une commande validée, que seul un salarié
--     peut modifier (policy affilié limitée aux brouillons) → couvert par
--     backoffice_full_access_stock_movements.
--   - Déclencheur INVOKER notify_affiliate_payment_request_paid (écrit notifications) :
--     passage à « payé » réservé aux salariés → couvert par
--     backoffice_full_access_notifications.
--
-- Essais dans une transaction annulée (2026-09-14) :
--   anon : sessions → 0 ligne puis « permission denied » après REVOKE ; tous les INSERT
--          refusés (42501) sur les 4 tables.
--   salarié back-office : lectures identiques (12 828 / 123 954 / 1 740 / 404) ;
--          suivi d'activité OK (création puis mise à jour de sa session) ; notification
--          pour un affilié OK ; mouvement de stock : RLS passée.
--   affilié LinkMe : ne voit plus que ses 90 sessions (0 d'autrui) ; suivi d'activité
--          OK ; refus d'écrire pour un autre utilisateur.
--
-- Types TS : inchangés (policies et droits seulement, aucune colonne).
-- Ordre des verrous : user_activity_logs AVANT user_sessions (même ordre que le
-- déclencheur du suivi d'activité, pour éviter un interblocage).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- 1. user_activity_logs : insertion réservée à l'utilisateur connecté, pour lui-même
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS service_insert_activity ON public.user_activity_logs;

CREATE POLICY users_insert_own_user_activity_logs ON public.user_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Conservées : backoffice_full_access_user_activity_logs (ALL authenticated
-- is_backoffice_user()), users_view_own_user_activity_logs (SELECT own).

-- ---------------------------------------------------------------------
-- 2. user_sessions : plus rien pour anon ; chacun écrit / lit ses propres sessions
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS service_manage_sessions ON public.user_sessions;

-- Nécessaires au déclencheur INVOKER update_user_session (INSERT … ON CONFLICT DO UPDATE)
-- quand l'activité vient d'un affilié LinkMe (hors back-office).
CREATE POLICY users_insert_own_user_sessions ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY users_update_own_user_sessions ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Conservées : backoffice_full_access_user_sessions (ALL authenticated
-- is_backoffice_user()), users_view_own_user_sessions (SELECT own).

-- ---------------------------------------------------------------------
-- 3. notifications : plus d'insertion ouverte à tous
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS notifications_insert_system ON public.notifications;

-- Conservées : backoffice_full_access_notifications (ALL authenticated
-- is_backoffice_user()), users_own_notifications (ALL authenticated own user_id).
-- Les déclencheurs de notification SECURITY DEFINER ne passent pas par la RLS.

-- ---------------------------------------------------------------------
-- 4. stock_movements (table protégée) : plus d'insertion ouverte à tous
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS system_triggers_can_insert_stock_movements ON public.stock_movements;

-- Conservées : backoffice_full_access_stock_movements, staff_insert_stock_movements,
-- staff_view_stock_movements, users_own_stock_movements,
-- « Utilisateurs peuvent consulter les mouvements de stock ».
-- Aucune fonction ni aucun déclencheur stock modifié.

-- ---------------------------------------------------------------------
-- 5. Droits de table d'anon (défense en profondeur, règle R-GRANT)
-- ---------------------------------------------------------------------
-- user_sessions : aucun usage anon → tout retirer.
REVOKE ALL ON public.user_sessions FROM anon;

-- Les 3 autres : retirer toute écriture (dont TRUNCATE, qui ignore la RLS).
-- SELECT conservé : des écrans back-office lancés avant l'ouverture de session
-- lisent ces tables en anon ; la RLS leur renvoie 0 ligne (ou l'erreur 42883 déjà
-- existante sur stock_movements) — retirer SELECT changerait ce comportement.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON public.user_activity_logs, public.notifications, public.stock_movements
  FROM anon;

COMMIT;

-- ---------------------------------------------------------------------
-- Vérification après application (lecture seule)
-- ---------------------------------------------------------------------
-- SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('user_sessions','user_activity_logs','notifications','stock_movements')
--  ORDER BY 1, 2;
-- SELECT relname, relacl FROM pg_class WHERE relnamespace = 'public'::regnamespace
--    AND relname IN ('user_sessions','user_activity_logs','notifications','stock_movements');
-- Suivi d'activité vivant : SELECT max(created_at) FROM public.user_activity_logs;  (doit avancer)

-- =====================================================================
-- RETOUR ARRIÈRE (à exécuter seulement en cas de régression) — recrée l'état
-- d'origine à l'identique (définitions lues dans pg_policies le 2026-09-14 ;
-- droits d'origine d'anon : arwdDxtm = ALL sur les 4 tables).
-- =====================================================================
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
--
-- GRANT ALL ON public.user_activity_logs, public.user_sessions,
--              public.notifications, public.stock_movements TO anon;
--
-- DROP POLICY IF EXISTS users_insert_own_user_activity_logs ON public.user_activity_logs;
-- CREATE POLICY service_insert_activity ON public.user_activity_logs
--   AS PERMISSIVE FOR INSERT TO public
--   WITH CHECK (true);
--
-- DROP POLICY IF EXISTS users_insert_own_user_sessions ON public.user_sessions;
-- DROP POLICY IF EXISTS users_update_own_user_sessions ON public.user_sessions;
-- CREATE POLICY service_manage_sessions ON public.user_sessions
--   AS PERMISSIVE FOR ALL TO public
--   USING (true);
--
-- CREATE POLICY notifications_insert_system ON public.notifications
--   AS PERMISSIVE FOR INSERT TO public
--   WITH CHECK (true);
--
-- CREATE POLICY system_triggers_can_insert_stock_movements ON public.stock_movements
--   AS PERMISSIVE FOR INSERT TO public
--   WITH CHECK (true);
--
-- COMMIT;
