/**
 * 🔧 API Route ADMIN: Exécuter migration SQL
 *
 * POST /api/admin/run-migration
 * Exécute le SQL de migration Google Merchant
 *
 * ⚠️ ROUTE TEMPORAIRE - À supprimer après installation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const sql = `
-- Drop existing functions if structure changed
DROP FUNCTION IF EXISTS get_google_merchant_products() CASCADE;
DROP FUNCTION IF EXISTS get_google_merchant_stats() CASCADE;

-- FONCTION: get_google_merchant_products
CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  google_product_id TEXT,
  sync_status TEXT,
  google_status TEXT,
  google_status_detail JSONB,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht DECIMAL,
  synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id,
    gms.product_id,
    p.sku,
    p.name AS product_name,
    gms.google_product_id,
    gms.sync_status,
    gms.google_status,
    gms.google_status_detail,
    gms.impressions,
    gms.clicks,
    gms.conversions,
    gms.revenue_ht,
    gms.synced_at,
    gms.google_status_checked_at,
    gms.error_message
  FROM google_merchant_syncs gms
  INNER JOIN products p ON p.id = gms.product_id
  WHERE gms.sync_status != 'deleted'
  ORDER BY gms.synced_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION: get_google_merchant_stats
CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue_ht DECIMAL,
  conversion_rate DECIMAL,
  last_sync_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE google_status = 'approved') AS approved_products,
    COUNT(*) FILTER (WHERE google_status = 'pending') AS pending_products,
    COUNT(*) FILTER (WHERE google_status = 'rejected') AS rejected_products,
    COUNT(*) FILTER (WHERE sync_status = 'error') AS error_products,
    COALESCE(SUM(impressions), 0) AS total_impressions,
    COALESCE(SUM(clicks), 0) AS total_clicks,
    COALESCE(SUM(conversions), 0) AS total_conversions,
    COALESCE(SUM(revenue_ht), 0) AS total_revenue_ht,
    CASE
      WHEN SUM(clicks) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(clicks)::DECIMAL) * 100, 2)
      ELSE 0
    END AS conversion_rate,
    MAX(synced_at) AS last_sync_at,
    NOW() AS refreshed_at
  FROM google_merchant_syncs
  WHERE sync_status != 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Exécuter le SQL directement
    const { error } = await (supabase as any).rpc('exec_sql', { sql });

    if (error) {
      console.error('[Migration] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Migration failed: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Migration Google Merchant executée avec succès!',
    });
  } catch (error: any) {
    console.error('[API] Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
