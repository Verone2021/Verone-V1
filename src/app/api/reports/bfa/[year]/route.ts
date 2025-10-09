// =====================================================================
// Route API: GET /api/reports/bfa/[year]
// Date: 2025-10-11
// Description: Rapport BFA (Bonus Fin d'Année) pour année fiscale
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================================================
// TYPE RESPONSE
// =====================================================================

interface BFAReportItem {
  organisation_id: string;
  organisation_name: string;
  total_revenue_ht: number;
  bfa_rate: number;
  bfa_amount: number;
}

// =====================================================================
// GET /api/reports/bfa/[year]
// =====================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const fiscalYear = parseInt(year, 10);

    // 1. Validation année
    if (isNaN(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
      return NextResponse.json(
        { error: 'Invalid year parameter. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    // 2. Créer client Supabase
    const supabase = await createClient();

    // 3. Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Vérifier role admin (BFA = données sensibles)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }

    // 5. Appeler RPC generate_bfa_report_all_customers()
    const { data: report, error: rpcError } = await supabase.rpc(
      'generate_bfa_report_all_customers',
      {
        p_fiscal_year: fiscalYear,
      }
    );

    if (rpcError) {
      console.error('RPC generate_bfa_report_all_customers failed:', rpcError);
      return NextResponse.json(
        {
          error: 'Failed to generate BFA report',
          details: rpcError.message,
        },
        { status: 500 }
      );
    }

    // 6. Calculer totaux agrégés
    const totalRevenue = (report as BFAReportItem[]).reduce(
      (sum, item) => sum + Number(item.total_revenue_ht),
      0
    );
    const totalBFA = (report as BFAReportItem[]).reduce(
      (sum, item) => sum + Number(item.bfa_amount),
      0
    );

    // 7. Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          fiscalYear,
          generatedAt: new Date().toISOString(),
          summary: {
            totalCustomers: (report as BFAReportItem[]).length,
            totalRevenue,
            totalBFA,
          },
          customers: report,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/reports/bfa/[year]:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================================
// METADATA ROUTE
// =====================================================================

export const dynamic = 'force-dynamic';
