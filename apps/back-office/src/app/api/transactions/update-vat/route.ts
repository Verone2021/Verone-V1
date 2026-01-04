import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@verone/utils/supabase/server';

/**
 * API pour mettre à jour la TVA d'une transaction manuellement
 * POST /api/transactions/update-vat
 *
 * Body:
 * - transaction_id: string - ID de la transaction
 * - vat_rate: number | null - Taux de TVA (0, 5.5, 10, 20, ou null)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, vat_rate } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'transaction_id is required' },
        { status: 400 }
      );
    }

    // Valider le taux de TVA
    const validRates = [0, 5.5, 10, 20, null];
    if (vat_rate !== null && !validRates.includes(vat_rate)) {
      return NextResponse.json(
        { error: 'Invalid vat_rate. Must be 0, 5.5, 10, 20, or null' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Récupérer la transaction pour calculer les montants
    const { data: transaction, error: fetchError } = await supabase
      .from('bank_transactions')
      .select('id, amount')
      .eq('id', transaction_id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Calculer les montants HT et TVA
    const amount = Math.abs(transaction.amount);
    let amount_ht = amount;
    let amount_vat = 0;

    if (vat_rate !== null && vat_rate > 0) {
      // Calcul inverse: TTC = HT * (1 + TVA/100)
      // Donc HT = TTC / (1 + TVA/100)
      amount_ht = amount / (1 + vat_rate / 100);
      amount_vat = amount - amount_ht;
    }

    // Mettre à jour la transaction
    const { data: updated, error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        vat_rate: vat_rate,
        vat_amount: vat_rate !== null ? amount_vat : null,
        amount_ht: vat_rate !== null ? amount_ht : null,
        amount_vat: vat_rate !== null ? amount_vat : null,
        vat_source: 'manual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction_id)
      .select()
      .single();

    if (updateError) {
      console.error('[update-vat] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction: updated,
      message:
        vat_rate !== null ? `TVA mise à jour: ${vat_rate}%` : 'TVA retirée',
    });
  } catch (err) {
    console.error('[update-vat] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
