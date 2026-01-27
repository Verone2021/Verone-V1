/**
 * API Route: POST /api/qonto/sync-invoices
 * Synchronise les factures clients Qonto vers financial_documents
 *
 * Inclut TOUTES les factures: draft, unpaid, paid, overdue, canceled
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// Mapper status Qonto vers status financial_documents
function mapQontoStatus(
  qontoStatus: string
): 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' {
  switch (qontoStatus) {
    case 'draft':
      return 'draft';
    case 'unpaid':
      return 'sent';
    case 'paid':
      return 'paid';
    case 'overdue':
      return 'overdue';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    default:
      return 'draft';
  }
}

interface QontoInvoice {
  id: string;
  number?: string;
  invoice_number?: string;
  status: string;
  currency: string;
  total_amount: { value: string; currency: string };
  total_amount_cents: number;
  vat_amount?: { value: string; currency: string };
  vat_amount_cents?: number;
  issue_date: string;
  due_date?: string;
  payment_deadline?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  items?: Array<{
    title: string;
    quantity: string;
    unit_price: { value: string; currency: string };
    vat_rate: string;
    total_amount: { value: string; currency: string };
  }>;
}

export async function POST(_request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    synced: number;
    created: number;
    updated: number;
    errors: string[];
    message: string;
  }>
> {
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    const qontoClient = getQontoClient();
    const supabase = createAdminClient();

    // Recuperer TOUTES les factures de Qonto (sans filtre de status)
    const result = await qontoClient.getClientInvoices();
    const invoices = result.client_invoices as unknown as QontoInvoice[];

    console.log(`[Sync Invoices] Found ${invoices.length} invoices from Qonto`);

    for (const invoice of invoices) {
      try {
        // Obtenir le numero de facture (peut etre 'number' ou 'invoice_number')
        const invoiceNumber =
          invoice.number || invoice.invoice_number || invoice.id;
        // Obtenir la date d'echeance (peut etre 'due_date' ou 'payment_deadline')
        const dueDate = invoice.due_date || invoice.payment_deadline || null;

        // Calculer les montants
        const totalTtc = invoice.total_amount_cents / 100;
        const tvaAmount = (invoice.vat_amount_cents ?? 0) / 100;
        const totalHt = totalTtc - tvaAmount;

        // Chercher un partenaire correspondant dans organisations
        // On cherche par email du client Qonto
        let partnerId: string | null = null;
        if (invoice.client?.email) {
          const { data: org } = await supabase
            .from('organisations')
            .select('id')
            .eq('email', invoice.client.email)
            .maybeSingle();

          if (org) {
            partnerId = org.id;
          }
        }

        // Si pas trouve par email, chercher par nom
        if (!partnerId && invoice.client?.name) {
          const { data: org } = await supabase
            .from('organisations')
            .select('id')
            .or(
              `legal_name.ilike.%${invoice.client.name}%,trade_name.ilike.%${invoice.client.name}%`
            )
            .maybeSingle();

          if (org) {
            partnerId = org.id;
          }
        }

        // Chercher aussi dans individual_customers si pas trouve
        if (!partnerId && invoice.client?.email) {
          const { data: indiv } = await supabase
            .from('individual_customers')
            .select('id')
            .eq('email', invoice.client.email)
            .maybeSingle();

          if (indiv) {
            partnerId = indiv.id;
          }
        }

        // Si toujours pas de partner, creer une organisation placeholder
        if (!partnerId && invoice.client?.name) {
          const { data: newOrg, error: createError } = await supabase
            .from('organisations')
            .insert({
              legal_name: invoice.client.name,
              trade_name: invoice.client.name,
              email: invoice.client.email || null,
              type: 'customer',
              status: 'active',
            })
            .select('id')
            .single();

          if (!createError && newOrg) {
            partnerId = newOrg.id;
            console.log(
              `[Sync Invoices] Created placeholder org for ${invoice.client.name}`
            );
          }
        }

        // Skip si toujours pas de partner (requis par la table)
        if (!partnerId) {
          errors.push(
            `${invoiceNumber}: No partner found and could not create one`
          );
          continue;
        }

        // Verifier si la facture existe deja (par document_number)
        const { data: existing } = await supabase
          .from('financial_documents')
          .select('id, updated_at')
          .eq('document_number', invoiceNumber)
          .eq('document_type', 'customer_invoice')
          .maybeSingle();

        const documentData = {
          document_type: 'customer_invoice' as const,
          document_direction: 'inbound' as const,
          document_number: invoiceNumber,
          document_date: invoice.issue_date,
          due_date: dueDate,
          total_ht: totalHt,
          total_ttc: totalTtc,
          tva_amount: tvaAmount,
          amount_paid: invoice.status === 'paid' ? totalTtc : 0,
          status: mapQontoStatus(invoice.status),
          partner_id: partnerId,
          partner_type: 'customer' as const,
          // Stocker l'ID Qonto dans les champs abby (requis par contrainte DB)
          abby_invoice_id: invoice.id,
          abby_invoice_number: invoiceNumber,
          description: `Facture Qonto ${invoiceNumber}`,
          notes: `Client: ${invoice.client?.name || 'N/A'}`,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          // Update
          const { error: updateError } = await supabase
            .from('financial_documents')
            .update(documentData)
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`Update ${invoiceNumber}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Insert - need created_by (required), use system placeholder
          // Note: created_by expects a UUID - using a fixed system UUID
          const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
          const { error: insertError } = await supabase
            .from('financial_documents')
            .insert({
              ...documentData,
              created_at: invoice.created_at,
              created_by: SYSTEM_USER_ID,
            });

          if (insertError) {
            errors.push(`Insert ${invoiceNumber}: ${insertError.message}`);
          } else {
            created++;
          }
        }
      } catch (invoiceError) {
        const num = invoice.number || invoice.invoice_number || invoice.id;
        errors.push(
          `Invoice ${num}: ${invoiceError instanceof Error ? invoiceError.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      synced: invoices.length,
      created,
      updated,
      errors,
      message: `Sync terminee: ${created} creees, ${updated} mises a jour${errors.length > 0 ? `, ${errors.length} erreurs` : ''}`,
    });
  } catch (error) {
    console.error('[Sync Invoices] Error:', error);
    return NextResponse.json(
      {
        success: false,
        synced: 0,
        created,
        updated,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Erreur de synchronisation',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<
  NextResponse<{
    message: string;
  }>
> {
  return NextResponse.json({
    message:
      'POST /api/qonto/sync-invoices pour synchroniser les factures Qonto',
  });
}
