-- ================================================================================================
-- 📁 MIGRATION : Bucket Supabase Storage - Stock Adjustments (Justificatifs Ajustements Stock)
-- ================================================================================================
-- Version: 1.0 Phase 5 Semaine 0
-- Date: 2025-10-10
-- Usage: StockAdjustmentForm - Upload documents justificatifs pour ajustements inventaire
-- Sécurité: Bucket PRIVÉ (public = false) - Authentification requise
-- Cas d'usage: Inventaires physiques, corrections stock, documents perte/casse
-- ================================================================================================

-- ================================================================================================
-- 🗂️ CRÉATION BUCKET PRIVÉ
-- ================================================================================================

-- Insertion bucket stock-adjustments (privé pour sécurité données opérationnelles)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stock-adjustments', 'stock-adjustments', false)
ON CONFLICT (id) DO NOTHING;

-- ================================================================================================
-- 🔐 ROW LEVEL SECURITY (RLS) - Policies Storage
-- ================================================================================================
-- Configuration sécurisée pour authentifiés uniquement
-- Arborescence: stock-adjustments/adjustments/YYYY/MM/movement_id/filename.pdf

-- 🔒 Policy SELECT - Lecture pour utilisateurs authentifiés
CREATE POLICY "stock_adjustments_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'stock-adjustments');

-- 🔒 Policy INSERT - Upload pour utilisateurs authentifiés
CREATE POLICY "stock_adjustments_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'stock-adjustments' AND
    (storage.foldername(name))[1] = 'adjustments'
  );

-- 🔒 Policy UPDATE - Modification métadonnées pour utilisateurs authentifiés
CREATE POLICY "stock_adjustments_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'stock-adjustments')
  WITH CHECK (bucket_id = 'stock-adjustments');

-- 🔒 Policy DELETE - Suppression pour utilisateurs authentifiés
CREATE POLICY "stock_adjustments_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stock-adjustments');

-- ================================================================================================
-- 📝 CONFIGURATION BUCKET (Optionnel - Documentation)
-- ================================================================================================
-- Limite fichiers recommandée: 10 MB par upload
-- Formats autorisés: PDF, JPG, PNG, Excel (validation côté application)
-- Arborescence:
--   - stock-adjustments/adjustments/2025/10/uuid-movement-id/inventaire-physique.pdf
--   - stock-adjustments/adjustments/2025/10/uuid-movement-id/photo-casse.jpg
--   - stock-adjustments/adjustments/2025/10/uuid-movement-id/import-inventaire.xlsx
--
-- Cas d'usage:
--   - Inventaire physique: PDF scan feuilles inventaire
--   - Casse/Perte: Photos produits endommagés
--   - Correction: Justificatif erreur saisie précédente
--   - Import inventaire: Fichiers Excel comptage physique
--
-- Traçabilité: Lien avec stock_movements.reference_document (filename uniquement)
-- Nettoyage automatique: À implémenter si nécessaire (fonction trigger)
-- ================================================================================================

-- ================================================================================================
-- ✅ VALIDATION MIGRATION
-- ================================================================================================
-- Test bucket créé:
-- SELECT * FROM storage.buckets WHERE id = 'stock-adjustments';
--
-- Test policies actives:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'stock_adjustments%';
-- ================================================================================================

COMMENT ON SCHEMA storage IS 'Bucket stock-adjustments créé pour Phase 5 - StockAdjustmentForm justificatifs';
