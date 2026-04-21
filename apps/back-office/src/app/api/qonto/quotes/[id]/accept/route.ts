/**
 * API Route: POST /api/qonto/quotes/[id]/accept
 * Marque un devis comme accepté par le client
 * Cascade : si un sales_order draft est lié, il est automatiquement validé.
 *
 * Note: Qonto API utilise l'endpoint /v2/quotes/{id}/accept
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { QontoClientQuote } from '@verone/integrations/qonto';
import { QontoClient } from '@verone/integrations/qonto';
import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';

interface QontoAcceptQuoteResponse {
  quote: QontoClientQuote;
}

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier que le devis existe et est finalisé
    const quote = await client.getClientQuoteById(id);

    if (quote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Le devis doit être finalisé avant de pouvoir être accepté',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'accepted') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ce devis est déjà accepté',
        },
        { status: 400 }
      );
    }

    if (quote.status === 'declined') {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'accepter un devis déjà refusé",
        },
        { status: 400 }
      );
    }

    // Appeler l'API Qonto pour accepter le devis
    // L'API Qonto utilise POST /v2/quotes/{id}/accept
    const response = await fetch(
      `https://thirdparty.qonto.com/v2/quotes/${id}/accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.QONTO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Qonto Quote Accept] Qonto API error:', errorText);
      throw new Error(
        `Erreur Qonto: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as QontoAcceptQuoteResponse;

    // ========================================
    // Cascade : valider la commande draft liée
    // ========================================
    let validatedOrder: { id: string; number: string } | null = null;

    try {
      // Récupérer l'utilisateur courant pour confirmed_by
      const supabaseAuth = await createServerClient();
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();
      const userId = user?.id ?? null;

      // Chercher le financial_document lié au devis Qonto
      const supabase = createAdminClient();
      const { data: docRow } = await supabase
        .from('financial_documents')
        .select('sales_order_id')
        .eq('qonto_invoice_id', id)
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .maybeSingle();

      if (docRow?.sales_order_id) {
        // Vérifier que la commande est bien en draft
        const { data: order } = await supabase
          .from('sales_orders')
          .select('id, order_number, status')
          .eq('id', docRow.sales_order_id)
          .single();

        if (order?.status === 'draft') {
          // Valider la commande (les triggers DB s'appliquent automatiquement :
          // trg_lock_prices_on_validation, trigger_so_update_forecasted_out,
          // trg_create_linkme_commission, sales_order_status_change_trigger)
          const updatePayload: {
            status: 'validated';
            confirmed_at: string;
            updated_at: string;
            confirmed_by?: string;
          } = {
            status: 'validated',
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (userId) {
            updatePayload.confirmed_by = userId;
          }

          const { error: updateErr } = await supabase
            .from('sales_orders')
            .update(updatePayload)
            .eq('id', order.id)
            .eq('status', 'draft'); // double guard contre race condition

          if (updateErr) {
            console.error(
              '[API Qonto Quote Accept] Order validation cascade:',
              updateErr
            );
            // Non-bloquant : le devis est accepté, la commande reste draft
            // L'utilisateur peut la valider manuellement
          } else {
            validatedOrder = { id: order.id, number: order.order_number };
          }
        }
        // Si status !== 'draft' : pas de cascade (FSM respecté), validatedOrder reste null
      }
      // Si docRow introuvable : pas de commande liée, validatedOrder reste null
    } catch (cascadeErr) {
      // Erreur non-bloquante : l'action primaire (accept Qonto) a réussi
      console.error(
        '[API Qonto Quote Accept] Order validation cascade:',
        cascadeErr
      );
    }

    return NextResponse.json({
      success: true,
      quote: data.quote,
      message: 'Devis marqué comme accepté',
      validatedOrder,
    });
  } catch (error) {
    console.error('[API Qonto Quote Accept] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
