/**
 * 📊 API Dashboard - Métriques Stock & Commandes
 * GET /api/dashboard/stock-orders-metrics
 *
 * Retourne les métriques calculées par la fonction SQL get_dashboard_stock_orders_metrics()
 * - Valeur Stock (€)
 * - Commandes Achat (nombre)
 * - CA du Mois (€)
 * - Produits à Sourcer (nombre)
 */

import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

// Node runtime requis pour cookies() async
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StockOrdersMetrics {
  stock_value: number;
  purchase_orders_count: number;
  month_revenue: number;
  products_to_source: number;
}

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Appeler fonction SQL qui calcule toutes les métriques
    const { data, error } = await supabase.rpc(
      'get_dashboard_stock_orders_metrics'
    );

    if (error) {
      console.error('Erreur SQL get_dashboard_stock_orders_metrics:', error);
      throw error;
    }

    // La fonction retourne un array avec 1 ligne
    const metrics: StockOrdersMetrics = data?.[0] || {
      stock_value: 0,
      purchase_orders_count: 0,
      month_revenue: 0,
      products_to_source: 0,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Erreur API dashboard stock-orders-metrics:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
