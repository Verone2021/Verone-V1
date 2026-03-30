export type CheckStatus = 'pass' | 'warn' | 'fail' | 'pending';

export interface PreClotureCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
}
