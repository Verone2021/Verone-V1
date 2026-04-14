import type { createServerClient } from '@verone/utils/supabase/server';

export interface MatchResult {
  success: boolean;
  documentId?: string;
  paymentId?: string;
  error?: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  created_at: string;
  shipped_at: string | null;
}

export interface BankTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  settled_at: string | null;
  emitted_at: string;
  reference: string | null;
  raw_data: Record<string, unknown>;
}

export async function generateInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('financial_documents')
    .select('*', { count: 'exact', head: true })
    .eq('document_type', 'customer_invoice')
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`);
  const nextNumber = (count ?? 0) + 1;
  return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
}

export function extractFirstAttachmentId(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== 'object') return null;
  const data = rawData as Record<string, unknown>;
  if (Array.isArray(data.attachments) && data.attachments.length > 0) {
    const first: unknown = data.attachments[0];
    if (typeof first === 'object' && first !== null && 'id' in first) {
      return String((first as Record<string, unknown>).id);
    }
  }
  if (Array.isArray(data.attachment_ids) && data.attachment_ids.length > 0)
    return String(data.attachment_ids[0]);
  return null;
}
