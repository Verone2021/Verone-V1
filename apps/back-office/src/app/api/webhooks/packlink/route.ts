/**
 * Webhook: Packlink shipment status updates
 * POST /api/webhooks/packlink
 *
 * Events:
 * - shipment.carrier.success: registered with carrier (tracking number assigned)
 * - shipment.carrier.fail: carrier registration failed
 * - shipment.label.ready: labels available for download
 * - shipment.label.fail: label generation failed
 * - shipment.tracking.update: tracking status changed (in_transit, out_for_delivery)
 * - shipment.delivered: shipment delivered
 *
 * ---
 *
 * SÉCURITÉ (BO-SEC-MW-001, 2026-09-19) — pourquoi il n'y a pas de secret ici.
 *
 * L'API de Packlink n'accepte qu'une **URL** pour enregistrer un rappel
 * (`POST /v1/shipments/callback`, corps `{ url }`) : ni en-tête personnalisé,
 * ni signature. Le seul support possible pour un secret serait l'adresse
 * elle-même, qui finit dans les journaux du serveur et dans les traces du
 * fournisseur — la règle `.claude/rules/api-guards.md` l'interdit, et à raison.
 *
 * Le rappel a donc cessé d'être une **source de vérité** pour devenir un
 * simple **signal de relecture**. Concrètement, avant toute écriture :
 *
 *   1. la référence doit exister dans NOS expéditions — sinon 404, et on
 *      s'arrête avant même d'appeler Packlink (borne le coût d'un envoi en
 *      rafale) ;
 *   2. Packlink doit confirmer que la référence existe chez lui — sinon 502 ;
 *   3. l'état appliqué et les données de suivi viennent de **la réponse de
 *      Packlink**, jamais du corps du message reçu.
 *
 * Ce que ça bloque, sans rien demander à Packlink :
 *   - déclarer payée une expédition que le transporteur n'a pas acceptée
 *     (donc déclencher à tort la sortie de stock réel) ;
 *   - déclarer livrée une expédition qui ne l'est pas ;
 *   - injecter un faux numéro ou une fausse adresse de suivi, qui partent
 *     ensuite au client par e-mail.
 *
 * `PACKLINK_WEBHOOK_SECRET` reste géré : s'il est un jour configuré des deux
 * côtés, il s'ajoute comme deuxième verrou. Son absence ne fait plus tomber la
 * protection, puisque la protection ne repose plus sur lui.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getPacklinkClient } from '@verone/common/lib/packlink/client';

/** L'état réel de l'expédition, tel que Packlink le rapporte. */
interface PacklinkVerite {
  state: string;
  carrier: string | null;
  trackingUrl: string | null;
  trackingNumber: string | null;
}

/** État renvoyé par Packlink pour une expédition livrée (constaté en réel). */
const ETAT_LIVRE = 'DELIVERED';

