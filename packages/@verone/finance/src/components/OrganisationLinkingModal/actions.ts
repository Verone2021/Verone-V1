'use client';

import { createClient } from '@verone/utils/supabase/client';

import type {
  CreateRuleData,
  MatchingRule,
} from '../../hooks/use-matching-rules';
import type { CounterpartyType, ISelectedCounterparty } from './types';

interface ICreateCounterpartyParams {
  counterpartyType: CounterpartyType;
  newName: string;
  newEmail: string;
}

export async function createCounterparty({
  counterpartyType,
  newName,
  newEmail,
}: ICreateCounterpartyParams): Promise<ISelectedCounterparty | null> {
  if (!newName.trim()) return null;

  try {
    const supabase = createClient();

    if (counterpartyType === 'individual') {
      const nameParts = newName.trim().split(' ');
      const firstName = nameParts[0] ?? newName.trim();
      const lastName = nameParts.slice(1).join(' ') || '';

      const email =
        newEmail.trim() ||
        `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'client'}@placeholder.com`;

      const { data, error } = await supabase
        .from('individual_customers')
        .insert({
          first_name: firstName,
          last_name: lastName || firstName,
          email: email,
          is_active: true,
        })
        .select('id, first_name, last_name')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        type: 'individual',
        isOrganisation: false,
      };
    } else {
      let orgType: 'customer' | 'supplier';
      let isServiceProvider: boolean;

      if (counterpartyType === 'customer_pro') {
        orgType = 'customer';
        isServiceProvider = false;
      } else if (counterpartyType === 'supplier') {
        orgType = 'supplier';
        isServiceProvider = false;
      } else {
        // partner
        orgType = 'supplier';
        isServiceProvider = true;
      }

      const { data, error } = await supabase
        .from('organisations')
        .insert({
          legal_name: newName.trim(),
          type: orgType,
          is_service_provider: isServiceProvider,
          is_active: true,
          source: 'transaction_linking' as const,
        })
        .select('id, legal_name, type, is_service_provider')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.legal_name,
        type: counterpartyType,
        isOrganisation: true,
      };
    }
  } catch (err) {
    console.warn(
      '[OrganisationLinkingModal] Create failed:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

interface ILinkTransactionsAndRuleParams {
  label: string;
  counterpartyToUse: ISelectedCounterparty;
  createRule: boolean;
  existingRuleId: string | null | undefined;
  rules: Array<{
    id: string;
    organisation_id: string | null;
    match_patterns: string[] | null;
    match_value: string;
  }>;
  updateMatchingRule: (
    id: string,
    data: Partial<CreateRuleData & { enabled: boolean }>
  ) => Promise<boolean>;
  createMatchingRule: (data: CreateRuleData) => Promise<MatchingRule | null>;
}

export async function linkTransactionsAndRule({
  label,
  counterpartyToUse,
  createRule,
  existingRuleId,
  rules,
  updateMatchingRule,
  createMatchingRule,
}: ILinkTransactionsAndRuleParams): Promise<void> {
  const supabase = createClient();
  const isIndividual = counterpartyToUse.type === 'individual';

  const { error: updateError } = await supabase
    .from('bank_transactions')
    .update({
      counterparty_organisation_id: isIndividual ? null : counterpartyToUse.id,
      updated_at: new Date().toISOString(),
    })
    .ilike('counterparty_name', `%${label}%`);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // AUTO-PATTERN: si l'organisation a déjà une règle → ajouter le label aux patterns
  const orgRuleFromOrg = !isIndividual
    ? rules.find(r => r.organisation_id === counterpartyToUse.id)
    : null;

  if (orgRuleFromOrg) {
    const currentPatterns = orgRuleFromOrg.match_patterns ?? [
      orgRuleFromOrg.match_value,
    ];
    const normalizedLabel = label.trim();
    const patternExists = currentPatterns.some(
      p => p.toLowerCase() === normalizedLabel.toLowerCase()
    );

    if (!patternExists) {
      const newPatterns = [...currentPatterns, normalizedLabel];
      await updateMatchingRule(orgRuleFromOrg.id, {
        match_patterns: newPatterns,
      });
      await supabase.rpc('apply_rule_to_all_matching', {
        p_rule_id: orgRuleFromOrg.id,
      });
    }
  } else if (createRule) {
    const dbCounterpartyType: 'individual' | 'organisation' = isIndividual
      ? 'individual'
      : 'organisation';
    const ruleRoleType: 'supplier' | 'customer' | 'partner' =
      counterpartyToUse.type === 'customer_pro'
        ? 'customer'
        : counterpartyToUse.type === 'individual'
          ? 'customer'
          : counterpartyToUse.type;

    if (existingRuleId) {
      await updateMatchingRule(existingRuleId, {
        organisation_id: isIndividual ? null : counterpartyToUse.id,
        individual_customer_id: isIndividual ? counterpartyToUse.id : null,
        counterparty_type: dbCounterpartyType,
        default_role_type: ruleRoleType,
      });
    } else {
      await createMatchingRule({
        match_type: 'label_contains',
        match_value: label,
        match_patterns: [label],
        organisation_id: isIndividual ? null : counterpartyToUse.id,
        individual_customer_id: isIndividual ? counterpartyToUse.id : null,
        counterparty_type: dbCounterpartyType,
        default_category: null,
        default_role_type: ruleRoleType,
        priority: 100,
      });
    }
  }
}
