/**
 * Utilitaires partagés entre les fichiers de test consultation-economics.
 * Import dans chaque fichier de test thématique.
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

import type { ConsultationEconomicsLineInput } from '../consultation-economics';

/** Comparaison approximative de deux nombres flottants. */
export function approxEqual(a: number, b: number, eps = 0.0001): boolean {
  return Math.abs(a - b) <= eps;
}

/** Construit une ligne de test avec des valeurs par défaut raisonnables. */
export function makeLine(
  overrides: Partial<ConsultationEconomicsLineInput> = {}
): ConsultationEconomicsLineInput {
  return {
    id: 'test-line',
    quantity: 1,
    unitCost: 10,
    ecoTax: 0,
    shippingCost: 0,
    sellingShippingCost: 0,
    proposedPrice: 20,
    isFree: false,
    isSample: false,
    status: 'pending',
    supplierId: null,
    marginPercentage: null,
    ...overrides,
  };
}

/** Harness de test minimal — compte les succès et échecs. */
export function createTestRunner() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void): void {
    try {
      fn();
      process.stdout.write(`  ✅ ${name}\n`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}`);
      console.error(`     ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  function report(suiteName: string): void {
    process.stdout.write(`\n══════════════════════════════════════\n`);
    process.stdout.write(
      `${suiteName} — ${passed} ✅ / ${failed} ❌ (total: ${passed + failed})\n`
    );
    process.stdout.write(`══════════════════════════════════════\n\n`);
    if (failed > 0) {
      process.exit(1);
    }
  }

  return { test, report };
}