export async function POST(request: Request) {
  try {
    // Deuxième verrou, optionnel : si un secret partagé est un jour configuré
    // des deux côtés, il est exigé strictement. Son absence ne dégrade plus
    // rien, la protection réelle étant la vérification auprès de Packlink.
    const webhookSecret = process.env.PACKLINK_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader =
        request.headers.get('x-packlink-secret') ??
        request.headers.get('authorization');
      if (authHeader !== webhookSecret) {
        console.error('[Packlink Webhook] Invalid secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = (await request.json()) as {
      event: string;
      shipment_reference: string;
      data?: Record<string, unknown>;
    };

    const { event, shipment_reference: reference } = body;

    if (!event || !reference) {
      return NextResponse.json(
        { error: 'Missing event or reference' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const client = getPacklinkClient();

    console.warn(`[Packlink Webhook] ${event}: ${reference}`);

    // --- Vérification 1 : la référence est-elle une de NOS expéditions ? ---
    // On s'arrête ici avant d'appeler Packlink : un envoi en rafale sur des
    // références inventées ne coûte qu'une lecture en base.
    const { data: expeditionConnue } = await supabase
      .from('sales_order_shipments')
      .select('id')
      .eq('packlink_shipment_id', reference)
      .limit(1)
      .maybeSingle();

    if (!expeditionConnue) {
      console.warn(
        `[Packlink Webhook] Reference inconnue de nos expeditions, ignoree : ${reference}`
      );
      return NextResponse.json({ error: 'Unknown reference' }, { status: 404 });
    }

    // --- Vérification 2 : Packlink confirme-t-il cette expédition ? ---
    // C'est ce qui remplace la signature que Packlink ne sait pas envoyer :
    // on ne croit pas le message, on va relire la vérité à la source.
    let verite: PacklinkVerite;
    try {
      const brut = (await client.getShipment(reference)) as unknown as {
        state?: string;
        carrier?: string;
        tracking_url?: string;
        carrier_shipment_tracking_number?: string;
        packages?: Array<{ carrier_tracking_number?: string }>;
      };
      verite = {
        state: (brut.state ?? '').toUpperCase(),
        carrier: brut.carrier ?? null,
        trackingUrl: brut.tracking_url ?? null,
        trackingNumber:
          brut.packages?.[0]?.carrier_tracking_number ??
          brut.carrier_shipment_tracking_number ??
          null,
      };
    } catch (err) {
      console.error(
        `[Packlink Webhook] Packlink ne confirme pas ${reference}, rien n'est ecrit :`,
        err
      );
      return NextResponse.json(
        { error: 'Shipment not confirmed by Packlink' },
        { status: 502 }
      );
    }

    switch (event) {
      case 'shipment.carrier.success': {
        // « Le transporteur a accepté » se prouve par un numéro de suivi chez
        // Packlink. Sans ce numéro, on n'écrit RIEN : ce passage à « paye »
        // déclenche la sortie de stock réel, il ne se déclenche pas sur parole.
        if (!verite.trackingNumber) {
          console.warn(
            `[Packlink Webhook] carrier.success annonce sans numero de suivi chez Packlink (etat ${verite.state}) — ignore : ${reference}`
          );
          return NextResponse.json(
            { error: 'Carrier acceptance not confirmed by Packlink' },
            { status: 409 }
          );
        }

        try {
          const details = {
            tracking_url: verite.trackingUrl ?? undefined,
            carrier: verite.carrier ?? undefined,
          };
          const trackingNumber = verite.trackingNumber;

          // packlink_status: a_payer → paye
          // Ce changement déclenche le trigger confirm_packlink_shipment_stock()
          // qui décrémente le stock et met à jour le statut commande
          const updateFields: Record<string, unknown> = {
            packlink_status: 'paye',
            updated_at: new Date().toISOString(),
          };

          if (trackingNumber) {
            updateFields.tracking_number = trackingNumber;
          }
          if (details.tracking_url) {
            updateFields.tracking_url = details.tracking_url;
          }

          await supabase
            .from('sales_order_shipments')
            .update(updateFields)
            .eq('packlink_shipment_id', reference);

          console.warn(
            '[Packlink Webhook] Transport payé par Verone, stock décrémenté:',
            reference
          );

          // Envoyer email tracking au client
          // Récupérer l'email client depuis la commande
          try {
            const { data: shipRow } = await supabase
              .from('sales_order_shipments')
              .select('sales_order_id')
              .eq('packlink_shipment_id', reference)
              .limit(1)
              .single();

            if (shipRow) {
              const { data: so } = await supabase
                .from('sales_orders')
                .select(
                  `order_number, individual_customer_id,
                   individual_customers(email, first_name, last_name),
                   organisations(email, trade_name)`
                )
                .eq('id', shipRow.sales_order_id)
                .single();

              const soData = so as Record<string, unknown> | null;
              const indiv = soData?.individual_customers as {
                email: string | null;
                first_name: string;
                last_name: string;
              } | null;
              const org = soData?.organisations as {
                email: string | null;
                trade_name: string;
              } | null;

              const customerEmail = indiv?.email ?? org?.email;
              const customerName = indiv
                ? `${indiv.first_name} ${indiv.last_name}`
                : (org?.trade_name ?? 'Client');

              if (customerEmail) {
                // Appeler le endpoint email shipping-notification du site-internet
                // Note: en production, utiliser l'URL Vercel du site-internet
                const siteUrl =
                  process.env.SITE_INTERNET_URL ??
                  'https://www.veronecollections.fr';

                await fetch(`${siteUrl}/api/emails/shipping-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: customerEmail,
                    customerName,
                    orderId:
                      (soData?.order_number as string) ??
                      shipRow.sales_order_id,
                    trackingNumber: trackingNumber ?? undefined,
                    carrierName: details.carrier,
                  }),
                }).catch(emailErr => {
                  console.error(
                    '[Packlink Webhook] Email notification failed:',
                    emailErr
                  );
                });

                console.warn(
                  '[Packlink Webhook] Tracking email sent to:',
                  customerEmail
                );
              }
            }
          } catch (emailErr) {
            console.error('[Packlink Webhook] Email lookup failed:', emailErr);
          }
        } catch (err) {
          console.error(
            '[Packlink Webhook] Failed to fetch shipment details:',
            err
          );
        }
        break;
      }

      case 'shipment.carrier.fail': {
        // Transporteur a rejeté l'expédition — marquer comme incident
        await supabase
          .from('sales_order_shipments')
          .update({
            packlink_status: 'incident',
            updated_at: new Date().toISOString(),
          })
          .eq('packlink_shipment_id', reference);

        console.error(
          '[Packlink Webhook] CARRIER FAIL — packlink_status → incident:',
          reference,
          body.data
        );
        break;
      }

      case 'shipment.label.ready': {
        // Fetch label URLs from Packlink
        try {
          const labels = await client.getLabels(reference);
          if (labels.length > 0) {
            await supabase
              .from('sales_order_shipments')
              .update({
                packlink_label_url: labels[0],
                label_url: labels[0],
                updated_at: new Date().toISOString(),
              })
              .eq('packlink_shipment_id', reference);
          }
        } catch (err) {
          console.error('[Packlink Webhook] Failed to fetch labels:', err);
        }
        break;
      }

      case 'shipment.label.fail': {
        // Label generation failed — log for manual action
        console.error('[Packlink Webhook] LABEL FAIL:', reference, body.data);
        break;
      }

      case 'shipment.tracking.update': {
        // Le numéro et l'adresse de suivi viennent de Packlink, PAS du message
        // reçu : sans ça, n'importe qui pouvait faire afficher au client un
        // lien de suivi de son choix.
        const updateFields: Record<string, unknown> = {
          packlink_status:
            verite.state === ETAT_LIVRE ? 'delivered' : 'in_transit',
          updated_at: new Date().toISOString(),
        };
        if (verite.trackingNumber) {
          updateFields.tracking_number = verite.trackingNumber;
        }
        if (verite.trackingUrl) {
          updateFields.tracking_url = verite.trackingUrl;
        }

        await supabase
          .from('sales_order_shipments')
          .update(updateFields)
          .eq('packlink_shipment_id', reference);
        break;
      }

      case 'shipment.delivered': {
        // Packlink doit confirmer la livraison. Valeur constatée en réel sur
        // les expéditions livrées : `state = "DELIVERED"`.
        if (verite.state !== ETAT_LIVRE) {
          console.warn(
            `[Packlink Webhook] Livraison annoncee mais Packlink dit "${verite.state}" — ignoree : ${reference}`
          );
          return NextResponse.json(
            { error: 'Delivery not confirmed by Packlink' },
            { status: 409 }
          );
        }

        // Update packlink_status + mark sales order as delivered
        await supabase
          .from('sales_order_shipments')
          .update({
            packlink_status: 'delivered',
            updated_at: new Date().toISOString(),
          })
          .eq('packlink_shipment_id', reference);

        const { data: shipment } = await supabase
          .from('sales_order_shipments')
          .select('sales_order_id')
          .eq('packlink_shipment_id', reference)
          .limit(1)
          .single();

        if (shipment) {
          await supabase
            .from('sales_orders')
            .update({
              status: 'delivered',
              delivered_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', String(shipment.sales_order_id))
            .in('status', ['shipped', 'partially_shipped']);

          console.warn(
            '[Packlink Webhook] Order delivered:',
            shipment.sales_order_id
          );
        }
        break;
      }

      default:
        console.warn('[Packlink Webhook] Unhandled event:', event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Packlink Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
