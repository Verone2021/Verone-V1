/**
 * API Route: POST /api/qonto/invoices/[id]/sync-to-order
 *
 * Synchronise les modifications d'une facture vers la commande liee.
 * Utilise pour maintenir la coherence bidirectionnelle Facture <-> Commande.
 *
 * Conditions:
 * - La facture doit avoir un sales_order_id
 * - La commande doit etre modifiable (status IN ['draft', 'validated'])
 * - La facture ne doit PAS etre finalisee (workflow_status IN ['synchronized', 'draft_validated'])
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

// Type pour les items de facture
interface IInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  product_id: string | null;
}

// Type pour la facture avec relations
interface IInvoiceWithOrder {
  id: string;
  sales_order_id: string | null;
  workflow_status: string | null;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  billing_contact_id: string | null;
  delivery_contact_id: string | null;
  responsable_contact_id: string | null;
  due_date: string | null;
  notes: string | null;
}

interface ISalesOrder {
  id: string;
  status: string;
}

interface ISyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  updatedOrder?: {
    id: string;
    itemsUpdated: number;
  };
}

/**
 * POST /api/qonto/invoices/[id]/sync-to-order
 * Synchronise la facture vers la commande liee
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ISyncResponse>> {
  try {
    const { id: invoiceId } = await params;
    const supabase = createAdminClient();

    // 1. Recuperer la facture avec ses donnees de synchronisation
    const { data: invoice, error: invoiceError } = await supabase
      .from('financial_documents')
      .select(
        `
        id,
        sales_order_id,
        workflow_status,
        total_ht,
        total_ttc,
        tva_amount,
        billing_address,
        shipping_address,
        shipping_cost_ht,
        handling_cost_ht,
        insurance_cost_ht,
        fees_vat_rate,
        billing_contact_id,
        delivery_contact_id,
        responsable_contact_id,
        due_date,
        notes
      `
      )
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      console.error('[Sync-to-order] Invoice fetch error:', invoiceError);
      return NextResponse.json(
        { success: false, error: 'Facture introuvable' },
        { status: 404 }
      );
    }

    const typedInvoice = invoice as unknown as IInvoiceWithOrder;

    // 2. Verifier que la facture a une commande liee
    if (!typedInvoice.sales_order_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette facture n'est pas liee a une commande",
        },
        { status: 400 }
      );
    }

    // 3. Verifier que la facture est modifiable
    const editableStatuses = ['synchronized', 'draft_validated'];
    if (
      typedInvoice.workflow_status &&
      !editableStatuses.includes(typedInvoice.workflow_status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de synchroniser : la facture est ${typedInvoice.workflow_status}. Seules les factures en brouillon peuvent etre synchronisees.`,
        },
        { status: 400 }
      );
    }

    // 4. Verifier que la commande est modifiable
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('id, status')
      .eq('id', typedInvoice.sales_order_id)
      .single();

    if (orderError || !order) {
      console.error('[Sync-to-order] Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Commande liee introuvable' },
        { status: 404 }
      );
    }

    const typedOrder = order as ISalesOrder;
    const modifiableStatuses = ['draft', 'validated'];

    if (!modifiableStatuses.includes(typedOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de synchroniser : la commande est ${typedOrder.status}. Seules les commandes draft ou validated peuvent etre modifiees.`,
        },
        { status: 400 }
      );
    }

    // 5. Recuperer les lignes de la facture (sauf frais)
    const { data: invoiceItems, error: itemsError } = await (
      supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (
              column: string,
              value: string
            ) => {
              order: (
                column: string,
                options: { ascending: boolean }
              ) => Promise<{
                data: IInvoiceItem[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      }
    )
      .from('financial_document_items')
      .select(
        'id, description, quantity, unit_price_ht, total_ht, tva_rate, tva_amount, total_ttc, product_id'
      )
      .eq('document_id', invoiceId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('[Sync-to-order] Items fetch error:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la recuperation des lignes' },
        { status: 500 }
      );
    }

    // 6. Filtrer les lignes produits (exclure frais de service)
    const productItems = (invoiceItems || []).filter(
      item => item.product_id !== null
    );

    // Calculer totaux produits uniquement (hors frais)
    const productTotalHt = productItems.reduce(
      (sum, item) => sum + (item.total_ht || 0),
      0
    );
    const productTotalVat = productItems.reduce(
      (sum, item) => sum + (item.tva_amount || 0),
      0
    );

    // 7. Mettre a jour la commande
    // Note: Utiliser any pour bypasser les types stricts (colonnes existent dans la DB)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderUpdateData: Record<string, any> = {
      billing_address: typedInvoice.billing_address,
      shipping_address: typedInvoice.shipping_address,
      shipping_cost_ht: typedInvoice.shipping_cost_ht || 0,
      handling_cost_ht: typedInvoice.handling_cost_ht || 0,
      insurance_cost_ht: typedInvoice.insurance_cost_ht || 0,
      fees_vat_rate: typedInvoice.fees_vat_rate || 0.2,
      billing_contact_id: typedInvoice.billing_contact_id,
      delivery_contact_id: typedInvoice.delivery_contact_id,
      responsable_contact_id: typedInvoice.responsable_contact_id,
      // Recalculer les totaux de la commande
      total_ht:
        productTotalHt +
        (typedInvoice.shipping_cost_ht || 0) +
        (typedInvoice.handling_cost_ht || 0) +
        (typedInvoice.insurance_cost_ht || 0),
      total_ttc: typedInvoice.total_ttc,
      total_vat:
        productTotalVat +
        ((typedInvoice.shipping_cost_ht || 0) +
          (typedInvoice.handling_cost_ht || 0) +
          (typedInvoice.insurance_cost_ht || 0)) *
          (typedInvoice.fees_vat_rate || 0.2),
      notes: typedInvoice.notes,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateOrderError } = await (supabase as any)
      .from('sales_orders')
      .update(orderUpdateData)
      .eq('id', typedInvoice.sales_order_id);

    if (updateOrderError) {
      console.error('[Sync-to-order] Order update error:', updateOrderError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la mise a jour de la commande',
        },
        { status: 500 }
      );
    }

    // 8. Synchroniser les lignes de commande
    // Strategie: Supprimer les anciennes lignes et recreer a partir de la facture
    // (Plus simple que de faire du diff pour les cas complexes)

    // 8a. Supprimer les anciennes lignes
    const { error: deleteItemsError } = await supabase
      .from('sales_order_items')
      .delete()
      .eq('sales_order_id', typedInvoice.sales_order_id);

    if (deleteItemsError) {
      console.error('[Sync-to-order] Delete items error:', deleteItemsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la suppression des anciennes lignes',
        },
        { status: 500 }
      );
    }

    // 8b. Recreer les lignes a partir de la facture (seulement les produits)
    if (productItems.length > 0) {
      const newOrderItems = productItems
        .filter(item => item.product_id !== null) // S'assurer que product_id n'est pas null
        .map((item, index) => ({
          sales_order_id: typedInvoice.sales_order_id!,
          product_id: item.product_id!,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          tax_rate: item.tva_rate / 100, // tva_rate stocke en % dans items, convert to decimal
          notes: item.description,
          sort_order: index,
        }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertItemsError } = await (supabase as any)
        .from('sales_order_items')
        .insert(newOrderItems);

      if (insertItemsError) {
        console.error('[Sync-to-order] Insert items error:', insertItemsError);
        return NextResponse.json(
          {
            success: false,
            error: 'Erreur lors de la creation des nouvelles lignes',
          },
          { status: 500 }
        );
      }
    }

    console.warn(
      `[Sync-to-order] Successfully synced invoice ${invoiceId} to order ${typedInvoice.sales_order_id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Commande synchronisee avec succes',
      updatedOrder: {
        id: typedInvoice.sales_order_id,
        itemsUpdated: productItems.length,
      },
    });
  } catch (error) {
    console.error('[Sync-to-order] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inattendue',
      },
      { status: 500 }
    );
  }
}
