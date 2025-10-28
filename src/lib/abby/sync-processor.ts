// =====================================================================
// Abby Sync Queue Processor
// Date: 2025-10-11
// Description: Traite queue async avec retry logic
// =====================================================================

import { createClient } from '@/lib/supabase/server';
import { getAbbyClient } from './client';
import type { CreateInvoicePayload } from './types';
import { AbbyError } from './errors';

// =====================================================================
// TYPES
// =====================================================================

interface SyncQueueItem {
  id: string;
  operation: string;
  entity_type: string;
  entity_id: string;
  abby_payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  next_retry_at: string | null;
}

// =====================================================================
// PROCESS SYNC QUEUE (MAIN ENTRY POINT)
// =====================================================================

export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const supabase = await createClient();
  const abbyClient = getAbbyClient();

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  try {
    // 1. Récupérer opérations pending prêtes pour traitement
    const { data: queueItems, error: fetchError } = await supabase
      .from('abby_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .or(
        `next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`
      )
      .order('created_at', { ascending: true })
      .limit(50); // Batch de 50 max

    if (fetchError) {
      console.error('Failed to fetch sync queue items:', fetchError);
      return results;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('Sync queue empty - no items to process');
      return results;
    }

    console.log(`Processing ${queueItems.length} sync queue items...`);

    // 2. Traiter chaque opération
    for (const item of queueItems as SyncQueueItem[]) {
      results.processed++;

      try {
        // Marquer comme processing
        await supabase
          .from('abby_sync_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Router opération
        await processOperation(abbyClient, supabase, item);

        // Success: marquer comme success
        await supabase
          .from('abby_sync_queue')
          .update({
            status: 'success',
            processed_at: new Date().toISOString(),
            next_retry_at: null,
          })
          .eq('id', item.id);

        results.succeeded++;
        console.log(
          `✅ Sync queue item ${item.id} (${item.operation}) succeeded`
        );
      } catch (error) {
        // Échec: incrémenter retry_count et marquer failed
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        const newRetryCount = item.retry_count + 1;

        await supabase
          .from('abby_sync_queue')
          .update({
            status: 'failed',
            retry_count: newRetryCount,
            last_error: errorMessage,
          })
          .eq('id', item.id);

        // Trigger calculate_next_retry() se déclenche automatiquement (migration 003)

        results.failed++;
        results.errors.push({ id: item.id, error: errorMessage });

        console.error(
          `❌ Sync queue item ${item.id} (${item.operation}) failed (retry ${newRetryCount}/${item.max_retries}):`,
          errorMessage
        );
      }
    }

    console.log(
      `Sync queue processing complete: ${results.succeeded} succeeded, ${results.failed} failed`
    );

    return results;
  } catch (error) {
    console.error('Unexpected error in processSyncQueue:', error);
    throw error;
  }
}

// =====================================================================
// PROCESS OPERATION (ROUTER)
// =====================================================================

async function processOperation(
  abbyClient: ReturnType<typeof getAbbyClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SyncQueueItem
): Promise<void> {
  switch (item.operation) {
    case 'create_invoice':
      await processCreateInvoice(abbyClient, supabase, item);
      break;

    case 'sync_customer':
      await processSyncCustomer(abbyClient, supabase, item);
      break;

    case 'update_invoice':
      await processUpdateInvoice(abbyClient, supabase, item);
      break;

    case 'cancel_invoice':
      await processCancelInvoice(abbyClient, supabase, item);
      break;

    default:
      throw new Error(`Unknown operation: ${item.operation}`);
  }
}

// =====================================================================
// OPERATION: CREATE_INVOICE
// =====================================================================

async function processCreateInvoice(
  abbyClient: ReturnType<typeof getAbbyClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SyncQueueItem
): Promise<void> {
  const payload = item.abby_payload as CreateInvoicePayload & {
    customerId: string;
    invoiceDate: string;
    dueDate?: string;
    reference?: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPriceHT: number;
      tvaRate: number;
    }>;
  };

  // 1. Créer facture complète sur Abby (avec lignes)
  const abbyInvoice = await abbyClient.createCompleteInvoice({
    customerId: payload.customerId,
    invoiceDate: payload.invoiceDate,
    dueDate: payload.dueDate,
    reference: payload.reference,
    lines: payload.items,
  });

  // 2. Mettre à jour facture locale avec abby_invoice_id et abby_invoice_number
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      abby_invoice_id: abbyInvoice.id,
      abby_invoice_number: abbyInvoice.invoiceNumber,
      status: 'sent', // Facture envoyée sur Abby
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.entity_id);

  if (updateError) {
    throw new Error(`Failed to update local invoice: ${updateError.message}`);
  }

  console.log(
    `Invoice ${item.entity_id} synced to Abby: ${abbyInvoice.invoiceNumber}`
  );
}

// =====================================================================
// OPERATION: SYNC_CUSTOMER
// =====================================================================

async function processSyncCustomer(
  abbyClient: ReturnType<typeof getAbbyClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SyncQueueItem
): Promise<void> {
  const payload = item.abby_payload as {
    name: string;
    email?: string;
    phone?: string;
    siret?: string;
  };

  // 1. Créer client sur Abby
  const abbyCustomer = await abbyClient.createCustomer({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    siret: payload.siret,
  });

  // 2. Mettre à jour organisation locale avec abby_customer_id
  const { error: updateError } = await supabase
    .from('organisations')
    .update({
      abby_customer_id: abbyCustomer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.entity_id);

  if (updateError) {
    throw new Error(
      `Failed to update local organisation: ${updateError.message}`
    );
  }

  console.log(
    `Customer ${item.entity_id} synced to Abby: ${abbyCustomer.id}`
  );
}

// =====================================================================
// OPERATION: UPDATE_INVOICE (PHASE 2)
// =====================================================================

async function processUpdateInvoice(
  abbyClient: ReturnType<typeof getAbbyClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SyncQueueItem
): Promise<void> {
  // TODO Phase 2: Implémenter update facture Abby
  throw new Error('Operation update_invoice not implemented yet (Phase 2)');
}

// =====================================================================
// OPERATION: CANCEL_INVOICE (PHASE 2)
// =====================================================================

async function processCancelInvoice(
  abbyClient: ReturnType<typeof getAbbyClient>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  item: SyncQueueItem
): Promise<void> {
  // TODO Phase 2: Implémenter cancel facture Abby
  throw new Error('Operation cancel_invoice not implemented yet (Phase 2)');
}

// =====================================================================
// HELPER: CLEANUP OLD COMPLETED OPERATIONS (À APPELER QUOTIDIEN)
// =====================================================================

export async function cleanupOldSyncOperations(): Promise<number> {
  const supabase = await createClient();

  // Appeler RPC cleanup_old_sync_operations() (migration 003)
  const { data, error } = await supabase.rpc('cleanup_old_sync_operations' as any);

  if (error) {
    console.error('Failed to cleanup old sync operations:', error);
    return 0;
  }

  console.log(`Cleaned up ${data} old sync operations (>30 days)`);
  return data as number;
}
