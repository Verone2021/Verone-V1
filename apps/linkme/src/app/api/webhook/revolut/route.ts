import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import {
  verifyWebhookSignature,
  getRevolutOrder,
} from '../../../../lib/revolut';
import type { RevolutWebhookEvent } from '../../../../lib/revolut';

// Créer un client Supabase avec la clé service pour les opérations serveur
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * POST /api/webhook/revolut
 * Gère les webhooks de Revolut pour les confirmations de paiement
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get('revolut-signature') ?? '';
    const webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET;

    // Lire le body brut pour vérification de signature
    const rawBody = await request.text();

    // Vérifier la signature si le secret est configuré
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parser l'événement
    const event = JSON.parse(rawBody) as RevolutWebhookEvent;

    // Traiter selon le type d'événement
    switch (event.event) {
      case 'ORDER_COMPLETED':
        await handleOrderCompleted(event);
        break;

      case 'ORDER_AUTHORISED':
        await handleOrderAuthorised(event);
        break;

      case 'ORDER_PAYMENT_DECLINED':
      case 'ORDER_PAYMENT_FAILED':
        await handlePaymentFailed(event);
        break;

      case 'ORDER_CANCELLED':
        await handleOrderCancelled(event);
        break;

      default:
        console.warn('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Gère la confirmation de paiement (ORDER_COMPLETED)
 */
async function handleOrderCompleted(event: RevolutWebhookEvent) {
  try {
    // Récupérer les détails de la commande depuis Revolut
    const revolutOrder = await getRevolutOrder(event.order_id);

    if (!revolutOrder) {
      console.error('Could not fetch order details from Revolut');
      return;
    }

    const supabase = getSupabaseAdmin();

    // Extraire les métadonnées
    const metadata = (revolutOrder.metadata ?? {}) as {
      affiliate_id?: string;
      selection_id?: string;
    };
    const affiliateId = metadata.affiliate_id;
    const selectionId = metadata.selection_id;
    const orderRef = revolutOrder.merchant_order_ext_ref;

    // Créer la commande dans sales_orders
    const { data: salesOrder, error: orderError } = (await supabase
      .from('sales_orders')
      .insert({
        order_number: orderRef,
        source_channel: 'linkme',
        status: 'confirmed',
        customer_email: revolutOrder.customer_email,
        total_ht: revolutOrder.order_amount.value / 100 / 1.2, // Approximation HT
        total_ttc: revolutOrder.order_amount.value / 100,
        payment_status: 'paid',
        payment_method: 'revolut',
        payment_reference: event.order_id,
        linkme_affiliate_id: affiliateId ?? null,
        linkme_selection_id: selectionId ?? null,
        notes: `Paiement Revolut - ${revolutOrder.payments?.[0]?.payment_method?.type ?? 'card'}`,
      })
      .select()
      .single()) as {
      data: { id: string } | null;
      error: Error | null;
    };

    if (orderError || !salesOrder) {
      console.error('Error creating sales order:', orderError);
      return;
    }

    // La commission sera créée automatiquement via trigger si configuré
    // Sinon, la créer manuellement ici
    if (affiliateId && selectionId) {
      // Récupérer les infos de l'affilié pour calculer la commission
      const { data: affiliate } = (await supabase
        .from('linkme_affiliates')
        .select('default_margin_rate, linkme_commission_rate')
        .eq('id', affiliateId)
        .single()) as {
        data: {
          default_margin_rate: number;
          linkme_commission_rate: number;
        } | null;
      };

      if (affiliate) {
        const orderAmountHt = revolutOrder.order_amount.value / 100 / 1.2;
        const affiliateCommission =
          orderAmountHt * (affiliate.default_margin_rate / 100);
        const linkmeCommission =
          orderAmountHt * (affiliate.linkme_commission_rate / 100);

        await supabase.from('linkme_commissions').insert({
          affiliate_id: affiliateId,
          selection_id: selectionId,
          order_id: salesOrder.id,
          order_amount_ht: orderAmountHt,
          affiliate_commission: affiliateCommission,
          linkme_commission: linkmeCommission,
          margin_rate_applied: affiliate.default_margin_rate,
          linkme_rate_applied: affiliate.linkme_commission_rate,
          status: 'pending',
        });
      }
    }
  } catch (error) {
    console.error('Error processing ORDER_COMPLETED:', error);
  }
}

/**
 * Gère l'autorisation de paiement
 */
async function handleOrderAuthorised(_event: RevolutWebhookEvent) {
  // Le paiement est autorisé mais pas encore capturé
  // En mode capture_mode: 'automatic', ce sera suivi de ORDER_COMPLETED
}

/**
 * Gère l'échec de paiement
 */
async function handlePaymentFailed(_event: RevolutWebhookEvent) {
  // Logger l'échec pour analyse
  // On pourrait aussi notifier le client par email
}

/**
 * Gère l'annulation de commande
 */
async function handleOrderCancelled(_event: RevolutWebhookEvent) {
  // Annuler toute commande en attente liée à cet order_id
}
