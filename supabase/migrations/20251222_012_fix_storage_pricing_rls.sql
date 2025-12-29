-- =====================================================
-- Migration: Fix RLS policy pour storage_pricing_tiers
-- Date: 2025-12-22
-- Description: Corriger la policy pour utiliser user_profiles au lieu de profiles
-- =====================================================

-- Drop la policy incorrecte
DROP POLICY IF EXISTS "storage_pricing_admin" ON storage_pricing_tiers;

-- Recréer avec la bonne table (user_profiles)
CREATE POLICY "storage_pricing_admin" ON storage_pricing_tiers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'owner')
        )
    );
