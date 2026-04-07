import type {
  MatchingRule,
  CreateRuleData,
  PreviewMatchResult,
} from '../../hooks/use-matching-rules';

// Type pour les organisations trouvées
export interface FoundOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  type: string;
  is_service_provider: boolean;
}

export interface RuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Mode édition: passer la règle existante
  rule?: MatchingRule | null;

  // Mode création: passer le label initial
  initialLabel?: string;
  initialCategory?: string;

  // Callbacks
  onCreate?: (data: CreateRuleData) => Promise<MatchingRule | null>;
  onUpdate?: (
    ruleId: string,
    data: {
      organisation_id?: string | null;
      default_category?: string | null;
      enabled?: boolean;
      allow_multiple_categories?: boolean;
      justification_optional?: boolean;
      match_patterns?: string[] | null;
    }
  ) => Promise<boolean>;
  /** Preview apply - affiche les transactions qui seront modifiées */
  previewApply?: (
    ruleId: string,
    newCategory?: string
  ) => Promise<PreviewMatchResult[]>;
  /** Confirm apply - applique aux labels sélectionnés */
  confirmApply?: (
    ruleId: string,
    selectedNormalizedLabels: string[]
  ) => Promise<{ nb_updated: number; updated_ids: string[] }>;
  onSuccess?: () => void;
}
