-- ================================================================================================
-- 📁 MIGRATION : Bucket Supabase Storage - Expense Receipts (Justificatifs Dépenses)
-- ================================================================================================
-- Version: 1.0 Phase 5 Semaine 0
-- Date: 2025-10-10
-- Usage: ExpenseForm - Upload justificatifs PDF/images pour dépenses opérationnelles
-- Sécurité: Bucket PRIVÉ (public = false) - Authentification requise
-- ================================================================================================

-- ================================================================================================
-- 🗂️ CRÉATION BUCKET PRIVÉ
-- ================================================================================================

-- Insertion bucket expense-receipts (privé pour sécurité données financières)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- ================================================================================================
-- 🔐 ROW LEVEL SECURITY (RLS) - Policies Storage
-- ================================================================================================
-- Configuration sécurisée pour authentifiés uniquement
-- Arborescence: expense-receipts/expenses/YYYY/MM/expense_id/filename.pdf

-- 🔒 Policy SELECT - Lecture pour utilisateurs authentifiés
CREATE POLICY "expense_receipts_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'expense-receipts');

-- 🔒 Policy INSERT - Upload pour utilisateurs authentifiés
CREATE POLICY "expense_receipts_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts' AND
    (storage.foldername(name))[1] = 'expenses'
  );

-- 🔒 Policy UPDATE - Modification métadonnées pour utilisateurs authentifiés
CREATE POLICY "expense_receipts_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'expense-receipts')
  WITH CHECK (bucket_id = 'expense-receipts');

-- 🔒 Policy DELETE - Suppression pour utilisateurs authentifiés
CREATE POLICY "expense_receipts_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'expense-receipts');

-- ================================================================================================
-- 📝 CONFIGURATION BUCKET (Optionnel - Documentation)
-- ================================================================================================
-- Limite fichiers recommandée: 10 MB par upload
-- Formats autorisés: PDF, JPG, PNG (validation côté application)
-- Arborescence:
--   - expense-receipts/expenses/2025/10/uuid-expense-id/facture-fournisseur.pdf
--   - expense-receipts/expenses/2025/10/uuid-expense-id/ticket-restaurant.jpg
--
-- Nettoyage automatique: À implémenter si nécessaire (fonction trigger)
-- ================================================================================================

-- ================================================================================================
-- ✅ VALIDATION MIGRATION
-- ================================================================================================
-- Test bucket créé:
-- SELECT * FROM storage.buckets WHERE id = 'expense-receipts';
--
-- Test policies actives:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'expense_receipts%';
-- ================================================================================================

COMMENT ON SCHEMA storage IS 'Bucket expense-receipts créé pour Phase 5 - ExpenseForm justificatifs';
