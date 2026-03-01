/**
 * API Route: POST /api/qonto/quotes/[id]/convert
 * Convertit un devis finalisé en facture
 *
 * Workflow complet:
 * 1. Valider que le devis est finalisé dans Qonto
 * 2. Convertir le devis en facture dans Qonto
 * 3. Créer un financial_documents local pour la nouvelle facture
 * 4. Mettre à jour le devis local (converted_to_invoice_id, quote_status)
 * 5. Lier la facture au sales_order du devis
 *
 * IMPORTANT: La facture créée est en brouillon (draft)
 * Elle doit être finalisée manuellement via l'UI
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { Json } from '@verone/types/supabase';
import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// Local quote from financial_documents
interface ILocalQuote {
  id: string;
  sales_order_id: string | null;
  partner_id: string;
  partner_type: string;
  customer_type: string | null;
  individual_customer_id: string | null;
  channel_id: string | null;
  billing_address: unknown;
  shipping_address: unknown;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  billing_contact_id: string | null;
  delivery_contact_id: string | null;
  responsable_contact_id: string | null;
  created_by: string;
  notes: string | null;
  linkme_selection_id: string | null;
  linkme_affiliate_id: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    localDocumentId?: string;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier que le devis est finalisé
    const currentQuote = await client.getClientQuoteById(id);

    if (currentQuote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote must be finalized before conversion to invoice',
        },
        { status: 400 }
      );
    }

    if (currentQuote.converted_to_invoice_id) {
      return NextResponse.json(
        {
          success: false,
          error: `Quote already converted to invoice ${currentQuote.converted_to_invoice_id}`,
        },
        { status: 400 }
      );
    }

    // Convertir en facture (créée en brouillon dans Qonto)
    const invoice = await client.convertQuoteToInvoice(id);

    // ========================================
    // Création locale: financial_documents pour la facture
    // ========================================
    const supabase = createAdminClient();

    // Obtenir l'utilisateur courant pour created_by
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    // Chercher le devis local dans financial_documents (par qonto_invoice_id)
    const { data: localQuote } = await supabase
      .from('financial_documents')
      .select(
        'id, sales_order_id, partner_id, partner_type, customer_type, individual_customer_id, channel_id, billing_address, shipping_address, shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate, billing_contact_id, delivery_contact_id, responsable_contact_id, created_by, notes, linkme_selection_id, linkme_affiliate_id'
      )
      .eq('document_type', 'customer_quote')
      .eq('qonto_invoice_id', id)
      .is('deleted_at', null)
      .single();

    const typedLocalQuote = localQuote as unknown as ILocalQuote | null;

    // Déterminer le created_by (priorité: utilisateur courant > créateur du devis)
    const createdBy = user?.id ?? typedLocalQuote?.created_by;

    if (!createdBy) {
      console.error(
        '[API Qonto Quote Convert] Cannot determine created_by - no auth user and no local quote'
      );
      // Retourner succès partiel: conversion Qonto OK mais pas de doc local
      return NextResponse.json({
        success: true,
        invoice,
        message:
          'Quote converted in Qonto but local document not created (no authenticated user)',
      });
    }

    // Calculer les montants depuis la facture Qonto
    const totalHt =
      invoice.subtotal_amount ?? invoice.subtotal_amount_cents / 100;
    const totalTtc = invoice.total_amount ?? invoice.total_amount_cents / 100;
    const tvaAmount =
      invoice.total_vat_amount ?? invoice.total_vat_amount_cents / 100;

    // Déterminer partner_id et partner_type depuis le devis local ou le client Qonto
    const partnerId = typedLocalQuote?.partner_id;
    const partnerType = typedLocalQuote?.partner_type ?? 'organisation';

    if (!partnerId) {
      console.warn(
        '[API Qonto Quote Convert] No local quote found - creating invoice without partner link'
      );
      // Succès partiel: conversion OK dans Qonto
      return NextResponse.json({
        success: true,
        invoice,
        message:
          'Quote converted in Qonto but local document not created (no partner_id from local quote)',
      });
    }

    // Créer le document local pour la facture
    const { data: newDoc, error: insertError } = await supabase
      .from('financial_documents')
      .insert({
        document_type: 'customer_invoice',
        document_direction: 'inbound',
        partner_id: partnerId,
        partner_type: partnerType,
        document_number: invoice.invoice_number ?? `FAC-CONV-${id.slice(0, 8)}`,
        document_date:
          invoice.issue_date ?? new Date().toISOString().split('T')[0],
        due_date: invoice.payment_deadline ?? null,
        total_ht: totalHt,
        total_ttc: totalTtc,
        tva_amount: tvaAmount,
        status: 'draft',
        qonto_invoice_id: invoice.id,
        qonto_pdf_url: invoice.pdf_url ?? null,
        qonto_public_url: invoice.public_url ?? null,
        invoice_source: 'qonto_conversion',
        workflow_status: 'synchronized',
        sales_order_id: typedLocalQuote?.sales_order_id ?? null,
        customer_type: typedLocalQuote?.customer_type ?? null,
        individual_customer_id: typedLocalQuote?.individual_customer_id ?? null,
        channel_id: typedLocalQuote?.channel_id ?? null,
        billing_address: (typedLocalQuote?.billing_address as Json) ?? null,
        shipping_address: (typedLocalQuote?.shipping_address as Json) ?? null,
        shipping_cost_ht: typedLocalQuote?.shipping_cost_ht ?? 0,
        handling_cost_ht: typedLocalQuote?.handling_cost_ht ?? 0,
        insurance_cost_ht: typedLocalQuote?.insurance_cost_ht ?? 0,
        fees_vat_rate: typedLocalQuote?.fees_vat_rate ?? 0.2,
        billing_contact_id: typedLocalQuote?.billing_contact_id ?? null,
        delivery_contact_id: typedLocalQuote?.delivery_contact_id ?? null,
        responsable_contact_id: typedLocalQuote?.responsable_contact_id ?? null,
        created_by: createdBy,
        notes: typedLocalQuote?.notes ?? null,
        description: `Facture convertie depuis devis Qonto ${id}`,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error(
        '[API Qonto Quote Convert] Local invoice creation failed:',
        insertError
      );
      // Succès partiel: Qonto OK mais local échoue
      return NextResponse.json({
        success: true,
        invoice,
        message: `Quote converted in Qonto but local document creation failed: ${insertError.message}`,
      });
    }

    // Créer les items locaux depuis les items Qonto
    if (invoice.items && invoice.items.length > 0) {
      const localItems = invoice.items.map((item, index) => {
        const unitPrice = item.unit_price ?? 0;
        const qty = item.quantity ?? 1;
        const vatRate = item.vat_rate ?? 0.2;
        const itemTotalHt = unitPrice * qty;
        // vatRate from Qonto is decimal (0.2 = 20%)
        const vatPercent = vatRate < 1 ? vatRate * 100 : vatRate;
        const vatMultiplier = vatRate < 1 ? vatRate : vatRate / 100;
        const itemTvaAmount = itemTotalHt * vatMultiplier;
        const itemTotalTtc = itemTotalHt + itemTvaAmount;

        return {
          document_id: newDoc.id,
          description: item.title ?? item.description ?? 'Article',
          quantity: qty,
          unit_price_ht: unitPrice,
          total_ht: itemTotalHt,
          tva_rate: vatPercent,
          tva_amount: itemTvaAmount,
          total_ttc: itemTotalTtc,
          sort_order: index,
        };
      });

      const { error: itemsInsertError } = await supabase
        .from('financial_document_items')
        .insert(localItems);

      if (itemsInsertError) {
        console.error(
          '[API Qonto Quote Convert] Local items creation failed:',
          itemsInsertError
        );
      }
    }

    // Mettre à jour le devis local: converted_to_invoice_id + quote_status
    if (typedLocalQuote) {
      const { error: updateQuoteError } = await supabase
        .from('financial_documents')
        .update({
          converted_to_invoice_id: newDoc.id,
          quote_status: 'converted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', typedLocalQuote.id);

      if (updateQuoteError) {
        console.error(
          '[API Qonto Quote Convert] Quote update failed:',
          updateQuoteError
        );
      }
    }

    // ========================================
    // Auto-création commande (sales_order) si devis standalone
    // ========================================
    let salesOrderId: string | null = typedLocalQuote?.sales_order_id ?? null;

    if (!salesOrderId && typedLocalQuote) {
      // Générer le numéro de commande
      const { data: soNumber, error: soNumberError } =
        await supabase.rpc('generate_so_number');

      if (soNumberError || !soNumber) {
        console.error(
          '[API Qonto Quote Convert] SO number generation failed:',
          soNumberError
        );
      } else {
        // Calculer les totaux depuis les items de la facture
        let orderTotalHt = 0;
        let orderTotalTtc = 0;
        const orderTaxRate = 0.2;

        if (invoice.items && invoice.items.length > 0) {
          for (const item of invoice.items) {
            const unitPrice = item.unit_price ?? 0;
            const qty = item.quantity ?? 1;
            const vatRate =
              (item.vat_rate ?? 0.2) < 1
                ? (item.vat_rate ?? 0.2)
                : (item.vat_rate ?? 20) / 100;
            const lineHt = unitPrice * qty;
            const lineTtc = lineHt * (1 + vatRate);
            orderTotalHt += lineHt;
            orderTotalTtc += lineTtc;
          }
        }

        // Créer la commande
        const { data: newOrder, error: orderInsertError } = await supabase
          .from('sales_orders')
          .insert({
            order_number: soNumber,
            customer_id: partnerType === 'organisation' ? partnerId : null,
            customer_type: (typedLocalQuote.customer_type ?? 'organization') as
              | 'organization'
              | 'individual',
            individual_customer_id:
              typedLocalQuote.individual_customer_id ?? null,
            channel_id: typedLocalQuote.channel_id ?? null,
            order_date:
              invoice.issue_date ?? new Date().toISOString().split('T')[0],
            billing_address: (typedLocalQuote.billing_address as Json) ?? null,
            shipping_address:
              (typedLocalQuote.shipping_address as Json) ?? null,
            shipping_cost_ht: typedLocalQuote.shipping_cost_ht ?? 0,
            handling_cost_ht: typedLocalQuote.handling_cost_ht ?? 0,
            insurance_cost_ht: typedLocalQuote.insurance_cost_ht ?? 0,
            fees_vat_rate: typedLocalQuote.fees_vat_rate ?? 0.2,
            billing_contact_id: typedLocalQuote.billing_contact_id ?? null,
            delivery_contact_id: typedLocalQuote.delivery_contact_id ?? null,
            responsable_contact_id:
              typedLocalQuote.responsable_contact_id ?? null,
            total_ht: orderTotalHt,
            total_ttc: orderTotalTtc,
            tax_rate: orderTaxRate,
            created_by: createdBy,
            notes: typedLocalQuote.notes ?? null,
            status: 'draft',
            linkme_selection_id: typedLocalQuote.linkme_selection_id ?? null,
          })
          .select('id')
          .single();

        if (orderInsertError || !newOrder) {
          console.error(
            '[API Qonto Quote Convert] Sales order creation failed:',
            orderInsertError
          );
        } else {
          salesOrderId = newOrder.id;

          // Titres de frais à exclure (déjà dans les champs dédiés)
          const FEE_TITLES = [
            'Frais de livraison',
            'Frais de manutention',
            "Frais d'assurance",
          ];

          // Récupérer les items du devis local pour le mapping product_id
          const { data: quoteItems } = await supabase
            .from('financial_document_items')
            .select(
              'description, product_id, sort_order, discount_percentage, eco_tax, linkme_selection_item_id, base_price_ht, retrocession_rate'
            )
            .eq('document_id', typedLocalQuote.id)
            .order('sort_order');

          // Créer les sales_order_items
          if (invoice.items && invoice.items.length > 0) {
            const orderItems: Array<{
              sales_order_id: string;
              product_id: string;
              quantity: number;
              unit_price_ht: number;
              tax_rate: number;
              discount_percentage: number;
              eco_tax: number;
              linkme_selection_item_id?: string | null;
              retrocession_rate?: number | null;
              retrocession_amount?: number | null;
              base_price_ht_locked?: number | null;
            }> = [];

            for (const [index, item] of invoice.items.entries()) {
              // Exclure les lignes de frais
              if (FEE_TITLES.includes(item.title ?? '')) continue;

              // Résoudre product_id depuis le devis local
              const matchingQuoteItem = quoteItems?.find(
                (qi, i) => i === index || qi.description === (item.title ?? '')
              );
              let productId = matchingQuoteItem?.product_id ?? null;

              // Si pas trouvé dans le devis, chercher par nom dans products
              if (!productId && item.title) {
                const { data: product } = await supabase
                  .from('products')
                  .select('id')
                  .ilike('name', item.title)
                  .limit(1)
                  .single();
                productId = product?.id ?? null;
              }

              // product_id est NOT NULL dans sales_order_items → skip si absent
              if (!productId) {
                console.warn(
                  `[API Qonto Quote Convert] No product_id for item "${item.title}" - skipping sales_order_item`
                );
                continue;
              }

              const vatRate =
                (item.vat_rate ?? 0.2) < 1
                  ? (item.vat_rate ?? 0.2)
                  : (item.vat_rate ?? 20) / 100;

              const itemUnitPrice = item.unit_price ?? 0;
              const itemQty = item.quantity ?? 1;

              orderItems.push({
                sales_order_id: newOrder.id,
                product_id: productId,
                quantity: itemQty,
                unit_price_ht: itemUnitPrice,
                tax_rate: vatRate,
                discount_percentage:
                  matchingQuoteItem?.discount_percentage ?? 0,
                eco_tax: matchingQuoteItem?.eco_tax ?? 0,
                base_price_ht_locked: matchingQuoteItem?.base_price_ht ?? null,
                linkme_selection_item_id:
                  matchingQuoteItem?.linkme_selection_item_id ?? null,
                retrocession_rate: matchingQuoteItem?.retrocession_rate ?? null,
                retrocession_amount:
                  matchingQuoteItem?.retrocession_rate != null &&
                  matchingQuoteItem.retrocession_rate > 0
                    ? Math.round(
                        itemUnitPrice *
                          itemQty *
                          matchingQuoteItem.retrocession_rate *
                          100
                      ) / 100
                    : null,
              });
            }

            if (orderItems.length > 0) {
              const { error: itemsError } = await supabase
                .from('sales_order_items')
                .insert(orderItems);

              if (itemsError) {
                console.error(
                  '[API Qonto Quote Convert] Sales order items creation failed:',
                  itemsError
                );
              }
            }
          }

          // Lier la commande à la facture locale
          await supabase
            .from('financial_documents')
            .update({ sales_order_id: newOrder.id })
            .eq('id', newDoc.id);

          // Lier la commande au devis local
          await supabase
            .from('financial_documents')
            .update({ sales_order_id: newOrder.id })
            .eq('id', typedLocalQuote.id);

          console.warn(
            `[API Qonto Quote Convert] Sales order created: ${soNumber} (${newOrder.id})`
          );
        }
      }
    }

    console.warn(
      `[API Qonto Quote Convert] Success: quote ${id} → invoice ${invoice.id} (local: ${newDoc.id}, order: ${salesOrderId ?? 'none'})`
    );

    return NextResponse.json({
      success: true,
      invoice,
      localDocumentId: newDoc.id,
      message: salesOrderId
        ? 'Quote converted to draft invoice with auto-created sales order'
        : 'Quote converted to draft invoice successfully',
    });
  } catch (error) {
    console.error('[API Qonto Quote Convert] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
