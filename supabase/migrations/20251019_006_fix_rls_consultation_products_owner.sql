-- =====================================================
-- Migration: Fix RLS Policy consultation_products - Add Owner Role
-- Date: 2025-10-19
-- Description: Ajouter le rôle 'owner' à la RLS policy de consultation_products
--              Bug: Le Owner ne peut pas voir les produits ajoutés aux consultations
-- =====================================================

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Consultation products access" ON consultation_products;

-- Recréer la policy avec le rôle 'owner' inclus
CREATE POLICY "Consultation products access"
ON consultation_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM client_consultations cc
    WHERE cc.id = consultation_products.consultation_id
      AND (
        cc.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM user_profiles
          WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin', 'catalog_manager', 'sales')
        )
      )
  )
);

-- Commentaire explicatif
COMMENT ON POLICY "Consultation products access" ON consultation_products IS
'Permet aux utilisateurs Owner/Admin/Catalog Manager/Sales ou assignés à la consultation de voir/modifier les produits de consultation';
