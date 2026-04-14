/** Types for useMatchingRules hook */

export interface VatBreakdownItem {
  tva_rate: number;
  percent: number;
}

export interface MatchingRule {
  id: string;
  priority: number;
  enabled: boolean;
  match_type: 'label_contains' | 'label_exact';
  match_value: string;
  match_patterns: string[] | null;
  display_label: string | null;
  organisation_id: string | null;
  individual_customer_id: string | null;
  counterparty_type: 'organisation' | 'individual' | null;
  default_category: string | null;
  default_role_type: 'supplier' | 'customer' | 'partner' | 'internal' | null;
  allow_multiple_categories: boolean;
  justification_optional: boolean;
  default_vat_rate: number | null;
  created_at: string;
  created_by: string | null;
  organisation_name: string | null;
  organisation_type: string | null;
  matched_expenses_count: number;
}

export interface PreviewMatchResult {
  normalized_label_group: string;
  sample_labels: string[];
  transaction_count: number;
  total_amount: number;
  first_seen: string;
  last_seen: string;
  counterparty_hint: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  reasons: string[];
  sample_transaction_ids: string[];
  already_applied_count: number;
  pending_count: number;
}

export interface ConfirmApplyResult {
  nb_updated: number;
  updated_ids: string[];
}

export interface CreateRuleData {
  match_type: 'label_contains' | 'label_exact';
  match_value: string;
  match_patterns?: string[] | null;
  display_label?: string;
  organisation_id?: string | null;
  individual_customer_id?: string | null;
  counterparty_type?: 'organisation' | 'individual' | null;
  default_category?: string | null;
  default_role_type: 'supplier' | 'customer' | 'partner' | 'internal';
  priority?: number;
  allow_multiple_categories?: boolean;
  justification_optional?: boolean;
  default_vat_rate?: number | null;
}

export interface UseMatchingRulesReturn {
  rules: MatchingRule[];
  isLoading: boolean;
  error: string | null;
  create: (data: CreateRuleData) => Promise<MatchingRule | null>;
  update: (
    id: string,
    data: Partial<CreateRuleData & { enabled: boolean }>
  ) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  applyAll: () => Promise<{ rulesApplied: number; expensesClassified: number }>;
  /** @deprecated Use previewApply + confirmApply instead */
  applyOne: (ruleId: string) => Promise<number>;
  previewApply: (
    ruleId: string,
    newCategory?: string
  ) => Promise<PreviewMatchResult[]>;
  confirmApply: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<ConfirmApplyResult>;
  autoClassifyAll: () => Promise<number>;
  refetch: () => Promise<void>;
}
