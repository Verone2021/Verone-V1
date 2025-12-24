/**
 * API Route: POST /api/expenses/classify
 *
 * Classifie une expense en l'associant à une counterparty,
 * un rôle et une catégorie.
 *
 * Body:
 * - expenseId: string (required)
 * - counterpartyId: string (optional if newCounterparty provided)
 * - newCounterparty: { display_name, iban?, vat_number?, siren? } (optional)
 * - roleType: 'supplier_goods' | 'service_provider' | 'pro_customer' | 'individual_customer'
 * - category: string
 * - notes?: string
 * - createRule: boolean
 * - applyToHistory: boolean
 */

import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

interface ClassifyRequestBody {
  expenseId: string;
  counterpartyId?: string;
  newCounterparty?: {
    display_name: string;
    iban?: string;
    vat_number?: string;
    siren?: string;
  };
  // Aligned with DB constraint: 'supplier', 'customer', 'partner', 'internal'
  roleType: 'supplier' | 'customer' | 'partner' | 'internal';
  category: string;
  notes?: string;
  createRule: boolean;
  applyToHistory: boolean;
}

export async function POST(request: Request) {
  try {
    const body: ClassifyRequestBody = await request.json();

    // Validation
    if (!body.expenseId) {
      return NextResponse.json(
        { error: 'expenseId is required' },
        { status: 400 }
      );
    }

    if (!body.counterpartyId && !body.newCounterparty) {
      return NextResponse.json(
        { error: 'counterpartyId or newCounterparty is required' },
        { status: 400 }
      );
    }

    if (!body.roleType) {
      return NextResponse.json(
        { error: 'roleType is required' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let counterpartyId = body.counterpartyId;

    // Si nouvelle counterparty à créer
    if (body.newCounterparty && !counterpartyId) {
      // Créer la counterparty
      const { data: newCounterparty, error: createError } = await (
        supabase as { from: CallableFunction }
      )
        .from('counterparties')
        .insert({
          display_name: body.newCounterparty.display_name,
          name_normalized: body.newCounterparty.display_name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' '),
          vat_number: body.newCounterparty.vat_number || null,
          siren: body.newCounterparty.siren || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Classify] Error creating counterparty:', createError);
        return NextResponse.json(
          {
            error: 'Failed to create counterparty',
            details: createError.message,
          },
          { status: 500 }
        );
      }

      counterpartyId = (newCounterparty as { id: string }).id;

      // Si IBAN fourni, créer le compte bancaire
      if (body.newCounterparty.iban) {
        const { error: bankError } = await (
          supabase as { from: CallableFunction }
        )
          .from('counterparty_bank_accounts')
          .insert({
            counterparty_id: counterpartyId,
            iban: body.newCounterparty.iban.replace(/\s/g, '').toUpperCase(),
            label: 'Compte principal',
          });

        if (bankError) {
          console.error('[Classify] Error creating bank account:', bankError);
          // On continue quand même, c'est pas bloquant
        }
      }
    }

    // Mettre à jour l'expense
    const { data: updatedExpense, error: updateError } = await (
      supabase as { from: CallableFunction }
    )
      .from('expenses')
      .update({
        counterparty_id: counterpartyId,
        category: body.category,
        role_type: body.roleType,
        notes: body.notes || null,
        status: 'classified',
        classified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.expenseId)
      .select()
      .single();

    if (updateError) {
      console.error('[Classify] Error updating expense:', updateError);
      return NextResponse.json(
        { error: 'Failed to update expense', details: updateError.message },
        { status: 500 }
      );
    }

    // Si création de règle demandée
    let ruleCreated = false;
    let historyUpdated = 0;

    if (body.createRule && counterpartyId) {
      // Déterminer le type de règle
      let matchType: 'iban' | 'name_exact' | 'label_contains' = 'name_exact';
      let matchValue: string;

      // Récupérer l'IBAN de la transaction si disponible
      const { data: expense } = await (supabase as { from: CallableFunction })
        .from('v_expenses_with_details')
        .select('raw_data, transaction_counterparty_name, label')
        .eq('id', body.expenseId)
        .single();

      const rawData = (expense as { raw_data?: { counterparty_iban?: string } })
        ?.raw_data;
      const counterpartyIban = rawData?.counterparty_iban;

      if (counterpartyIban) {
        matchType = 'iban';
        matchValue = counterpartyIban.replace(/\s/g, '').toUpperCase();
      } else if (body.newCounterparty?.iban) {
        matchType = 'iban';
        matchValue = body.newCounterparty.iban.replace(/\s/g, '').toUpperCase();
      } else {
        // Utiliser le nom du tiers de la transaction
        const expenseData = expense as {
          transaction_counterparty_name?: string;
          label?: string;
        };
        matchValue =
          expenseData?.transaction_counterparty_name ||
          expenseData?.label ||
          body.newCounterparty?.display_name ||
          '';
      }

      // Créer la règle
      const { error: ruleError } = await (
        supabase as { from: CallableFunction }
      )
        .from('matching_rules')
        .insert({
          match_type: matchType,
          match_value: matchValue,
          counterparty_id: counterpartyId,
          default_category: body.category,
          default_role_type: body.roleType,
          priority: matchType === 'iban' ? 10 : 50,
          enabled: true,
        });

      if (ruleError) {
        // Peut échouer si règle existe déjà (unique constraint)
        console.error('[Classify] Error creating rule:', ruleError);
      } else {
        ruleCreated = true;

        // Appliquer à l'historique si demandé
        if (body.applyToHistory) {
          try {
            // Utiliser la RPC pour appliquer la règle
            const { data: result } = await (supabase.rpc as CallableFunction)(
              'apply_matching_rule_to_history',
              {
                p_match_type: matchType,
                p_match_value: matchValue,
                p_counterparty_id: counterpartyId,
                p_category: body.category,
                p_role_type: body.roleType,
              }
            );

            historyUpdated = result || 0;
          } catch (err) {
            console.error('[Classify] Error applying to history:', err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      expense: updatedExpense,
      counterpartyId,
      ruleCreated,
      historyUpdated,
      message: `Expense classified successfully${ruleCreated ? ` (rule created${historyUpdated > 0 ? `, ${historyUpdated} historical expenses updated` : ''})` : ''}`,
    });
  } catch (error) {
    console.error('[Classify] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
