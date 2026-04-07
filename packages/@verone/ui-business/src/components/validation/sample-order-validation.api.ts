import type { SupabaseClient } from '@supabase/supabase-js';

export async function getSourcingWorkflowMetrics() {
  return { total: 0, pending: 0, approved: 0, rejected: 0 };
}

export async function approveSampleOrder(
  supabase: SupabaseClient,
  orderId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('sample_orders')
    .update({ status: 'approved', notes })
    .eq('id', orderId);
  if (error) throw error;
}

export async function markSampleOrderDelivered(
  supabase: SupabaseClient,
  orderId: string
) {
  const { error } = await supabase
    .from('sample_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw error;
}

export async function validateSamples(
  supabase: SupabaseClient,
  draftIds: string[],
  result: 'approved' | 'rejected',
  notes?: string
) {
  const { error } = await supabase
    .from('product_drafts' as 'sample_orders')
    .update({ status: result, validation_notes: notes } as Record<
      string,
      unknown
    >)
    .in('id', draftIds);
  if (error) throw error;
}

export async function transferToProductCatalog(_draftId: string) {
  throw new Error('transferToProductCatalog not yet implemented');
}
