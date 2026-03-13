/**
 * API Route: POST /api/qonto/invoices/consolidate
 *
 * Consolidation historique des liaisons commandes ↔ factures Qonto.
 *
 * Contexte : 74 commandes ont `invoiced_at` renseigné mais la table
 * `financial_documents` (créée après coup) ne contient aucun enregistrement.
 * Ce endpoint crée le lien local en récupérant toutes les factures Qonto
 * et en les matchant via `purchase_order_number` = `sales_orders.order_number`.
 *
 * Contraintes DB respectées :
 * - partner_type = 'customer' + document_direction = 'inbound' (FK organisations uniquement)
 * - invoice_source IN ('crm', 'uploaded', 'qonto_existing') → 'qonto_existing'
 * - qonto_invoice_id IS NOT NULL pour customer_invoice
 * - sales_order_id IS NOT NULL pour customer_invoice
 * - abs(total_ttc - (total_ht + tva_amount)) < 0.01
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { QontoClientInvoice } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';
import {
  createServerClient,
  createAdminClient,
} from '@verone/utils/supabase/server';

type DocumentStatus = Database['public']['Enums']['document_status'];

interface ConsolidateReport {
  success: boolean;
  synced: number;
  skipped_existing: number;
  skipped_no_order_ref: number;
  skipped_no_match: number;
  skipped_no_partner: number;
  skipped_individual_customer: number;
  errors: string[];
}

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

function mapQontoStatusToLocal(
  qontoStatus: QontoClientInvoice['status']
): DocumentStatus {
  switch (qontoStatus) {
    case 'draft':
      return 'draft';
    case 'unpaid':
      return 'sent';
    case 'overdue':
      return 'overdue';
    case 'paid':
      return 'paid';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'sent';
  }
}

/**
 * POST /api/qonto/invoices/consolidate
 *
 * Crée les enregistrements `financial_documents` manquants pour toutes les
 * factures Qonto qui ont un `purchase_order_number` correspondant à une commande.
 */
export async function POST(
  _request: NextRequest
): Promise<NextResponse<ConsolidateReport>> {
  const report: ConsolidateReport = {
    success: false,
    synced: 0,
    skipped_existing: 0,
    skipped_no_order_ref: 0,
    skipped_no_match: 0,
    skipped_no_partner: 0,
    skipped_individual_customer: 0,
    errors: [],
  };

  try {
    // 1. Auth check
    const authSupabase = await createServerClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ...report, errors: ['Unauthorized'] },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const qontoClient = getQontoClient();

    // 2. Récupérer TOUTES les factures Qonto (pagination)
    const allInvoices: QontoClientInvoice[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const result = await qontoClient.getClientInvoices({
        perPage: 100,
        currentPage,
      });
      allInvoices.push(...result.client_invoices);
      totalPages = result.meta.total_pages;
      currentPage++;
    } while (currentPage <= totalPages);

    // 3. Récupérer les qonto_invoice_id déjà dans financial_documents → skip
    const { data: existingDocs } = await supabase
      .from('financial_documents')
      .select('qonto_invoice_id')
      .not('qonto_invoice_id', 'is', null);

    const existingQontoIds = new Set(
      (existingDocs ?? [])
        .map(d => d.qonto_invoice_id)
        .filter(Boolean) as string[]
    );

    // 4. Traiter chaque facture Qonto
    for (const invoice of allInvoices) {
      try {
        // Déjà liée localement ?
        if (existingQontoIds.has(invoice.id)) {
          report.skipped_existing++;
          continue;
        }

        // Pas de référence commande → skip
        // Qonto retourne `purchase_order` dans les GET, mais on envoie `purchase_order_number` à la création
        const orderRef =
          invoice.purchase_order ?? invoice.purchase_order_number;
        if (!orderRef) {
          report.skipped_no_order_ref++;
          continue;
        }

        // Chercher la commande par order_number
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .select('id, customer_id, individual_customer_id, customer_type')
          .eq('order_number', orderRef)
          .single();

        if (orderError ?? !order) {
          report.skipped_no_match++;
          continue;
        }

        // Individual customers : partner_id FK → organisations.id uniquement
        // Impossible de lier un individual_customer en partner_id
        if (order.customer_type === 'individual') {
          report.skipped_individual_customer++;
          continue;
        }

        // Partner ID = customer_id (organisation)
        const partnerId = order.customer_id;
        if (!partnerId) {
          report.skipped_no_partner++;
          continue;
        }

        // Calculer les montants depuis les centimes Qonto
        const totalHt = invoice.subtotal_amount_cents / 100;
        const tvaAmount = invoice.total_vat_amount_cents / 100;
        const totalTtc = invoice.total_amount_cents / 100;

        // Déterminer amountPaid
        const amountPaid = invoice.status === 'paid' ? totalTtc : 0;

        // Mapper le statut
        const status = mapQontoStatusToLocal(invoice.status);

        // INSERT dans financial_documents
        const { error: insertError } = await supabase
          .from('financial_documents')
          .insert({
            document_type: 'customer_invoice',
            document_direction: 'inbound',
            partner_id: partnerId,
            partner_type: 'customer',
            document_number: invoice.invoice_number,
            document_date: invoice.issue_date,
            due_date: invoice.payment_deadline ?? null,
            total_ht: totalHt,
            total_ttc: totalTtc,
            tva_amount: tvaAmount,
            amount_paid: amountPaid,
            status,
            sales_order_id: order.id,
            qonto_invoice_id: invoice.id,
            qonto_pdf_url: invoice.pdf_url ?? null,
            qonto_public_url: invoice.public_url ?? null,
            invoice_source: 'qonto_existing',
            created_by: user.id,
          });

        if (insertError) {
          report.errors.push(
            `Invoice ${invoice.invoice_number}: ${insertError.message}`
          );
          console.error(
            '[Consolidate] Insert error for invoice:',
            invoice.invoice_number,
            insertError
          );
        } else {
          report.synced++;
        }
      } catch (invoiceError) {
        const msg =
          invoiceError instanceof Error
            ? invoiceError.message
            : 'Unknown error';
        report.errors.push(`Invoice ${invoice.id}: ${msg}`);
        console.error(
          '[Consolidate] Error processing invoice:',
          invoice.id,
          invoiceError
        );
      }
    }

    report.success = true;
    return NextResponse.json(report);
  } catch (error) {
    console.error('[Consolidate] Fatal error:', error);
    report.errors.push(
      error instanceof Error ? error.message : 'Unknown fatal error'
    );
    return NextResponse.json(report, { status: 500 });
  }
}
