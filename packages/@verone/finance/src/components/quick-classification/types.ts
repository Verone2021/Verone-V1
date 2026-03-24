import type { TvaRate } from '../../lib/tva';

// Type pour les lignes de ventilation TVA
export interface VatLine {
  id: string;
  description: string;
  amount_ht: number;
  tva_rate: TvaRate;
}

// Type pour les categories avec icones
export interface CategoryShortcut {
  code: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
}
