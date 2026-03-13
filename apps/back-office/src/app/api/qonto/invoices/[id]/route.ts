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

interface SyncErrorResponse {
  error?: string;
  message?: string;
}

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
    localData?: {
      billing_address?: Record<string, unknown>;
      shipping_address?: Record<string, unknown>;
      sales_order_id?: string | null;
      order_number?: string | null;
      partner_legal_name?: string | null;
      partner_trade_name?: string | null;
    } | null;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();
    const supabase = await createServerClient();
    const invoice = await client.getClientInvoiceById(id);

    // Enrich with local data (addresses + linked order + organisation names)
    let localData: {
      billing_address?: Record<string, unknown>;
      shipping_address?: Record<string, unknown>;
      sales_order_id?: string | null;
      order_number?: string | null;
      partner_legal_name?: string | null;
      partner_trade_name?: string | null;
    } | null = null;

    const { data: localDoc } = await supabase
      .from('financial_documents')
      .select(
        'billing_address, shipping_address, sales_order_id, partner_id, sales_orders!financial_documents_sales_order_id_fkey(order_number, billing_address, shipping_address), organisations!financial_documents_partner_id_fkey(legal_name, trade_name, billing_address_line1, billing_city, billing_postal_code, billing_country, shipping_address_line1, shipping_city, shipping_postal_code, shipping_country, address_line1, city, postal_code, country)'
      )
      .eq('qonto_invoice_id', id)
      .maybeSingle();

    if (localDoc) {
      const linkedOrder = localDoc.sales_orders as {
        order_number: string | null;
        billing_address: Record<string, unknown> | null;
        shipping_address: Record<string, unknown> | null;
      } | null;
      const linkedOrg = localDoc.organisations as {
        legal_name: string | null;
        trade_name: string | null;
        billing_address_line1: string | null;
        billing_city: string | null;
        billing_postal_code: string | null;
        billing_country: string | null;
        shipping_address_line1: string | null;
        shipping_city: string | null;
        shipping_postal_code: string | null;
        shipping_country: string | null;
        address_line1: string | null;
        city: string | null;
        postal_code: string | null;
        country: string | null;
      } | null;

      // Resolve billing address with fallback chain:
      // 1. financial_documents.billing_address
      // 2. sales_orders.billing_address (JSONB)
      // 3. organisations.billing_address_* columns
      // 4. organisations main address (address_line1, city, etc.)
      let resolvedBilling = localDoc.billing_address as
        | Record<string, unknown>
        | undefined;

      if (!resolvedBilling || !Object.values(resolvedBilling).some(Boolean)) {
        // Try sales order billing address
        const soBilling = linkedOrder?.billing_address;
        if (soBilling && Object.values(soBilling).some(Boolean)) {
          resolvedBilling = soBilling;
        } else if (
          linkedOrg?.billing_address_line1 ||
          linkedOrg?.billing_city
        ) {
          // Try organisation billing address columns
          resolvedBilling = {
            street: linkedOrg.billing_address_line1 ?? '',
            city: linkedOrg.billing_city ?? '',
            zip_code: linkedOrg.billing_postal_code ?? '',
            country: linkedOrg.billing_country ?? '',
          };
        } else if (linkedOrg?.address_line1 || linkedOrg?.city) {
          // Fallback to organisation main address
          resolvedBilling = {
            street: linkedOrg.address_line1 ?? '',
            city: linkedOrg.city ?? '',
            zip_code: linkedOrg.postal_code ?? '',
            country: linkedOrg.country ?? '',
          };
        }
      }

      // Resolve shipping address with fallback chain:
      // 1. financial_documents.shipping_address
      // 2. sales_orders.shipping_address (JSONB)
      // 3. organisations.shipping_address_* columns
      let resolvedShipping = localDoc.shipping_address as
        | Record<string, unknown>
        | undefined;

      if (!resolvedShipping || !Object.values(resolvedShipping).some(Boolean)) {
        const soShipping = linkedOrder?.shipping_address;
        if (soShipping && Object.values(soShipping).some(Boolean)) {
          resolvedShipping = soShipping;
        } else if (
          linkedOrg?.shipping_address_line1 ||
          linkedOrg?.shipping_city
        ) {
          resolvedShipping = {
            street: linkedOrg.shipping_address_line1 ?? '',
            city: linkedOrg.shipping_city ?? '',
            zip_code: linkedOrg.shipping_postal_code ?? '',
            country: linkedOrg.shipping_country ?? '',
          };
        }
      }

      localData = {
        billing_address: resolvedBilling,
        shipping_address: resolvedShipping,
        sales_order_id: localDoc.sales_order_id ?? null,
        order_number: linkedOrder?.order_number ?? null,
        partner_legal_name: linkedOrg?.legal_name ?? null,
        partner_trade_name: linkedOrg?.trade_name ?? null,
      };
    }

    return NextResponse.json({
      success: true,
      invoice,
      localData,
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
  issueDate?: string;
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

    // Recuperer les donnees locales pour la synchronisation
    const { data: localInvoice } = await supabase
      .from('financial_documents')
      .select('id, sales_order_id')
      .eq('qonto_invoice_id', id)
      .single();

    const typedLocalInvoice = localInvoice as ILocalInvoice | null;

    // 1. Mettre a jour Qonto avec les donnees compatibles
    const qontoUpdateData: {
      issueDate?: string;
      dueDate?: string;
      header?: string;
      footer?: string;
      termsAndConditions?: string;
      items?: IQontoItem[];
    } = {};
    if (body.issueDate) qontoUpdateData.issueDate = body.issueDate;
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
      if (body.issueDate) localUpdateData.document_date = body.issueDate;
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
        const feesVat = feesHt * (body.fees_vat_rate ?? 0.2);
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
            const syncError = (await syncResponse.json()) as SyncErrorResponse;
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
