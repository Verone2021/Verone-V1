import type { LucideIcon } from 'lucide-react';

export interface RequestedField {
  key: string;
  label: string;
  category: string;
  inputType: 'text' | 'email' | 'tel' | 'date';
}

export interface InfoRequestData {
  id: string;
  requestedFields: RequestedField[];
  customMessage: string | null;
  recipientName: string | null;
  recipientEmail: string;
  recipientType: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  totalTtc: number;
  organisationName: string | null;
}

export interface WizardStepConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Missing fields the user must fill */
  missingFields: RequestedField[];
  /** Fields already filled (shown read-only) */
  existingFields: { key: string; label: string; value: string }[];
  /** Whether this step has any missing fields to fill */
  hasFieldsToFill: boolean;
}

export interface StepProps {
  step: WizardStepConfig;
  formValues: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
}
