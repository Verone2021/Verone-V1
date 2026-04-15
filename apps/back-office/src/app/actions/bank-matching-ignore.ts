'use server';

import { createServerClient } from '@verone/utils/supabase/server';

export async function ignoreTransaction(
  bankTransactionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Non authentifie' };
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        matching_status: 'ignored',
        match_reason: reason ?? 'Ignore manuellement',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bankTransactionId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
