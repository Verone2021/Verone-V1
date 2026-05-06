/**
 * Module finance-totals — exports publics
 *
 * Usage : import { computeFinancialTotals } from '@verone/finance/lib/finance-totals'
 *
 * Sprint BO-FIN-046 — 2026-05-06
 * ADR : docs/current/finance/totals-source-of-truth.md
 * Règle R8 finance.md : toute fonction de calcul DOIT importer depuis ici.
 */

export { computeFinancialTotals } from './compute';
export { toQontoLines } from './qonto';
export { FORMULA_VERSION } from './types';
export type {
  FinancialItem,
  FinancialFees,
  FinancialTotals,
  QontoLine,
  ComputeOptions,
  FormulaVersion,
} from './types';
