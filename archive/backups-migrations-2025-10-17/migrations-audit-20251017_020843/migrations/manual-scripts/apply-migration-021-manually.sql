-- =============================================
-- MIGRATION 021: À COPIER-COLLER dans Supabase Dashboard SQL Editor
-- =============================================
-- Instructions:
-- 1. Aller sur: https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql
-- 2. Copier-coller ce SQL dans l'éditeur
-- 3. Cliquer "Run" pour exécuter
-- 4. Vérifier message: "✅ Migration 021 appliquée avec succès"
-- =============================================

-- Policy 1: SELECT (Consultation mouvements)
CREATE POLICY "Utilisateurs peuvent consulter les mouvements de stock"
  ON stock_movements FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

-- Policy 2: INSERT (Création mouvements - Permissive pour triggers)
CREATE POLICY "Utilisateurs peuvent créer des mouvements de stock"
  ON stock_movements FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager', 'sales', 'purchaser')
  );

-- Policy 3: UPDATE (Modification mouvements - Restreint)
CREATE POLICY "Utilisateurs admin peuvent modifier les mouvements de stock"
  ON stock_movements FOR UPDATE
  USING (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'warehouse_manager')
  );

-- Policy 4: DELETE (Suppression mouvements - Très restreint)
CREATE POLICY "Uniquement owners peuvent supprimer des mouvements de stock"
  ON stock_movements FOR DELETE
  USING (
    get_user_role() = 'owner'
  );

-- =============================================
-- VALIDATION (Optionnel - pour vérifier)
-- =============================================

SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'stock_movements'
ORDER BY cmd;

-- Attendu: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- =============================================
-- PROCHAINE ÉTAPE
-- =============================================
-- Après exécution réussie:
-- 1. Recharger l'application Next.js (http://localhost:3001/commandes/clients)
-- 2. Cliquer "Valider" sur SO-PREPAY-001
-- 3. Vérifier qu succès (pas d'erreur 403)
-- 4. Vérifier status change: draft → confirmed
-- 5. Vérifier mouvement stock prévisionnel créé automatiquement
