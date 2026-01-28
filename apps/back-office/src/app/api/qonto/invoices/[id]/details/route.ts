/**
 * API Route: GET /api/qonto/invoices/[id]/details
 *
 * Récupère les détails complets d'une facture locale :
 * - Informations de la facture (financial_documents)
 * - Lignes de la facture (financial_document_items)
 * - Client (organisations via partner_id)
 * - Documents liés (avoirs, devis source)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  product_id: string | null;
  product?: {
    name: string;
  } | null;
}

export interface InvoicePartner {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  vat_number: string | null;
  billing_address: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  } | null;
}

// Document lié (avoir)
export interface RelatedCreditNote {
  id: string;
  credit_note_number: string;
  status: string;
  total_ttc: number;
}

// Document lié (devis source)
export interface RelatedQuote {
  id: string;
  quote_number: string;
  status: string;
}

export interface InvoiceDetail {
  id: string;
  document_number: string;
  document_type: string;
  document_date: string;
  due_date: string | null;
  workflow_status:
    | 'synchronized'
    | 'draft_validated'
    | 'finalized'
    | 'sent'
    | 'paid';
  status: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  amount_paid: number;
  description: string | null;
  notes: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  qonto_public_url: string | null;
  synchronized_at: string | null;
  validated_to_draft_at: string | null;
  finalized_at: string | null;
  sent_at: string | null;
  partner: InvoicePartner | null;
  items: InvoiceItem[];
  sales_order_id: string | null;
  sales_order?: {
    order_number: string;
    shipping_address: {
      street?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    } | null;
  } | null;
  // Documents liés
  related_credit_notes?: RelatedCreditNote[];
  source_quote?: RelatedQuote | null;
}

interface InvoiceDetailsResponse {
  success: boolean;
  invoice?: InvoiceDetail;
  error?: string;
}

// Type pour les données brutes de la facture
interface RawInvoiceData {
  id: string;
  document_number: string;
  document_type: string;
  document_date: string;
  due_date: string | null;
  workflow_status: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  tva_amount: number;
  amount_paid: number;
  description: string | null;
  notes: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  qonto_public_url: string | null;
  synchronized_at: string | null;
  validated_to_draft_at: string | null;
  finalized_at: string | null;
  sent_at: string | null;
  sales_order_id: string | null;
  partner: InvoicePartner | null;
  sales_order: {
    order_number: string;
    shipping_address: {
      street?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    } | null;
  } | null;
}

// Type pour les lignes brutes
interface RawItemData {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  product_id: string | null;
  product: { name: string } | null;
}

/**
 * GET /api/qonto/invoices/[id]/details
 * Récupère les détails complets d'une facture
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<InvoiceDetailsResponse>> {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Validation UUID format
    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid invoice ID format',
        },
        { status: 400 }
      );
    }

    // Récupérer la facture avec le partenaire et la commande
    const { data: invoice, error: invoiceError } = await supabase
      .from('financial_documents')
      .select(
        `
        id,
        document_number,
        document_type,
        document_date,
        due_date,
        workflow_status,
        status,
        total_ht,
        total_ttc,
        tva_amount,
        amount_paid,
        description,
        notes,
        qonto_invoice_id,
        qonto_pdf_url,
        qonto_public_url,
        synchronized_at,
        validated_to_draft_at,
        finalized_at,
        sent_at,
        sales_order_id,
        partner:organisations!partner_id (
          id,
          legal_name,
          trade_name,
          email,
          phone,
          siret,
          vat_number,
          billing_address
        ),
        sales_order:sales_orders!sales_order_id (
          order_number,
          shipping_address
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invoice not found',
          },
          { status: 404 }
        );
      }
      console.error('[Invoice details] Query error:', invoiceError);
      return NextResponse.json(
        {
          success: false,
          error: invoiceError.message,
        },
        { status: 500 }
      );
    }

    // Cast to RawInvoiceData to handle TypeScript
    const rawInvoice = invoice as unknown as RawInvoiceData;

    // Récupérer les lignes de la facture
    // Note: financial_document_items n'est pas dans les types générés,
    // donc on utilise un client non typé pour cette requête
    const { data: items, error: itemsError } = await (
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
                data: RawItemData[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      }
    )
      .from('financial_document_items')
      .select(
        `
        id,
        description,
        quantity,
        unit_price_ht,
        total_ht,
        tva_rate,
        tva_amount,
        total_ttc,
        product_id,
        product:products!product_id (
          name
        )
      `
      )
      .eq('document_id', id)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('[Invoice details] Items query error:', itemsError);
      return NextResponse.json(
        {
          success: false,
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

    // Récupérer les documents liés
    let relatedCreditNotes: RelatedCreditNote[] = [];
    const sourceQuote: RelatedQuote | null = null;

    // Récupérer les avoirs liés depuis Qonto (si facture a un qonto_invoice_id)
    if (rawInvoice.qonto_invoice_id) {
      try {
        const qontoClient = getQontoClient();
        const creditNotesResult = await qontoClient.getClientCreditNotes();

        // Filtrer les avoirs qui référencent cette facture
        const linkedCreditNotes = creditNotesResult.client_credit_notes.filter(
          cn => cn.invoice_id === rawInvoice.qonto_invoice_id
        );

        relatedCreditNotes = linkedCreditNotes.map(cn => ({
          id: cn.id,
          credit_note_number: cn.credit_note_number,
          status: cn.status,
          total_ttc: cn.total_amount,
        }));
      } catch (qontoError) {
        // Log l'erreur mais ne pas bloquer la requête
        console.warn(
          '[Invoice details] Failed to fetch credit notes from Qonto:',
          qontoError
        );
      }
    }

    // Récupérer le devis source (si la facture a été créée depuis un devis)
    // Note: Cette relation n'est pas encore implémentée en base de données
    // TODO: Ajouter un champ source_quote_id à financial_documents quand on implémentera la conversion devis->facture

    // Construire la réponse
    const invoiceDetail: InvoiceDetail = {
      id: rawInvoice.id,
      document_number: rawInvoice.document_number,
      document_type: rawInvoice.document_type,
      document_date: rawInvoice.document_date,
      due_date: rawInvoice.due_date,
      workflow_status: (rawInvoice.workflow_status ||
        'synchronized') as InvoiceDetail['workflow_status'],
      status: rawInvoice.status,
      total_ht: rawInvoice.total_ht,
      total_ttc: rawInvoice.total_ttc,
      tva_amount: rawInvoice.tva_amount,
      amount_paid: rawInvoice.amount_paid,
      description: rawInvoice.description,
      notes: rawInvoice.notes,
      qonto_invoice_id: rawInvoice.qonto_invoice_id,
      qonto_pdf_url: rawInvoice.qonto_pdf_url,
      qonto_public_url: rawInvoice.qonto_public_url,
      synchronized_at: rawInvoice.synchronized_at,
      validated_to_draft_at: rawInvoice.validated_to_draft_at,
      finalized_at: rawInvoice.finalized_at,
      sent_at: rawInvoice.sent_at,
      sales_order_id: rawInvoice.sales_order_id,
      partner: rawInvoice.partner,
      sales_order: rawInvoice.sales_order,
      items: (items || []).map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        total_ht: item.total_ht,
        tva_rate: item.tva_rate,
        tva_amount: item.tva_amount,
        total_ttc: item.total_ttc,
        product_id: item.product_id,
        product: item.product,
      })),
      // Documents liés
      related_credit_notes: relatedCreditNotes,
      source_quote: sourceQuote,
    };

    return NextResponse.json({
      success: true,
      invoice: invoiceDetail,
    });
  } catch (error) {
    console.error('[Invoice details] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
