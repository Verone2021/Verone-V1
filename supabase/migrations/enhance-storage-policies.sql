-- =====================================================
-- VÉRONE STORAGE RLS - POLITIQUES AVANCÉES (MANUEL)
-- =====================================================
--
-- Ce script peut être exécuté manuellement dans l'interface
-- Supabase si des permissions plus granulaires sont nécessaires
--

-- =====================================================
-- 🔧 REMPLACEMENT DES POLITIQUES BASIQUES
-- =====================================================

-- Supprimer la politique simple d'upload pour la remplacer
-- DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;

-- =====================================================
-- 🎯 UPLOAD GRANULAIRE PAR RÔLE VÉRONE
-- =====================================================

-- OWNERS & ADMINS : Accès complet à tous les buckets
-- CREATE POLICY "Storage INSERT - Owners/Admins accès complet"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (select auth.uid()) IN (
--     SELECT user_id FROM user_profiles
--     WHERE role IN ('owner', 'admin')
--   )
--   AND bucket_id IN ('family-images', 'category-images', 'product-images', 'documents')
-- );

-- CATALOG MANAGERS : Images produits/catégories/familles
-- CREATE POLICY "Storage INSERT - Catalog managers images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (select auth.uid()) IN (
--     SELECT user_id FROM user_profiles
--     WHERE role = 'catalog_manager'
--   )
--   AND bucket_id IN ('family-images', 'category-images', 'product-images')
-- );

-- SALES & PARTNER MANAGERS : Documents uniquement
-- CREATE POLICY "Storage INSERT - Sales/Partners documents"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (select auth.uid()) IN (
--     SELECT user_id FROM user_profiles
--     WHERE role IN ('sales', 'partner_manager')
--   )
--   AND bucket_id = 'documents'
-- );

-- =====================================================
-- 📊 VÉRIFICATION DES POLITIQUES ACTUELLES
-- =====================================================

-- Voir toutes les politiques Storage actuelles
SELECT
  policyname,
  cmd,
  roles,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

-- Compter les utilisateurs par rôle
SELECT
  role,
  COUNT(*) as nb_users,
  STRING_AGG(user_profiles.user_id::text, ', ') as user_ids
FROM user_profiles
GROUP BY role
ORDER BY role;

-- =====================================================
-- 🎯 INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
POUR APPLIQUER CES POLITIQUES AVANCÉES :

1. Connectez-vous à l'interface Supabase Dashboard
2. Allez dans SQL Editor
3. Décommentez les sections nécessaires ci-dessus
4. Exécutez les requêtes une par une

POLITIQUES ACTUELLES (de base) :
✅ Allow authenticated users to upload images - Tous utilisateurs connectés
✅ Allow public read access to image buckets - Images publiques
✅ Allow authenticated read access to documents - Documents privés
✅ Allow users to update their own files - Propriétaire
✅ Allow users to delete their own files - Propriétaire

AVANTAGES DES POLITIQUES AVANCÉES :
🎯 Contrôle granulaire par rôle Vérone
🔐 Sécurité renforcée selon business rules
📊 Permissions précises par bucket et utilisateur

DÉSAVANTAGES :
⚠️ Plus complexe à maintenir
⚠️ Peut nécessiter permissions super-admin
⚠️ Debugging plus difficile en cas de problème

RECOMMANDATION :
✅ Gardez les politiques de base si l'upload fonctionne
🔧 Appliquez les avancées si vous avez besoin de plus de sécurité
*/