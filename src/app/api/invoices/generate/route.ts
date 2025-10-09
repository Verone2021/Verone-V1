// =====================================================================
// Route API: POST /api/invoices/generate
// Date: 2025-10-11
// Description: Génération facture depuis commande (appel RPC)
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================================================
// TYPE REQUEST
// =====================================================================

interface GenerateInvoiceRequest {
  salesOrderId: string;
}

// =====================================================================
// POST /api/invoices/generate
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parser request body
    const body = (await request.json()) as GenerateInvoiceRequest;
    const { salesOrderId } = body;

    // 2. Validation input
    if (!salesOrderId) {
      return NextResponse.json(
        { error: 'Missing required field: salesOrderId' },
        { status: 400 }
      );
    }

    // 3. Créer client Supabase
    const supabase = await createClient();

    // 4. Vérifier authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 5. Appeler RPC generate_invoice_from_order()
    const { data: invoice, error: rpcError } = await supabase.rpc(
      'generate_invoice_from_order',
      {
        p_sales_order_id: salesOrderId,
      }
    );

    if (rpcError) {
      console.error('RPC generate_invoice_from_order failed:', rpcError);

      // Parser erreur PostgreSQL pour retourner message user-friendly
      if (rpcError.message.includes('introuvable')) {
        return NextResponse.json(
          { error: 'Sales order not found' },
          { status: 404 }
        );
      }

      if (rpcError.message.includes('Statut commande invalide')) {
        return NextResponse.json(
          {
            error: 'Invalid order status. Order must be shipped or delivered.',
          },
          { status: 400 }
        );
      }

      if (rpcError.message.includes('Facture déjà créée')) {
        return NextResponse.json(
          { error: 'Invoice already exists for this order' },
          { status: 409 }
        );
      }

      if (rpcError.message.includes('sans items ou montant nul')) {
        return NextResponse.json(
          { error: 'Order has no items or zero amount' },
          { status: 400 }
        );
      }

      // Erreur générique
      return NextResponse.json(
        { error: 'Failed to generate invoice', details: rpcError.message },
        { status: 500 }
      );
    }

    // 6. Success - Retourner facture créée
    return NextResponse.json(
      {
        success: true,
        data: {
          invoice,
          message:
            'Invoice created successfully and added to Abby sync queue',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/generate:', error);

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
// METADATA ROUTE (OPTIONNEL - DOCUMENTATION)
// =====================================================================

export const dynamic = 'force-dynamic'; // Toujours dynamique (pas de cache)
