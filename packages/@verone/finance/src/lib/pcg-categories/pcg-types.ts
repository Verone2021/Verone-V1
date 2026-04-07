/**
 * Types PCG (Plan Comptable Général)
 */

export type PcgLevel = 1 | 2 | 3;

export interface PcgCategory {
  code: string;
  label: string;
  parentCode: string | null;
  level: PcgLevel;
  description?: string;
  icon?: string;
}
