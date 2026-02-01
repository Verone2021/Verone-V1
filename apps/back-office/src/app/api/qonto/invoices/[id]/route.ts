/**
 * API Route: /api/qonto/invoices/[id]
 * Gestion d'une facture spécifique
 *
 * GET   - Détail d'une facture
 * PATCH - Modifie une facture brouillon (+ sync locale + sync vers commande)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import {
  createServerClient,
  createAdminClient,
} from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

/**
 * GET /api/qonto/invoices/[id]
 * Récupère les détails d'une facture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();
    const invoice = await client.getClientInvoiceById(id);

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('[API Qonto Invoice] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Interface pour les items Qonto
interface IQontoItem {
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unitPrice: { value: string; currency: string };
  vatRate: string;
}

// Interface pour les items locaux (avec donnees supplementaires)
interface ILocalItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  product_id?: string | null;
}

interface IPatchRequestBody {
  // Donnees Qonto
  dueDate?: string;
  header?: string;
  footer?: string;
  termsAndConditions?: string;
  items?: IQontoItem[];
  // Donnees locales supplementaires (sync)
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
  notes?: string;
  localItems?: ILocalItem[];
  syncToOrder?: boolean; // defaut: true
}

interface ILocalInvoice {
  id: string;
  workflow_status: string | null;
  sales_order_id: string | null;
}

/**
 * PATCH /api/qonto/invoices/[id]
 * Modifie une facture brouillon
 * - Met a jour Qonto
 * - Met a jour les donnees locales (financial_documents + financial_document_items)
 * - Synchronise vers la commande liee (si syncToOrder !== false)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    error?: string;
    synced?: boolean;
  }>
> {
  try {
    const { id } = await params;
    const body = (await request.json()) as IPatchRequestBody;
    const client = getQontoClient();
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    // Verifier que la facture est en brouillon dans Qonto
    const currentInvoice = await client.getClientInvoiceById(id);

    if (currentInvoice.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft invoices can be modified in Qonto',
        },
        { status: 400 }
      );
    }

    // Verifier le workflow_status local (permet modification seulement si synchronized ou draft_validated)
    const { data: localInvoice } = await supabase
      .from('financial_documents')
      .select('id, workflow_status, sales_order_id')
      .eq('qonto_invoice_id', id)
      .single();

    const typedLocalInvoice = localInvoice as ILocalInvoice | null;

    if (
      typedLocalInvoice?.workflow_status &&
      !['synchronized', 'draft_validated'].includes(
        typedLocalInvoice.workflow_status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot modify invoice with workflow_status ${typedLocalInvoice.workflow_status}. Only synchronized or draft_validated invoices are editable.`,
        },
        { status: 400 }
      );
    }

    // 1. Mettre a jour Qonto avec les donnees compatibles
    const qontoUpdateData: {
      dueDate?: string;
      header?: string;
      footer?: string;
      termsAndConditions?: string;
      items?: IQontoItem[];
    } = {};
    if (body.dueDate) qontoUpdateData.dueDate = body.dueDate;
    if (body.header) qontoUpdateData.header = body.header;
    if (body.footer) qontoUpdateData.footer = body.footer;
    if (body.termsAndConditions)
      qontoUpdateData.termsAndConditions = body.termsAndConditions;
    if (body.items) qontoUpdateData.items = body.items;

    let updatedQontoInvoice = currentInvoice;
    if (Object.keys(qontoUpdateData).length > 0) {
      updatedQontoInvoice = await client.updateClientInvoice(
        id,
        qontoUpdateData
      );
    }

    // 2. Mettre a jour les donnees locales dans financial_documents
    let synced = false;
    if (typedLocalInvoice?.id) {
      const localUpdateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Champs editables
      if (body.dueDate) localUpdateData.due_date = body.dueDate;
      if (body.notes !== undefined) localUpdateData.notes = body.notes;
      if (body.billing_address)
        localUpdateData.billing_address = body.billing_address;
      if (body.shipping_address)
        localUpdateData.shipping_address = body.shipping_address;
      if (body.shipping_cost_ht !== undefined)
        localUpdateData.shipping_cost_ht = body.shipping_cost_ht;
      if (body.handling_cost_ht !== undefined)
        localUpdateData.handling_cost_ht = body.handling_cost_ht;
      if (body.insurance_cost_ht !== undefined)
        localUpdateData.insurance_cost_ht = body.insurance_cost_ht;
      if (body.fees_vat_rate !== undefined)
        localUpdateData.fees_vat_rate = body.fees_vat_rate;

      // Recalculer les totaux si items fournis
      if (body.localItems && body.localItems.length > 0) {
        let totalHt = 0;
        let totalVat = 0;

        for (const item of body.localItems) {
          const lineHt = item.unit_price_ht * item.quantity;
          const lineVat = lineHt * (item.tva_rate / 100); // tva_rate en %
          totalHt += lineHt;
          totalVat += lineVat;
        }

        // Ajouter les frais
        const feesHt =
          (body.shipping_cost_ht ?? 0) +
          (body.handling_cost_ht ?? 0) +
          (body.insurance_cost_ht ?? 0);
        const feesVat = feesHt * (body.fees_vat_rate || 0.2);
        totalHt += feesHt;
        totalVat += feesVat;

        localUpdateData.total_ht = totalHt;
        localUpdateData.tva_amount = totalVat;
        localUpdateData.total_ttc = totalHt + totalVat;
      }

      // Update financial_documents
      const { error: updateDocError } = await adminSupabase
        .from('financial_documents')
        .update(localUpdateData)
        .eq('id', typedLocalInvoice.id);

      if (updateDocError) {
        console.error('[PATCH Invoice] Local update error:', updateDocError);
        // Ne pas echouer - Qonto est deja mis a jour
      }

      // 3. Mettre a jour les lignes (financial_document_items)
      if (body.localItems && body.localItems.length > 0) {
        // Supprimer les anciennes lignes
        await (
          adminSupabase as unknown as {
            from: (table: string) => {
              delete: () => {
                eq: (
                  column: string,
                  value: string
                ) => Promise<{ error: { message: string } | null }>;
              };
            };
          }
        )
          .from('financial_document_items')
          .delete()
          .eq('document_id', typedLocalInvoice.id);

        // Creer les nouvelles lignes
        const newItems = body.localItems.map((item, index) => ({
          document_id: typedLocalInvoice.id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          total_ht: item.unit_price_ht * item.quantity,
          tva_rate: item.tva_rate, // stocke en %
          tva_amount:
            item.unit_price_ht * item.quantity * (item.tva_rate / 100),
          total_ttc:
            item.unit_price_ht * item.quantity * (1 + item.tva_rate / 100),
          sort_order: index,
        }));

        await (
          adminSupabase as unknown as {
            from: (table: string) => {
              insert: (
                data: unknown[]
              ) => Promise<{ error: { message: string } | null }>;
            };
          }
        )
          .from('financial_document_items')
          .insert(newItems);
      }

      // 4. Synchroniser vers la commande (si demande)
      if (body.syncToOrder !== false && typedLocalInvoice.sales_order_id) {
        try {
          // Appel interne a l'endpoint sync-to-order
          const baseUrl = request.nextUrl.origin;
          const syncResponse = await fetch(
            `${baseUrl}/api/qonto/invoices/${typedLocalInvoice.id}/sync-to-order`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (syncResponse.ok) {
            synced = true;
            console.warn(
              `[PATCH Invoice] Synced to order ${typedLocalInvoice.sales_order_id}`
            );
          } else {
            const syncError = await syncResponse.json();
            console.warn('[PATCH Invoice] Sync to order warning:', syncError);
          }
        } catch (syncError) {
          console.warn('[PATCH Invoice] Sync to order failed:', syncError);
          // Ne pas echouer la requete - la mise a jour est faite
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice: updatedQontoInvoice,
      synced,
    });
  } catch (error) {
    console.error('[API Qonto Invoice] PATCH error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
