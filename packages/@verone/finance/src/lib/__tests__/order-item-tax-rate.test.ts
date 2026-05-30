/**
 * Tests unitaires — resolveOrderItemTaxRate
 *
 * Verrouille la règle R8 finance.md : la TVA d'une ligne vient de
 * `item.tax_rate`, JAMAIS de `order.tax_rate` qui est une colonne historique
 * souvent à 0 sur les commandes B2B / LinkMe.
 *
 * Exécution :
 *   npx tsx packages/@verone/finance/src/lib/__tests__/order-item-tax-rate.test.ts
 *
 * Sprint BO-FIN-INVOICE-VAT-001 — 2026-05-31
 */

import { strict as assert } from 'node:assert';
import { resolveOrderItemTaxRate } from '../order-item-tax-rate';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

console.log('\n--- resolveOrderItemTaxRate ---');

test('cas SO-2026-00178 : item 20%, commande legacy à 0 → 20%', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: 0.2 }, { tax_rate: 0 });
  assert.equal(r, 0.2, `attendu 0.2, obtenu ${r}`);
});

test('item 20%, commande 20% → 20% (cas standard)', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: 0.2 }, { tax_rate: 0.2 });
  assert.equal(r, 0.2);
});

test('item null, commande 20% → 20% (fallback commande)', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: null }, { tax_rate: 0.2 });
  assert.equal(r, 0.2);
});

test('item undefined, commande 20% → 20% (fallback commande)', () => {
  const r = resolveOrderItemTaxRate({}, { tax_rate: 0.2 });
  assert.equal(r, 0.2);
});

test('item null, commande null → 20% (fallback par défaut)', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: null }, { tax_rate: null });
  assert.equal(r, 0.2);
});

test('item undefined, commande undefined → 20% (fallback par défaut)', () => {
  const r = resolveOrderItemTaxRate({}, {});
  assert.equal(r, 0.2);
});

test('item TVA réduite 5,5%, commande à 0 → 5,5%', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: 0.055 }, { tax_rate: 0 });
  assert.equal(r, 0.055);
});

test('item TVA intermédiaire 10%, commande null → 10%', () => {
  const r = resolveOrderItemTaxRate({ tax_rate: 0.1 }, { tax_rate: null });
  assert.equal(r, 0.1);
});

test('item à 0 explicite (exonération), commande à 20% → 0 (item gagne)', () => {
  // PIÈGE CRITIQUE : 0 est une valeur valide, le `??` doit la conserver.
  // Si la fonction utilisait `||` au lieu de `??`, ce cas reviendrait à 20%
  // et casserait les commandes exonérées légitimes.
  const r = resolveOrderItemTaxRate({ tax_rate: 0 }, { tax_rate: 0.2 });
  assert.equal(r, 0, `attendu 0, obtenu ${r}`);
});

// ---------------------------------------------------------------------------
// Résumé
// ---------------------------------------------------------------------------

console.log(`\n${passed} passés, ${failed} échoués\n`);
process.exit(failed === 0 ? 0 : 1);
