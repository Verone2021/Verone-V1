/**
 * Helpers pour POST /api/qonto/quotes/by-order/[orderId]/regenerate
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { QontoClient } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';

import {
  saveQuoteToLocalDb,
  markQuotesSuperseded,
} from '../../../route.context';
import type { IQuoteItem, IFeesData } from '../../../route.helpers';

// ---------------------------------------------------------------------------
// Qonto client factory
// ---------------------------------------------------------------------------

export function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// ---------------------------------------------------------------------------
// Shipping address footer
// ---------------------------------------------------------------------------

interface IShippingAddress {
  address_line1?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

export function buildShippingFooter(
  shippingAddress: IShippingAddress | undefined
): string | undefined {
  if (!shippingAddress?.city || !shippingAddress?.address_line1)
    return undefined;
  const countryPart =
    shippingAddress.country && shippingAddress.country !== 'FR'
      ? `, ${shippingAddress.country}`
      : '';
  return `Adresse de livraison : ${shippingAddress.address_line1}, ${shippingAddress.postal_code ?? ''} ${shippingAddress.city}${countryPart}`;
}

// ---------------------------------------------------------------------------
// Persister le nouveau devis en local + mise à jour revision_number et notes
// ---------------------------------------------------------------------------

interface IPersistNewQuoteParams {
  supabase: SupabaseClient<Database>;
  userId: string;
  orderId: string;
  supersededIds: string[];
  quoteId: string;
  pdfUrl: string | null | undefined;
  publicUrl: string | null | undefined;
  issueDate: string;
  expiryDate: string;
  customerId: string | undefined;
  items: IQuoteItem[];
  fees: IFeesData | undefined;
  shippingAddress: IShippingAddress | undefined;
  preservedNotes: string | undefined;
  newRevisionNumber: number;
}

export async function persistNewQuote(
  params: IPersistNewQuoteParams
): Promise<string | null> {
  const {
    supabase,
    userId,
    orderId,
    supersededIds,
    quoteId,
    pdfUrl,
    publicUrl,
    issueDate,
    expiryDate,
    customerId,
    items,
    fees,
    shippingAddress,
    preservedNotes,
    newRevisionNumber,
  } = params;

  // Marquer les anciens comme superseded (colonne quote_status)
  await markQuotesSuperseded(supabase, supersededIds);

  let localDocId: string | null = null;
  try {
    localDocId = await saveQuoteToLocalDb({
      supabase,
      userId,
      items,
      quoteId,
      pdfUrl,
      publicUrl,
      issueDate,
      expiryDate,
      consultationId: undefined,
      salesOrderId: orderId,
      customerId,
      standaloneCustomerId: undefined,
      fees,
      shippingAddress,
    });
  } catch (e) {
    console.error('[Regenerate Quote] DB save error (non-blocking):', e);
    return null;
  }

  if (!localDocId) return null;

  const { error: revisionError } = await supabase
    .from('financial_documents')
    .update({ revision_number: newRevisionNumber } as Record<string, unknown>)
    .eq('id', localDocId);
  if (revisionError) {
    console.warn(
      '[Regenerate Quote] Failed to set revision_number:',
      revisionError
    );
  }

  if (preservedNotes) {
    const { error: notesError } = await supabase
      .from('financial_documents')
      .update({ notes: preservedNotes })
      .eq('id', localDocId);
    if (notesError) {
      console.warn('[Regenerate Quote] Failed to set notes:', notesError);
    }
  }

  return localDocId;
}
