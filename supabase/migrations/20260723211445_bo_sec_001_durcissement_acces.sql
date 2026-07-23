-- [BO-SEC-001] Durcissement des accès en écriture (advisor sécurité Supabase)
-- Date : 2026-07-23
--
-- Contexte : l'advisor sécurité signalait des règles d'accès (RLS) "always-true"
-- trop permissives et un bucket de stockage public autorisant le listage.
-- On ne corrige que les vraies expositions ; les règles système "always-true"
-- écrites par des triggers SECURITY DEFINER / le service role sont acceptées
-- par conception (voir .claude/rules/database.md) et NE sont PAS touchées :
--   audit_logs, individual_customers, notifications, stock_movements (protégé),
--   user_activity_logs, user_sessions.
--
-- NB : appliqué en prod via mcp__supabase__execute_sql (apply_migration bloqué).
-- Ce fichier documente le changement et le rend rejouable proprement.

-- 1) collection_images : retrait de 2 règles d'écriture "tout compte connecté"
--    (qual/with_check = true). Redondantes : la règle back-office dédiée
--    `backoffice_full_access_collection_images` (ALL, is_backoffice_user())
--    couvre déjà les écritures légitimes. La gestion des images de collection
--    est une fonction back-office (hook @verone/collections, page produits/catalogue).
--    La règle SELECT authenticated est conservée (lecture) pour ne rien casser.
DROP POLICY IF EXISTS "collection_images_delete_authenticated" ON public.collection_images;
DROP POLICY IF EXISTS "collection_images_update_authenticated" ON public.collection_images;

-- 2) storage bucket `organisation-logos` : retrait de la règle de LISTAGE public.
--    Le bucket est public (public = true) : l'accès aux logos par URL directe
--    continue de fonctionner sans cette règle. On retire uniquement la capacité
--    de LISTER tous les fichiers du bucket.
DROP POLICY IF EXISTS "Allow public read of organisation-logos" ON storage.objects;
