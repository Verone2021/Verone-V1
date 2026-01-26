/**
 * Tests unitaires - Calculs de marge LinkMe
 *
 * Exécution: npx tsx packages/@verone/utils/src/linkme/__tests__/margin-calculation.test.ts
 *
 * Vérifie que les calculs de marge utilisent le TAUX DE MARQUE correct:
 * - selling_price = base_price / (1 - margin_rate/100)
 * - gain = selling_price - base_price
 *
 * @module margin-calculation.test
 * @since 2026-01-21
 */

import { strict as assert } from 'node:assert';

import {
  calculateMargin,
  calculateGainFromSellingPrice,
  calculateMarginRateFromPrices,
  calculateAffiliateCommission,
  calculateCartTotals,
  formatEuros,
  formatPercent,
} from '../margin-calculation';

// ============================================================================
// HELPERS
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

// ============================================================================
// TESTS: calculateMargin
// ============================================================================

describe('calculateMargin (taux de marque)', () => {
  test('calcule correctement avec marge 15% (cas standard)', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 15 });

    // selling_price = 100 / (1 - 0.15) = 100 / 0.85 = 117.647...
    assert.strictEqual(result.sellingPriceHt, 117.65);
    // gain = 117.65 - 100 = 17.65
    assert.strictEqual(result.gainEuros, 17.65);
    assert.strictEqual(result.marginRate, 15);
  });

  test('calcule correctement avec marge 10%', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 10 });

    // selling_price = 100 / 0.90 = 111.11
    assert.strictEqual(result.sellingPriceHt, 111.11);
    assert.strictEqual(result.gainEuros, 11.11);
  });

  test('calcule correctement avec marge 20%', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 20 });

    // selling_price = 100 / 0.80 = 125
    assert.strictEqual(result.sellingPriceHt, 125);
    assert.strictEqual(result.gainEuros, 25);
  });

  test('gère margin_rate = 0 (pas de marge)', () => {
    const result = calculateMargin({ basePriceHt: 100, marginRate: 0 });

    assert.strictEqual(result.sellingPriceHt, 100);
    assert.strictEqual(result.gainEuros, 0);
  });

  test('gère les prix avec décimales (ex: 20.19€)', () => {
    // Cas réel: Plateau bois 20x30 à 20.19€ avec marge 15%
    const result = calculateMargin({ basePriceHt: 20.19, marginRate: 15 });

    // selling_price = 20.19 / 0.85 = 23.7529...
    assert.strictEqual(result.sellingPriceHt, 23.75);
    // gain = 23.75 - 20.19 = 3.56
    assert.strictEqual(result.gainEuros, 3.56);
  });

  test('throw si basePriceHt négatif', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: -1, marginRate: 15 }),
      /prix de base ne peut pas être négatif/
    );
  });

  test('throw si marginRate >= 100', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: 100, marginRate: 100 }),
      /taux de marge doit être entre 0 et 100/
    );
  });

  test('throw si marginRate négatif', () => {
    assert.throws(
      () => calculateMargin({ basePriceHt: 100, marginRate: -5 }),
      /taux de marge doit être entre 0 et 100/
    );
  });
});

// ============================================================================
// TESTS: calculateGainFromSellingPrice
// ============================================================================

describe('calculateGainFromSellingPrice (lecture DB)', () => {
  test('calcule gain depuis prix de vente DB', () => {
    const gain = calculateGainFromSellingPrice(100, 117.65);
    assert.strictEqual(gain, 17.65);
  });

  test('gère les décimales correctement', () => {
    const gain = calculateGainFromSellingPrice(20.19, 23.75);
    assert.strictEqual(gain, 3.56);
  });
});

// ============================================================================
// TESTS: calculateMarginRateFromPrices
// ============================================================================

describe('calculateMarginRateFromPrices (reverse engineering)', () => {
  test('retrouve le taux de marge depuis les prix', () => {
    // base=100, selling=117.65 → marge ~15%
    const rate = calculateMarginRateFromPrices(100, 117.65);
    // Légère imprécision due aux arrondis (15.00 ou 15.01 acceptable)
    assert.ok(rate >= 15 && rate <= 15.02, `Taux ${rate} hors plage [15, 15.02]`);
  });

  test('retourne 0 si base >= selling', () => {
    const rate = calculateMarginRateFromPrices(100, 100);
    assert.strictEqual(rate, 0);
  });

  test('throw si sellingPriceHt <= 0', () => {
    assert.throws(
      () => calculateMarginRateFromPrices(100, 0),
      /prix de vente doit être positif/
    );
  });
});

// ============================================================================
// TESTS: calculateAffiliateCommission
// ============================================================================

describe('calculateAffiliateCommission (produits affiliés)', () => {
  test('calcule commission 15% sur produit affilié', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 500,
      commissionRate: 15,
    });

    assert.strictEqual(result.commissionEuros, 75);
    assert.strictEqual(result.affiliateReceives, 425);
    assert.strictEqual(result.commissionRate, 15);
  });

  test('calcule commission 5% (commission plateforme LinkMe)', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 117.65,
      commissionRate: 5,
    });

    // commission = 117.65 × 0.05 = 5.88
    assert.strictEqual(result.commissionEuros, 5.88);
    assert.strictEqual(result.affiliateReceives, 111.77);
  });

  test('gère commission 0%', () => {
    const result = calculateAffiliateCommission({
      sellingPriceHt: 100,
      commissionRate: 0,
    });

    assert.strictEqual(result.commissionEuros, 0);
    assert.strictEqual(result.affiliateReceives, 100);
  });
});

// ============================================================================
// TESTS: calculateCartTotals
// ============================================================================

describe('calculateCartTotals (panier)', () => {
  test('calcule totaux pour panier simple (1 item)', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 1 },
    ]);

    assert.strictEqual(result.totalHT, 117.65);
    assert.strictEqual(result.totalTVA, 23.53); // 117.65 × 0.20
    assert.strictEqual(result.totalTTC, 141.18);
    assert.strictEqual(result.totalCommission, 17.65);
    assert.strictEqual(result.itemsCount, 1);
  });

  test('calcule totaux avec quantité > 1', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 3 },
    ]);

    assert.strictEqual(result.totalHT, 352.95); // 117.65 × 3
    assert.strictEqual(result.totalCommission, 52.95); // 17.65 × 3
    assert.strictEqual(result.itemsCount, 3);
  });

  test('calcule totaux pour panier multi-items', () => {
    const result = calculateCartTotals([
      { basePriceHt: 100, marginRate: 15, quantity: 1 }, // 117.65, gain 17.65
      { basePriceHt: 50, marginRate: 10, quantity: 2 }, // 55.56 × 2 = 111.12, gain 5.56 × 2
    ]);

    // 117.65 + 111.12 = 228.77 (arrondis peuvent donner 228.76 ou 228.77)
    assert.ok(
      result.totalHT >= 228.76 && result.totalHT <= 228.78,
      `totalHT ${result.totalHT} hors plage`
    );
    assert.ok(
      result.totalCommission >= 28.76 && result.totalCommission <= 28.78,
      `totalCommission ${result.totalCommission} hors plage`
    );
    assert.strictEqual(result.itemsCount, 3);
  });

  test('utilise taux TVA personnalisé', () => {
    const result = calculateCartTotals(
      [{ basePriceHt: 100, marginRate: 15, quantity: 1 }],
      0 // Export hors UE = 0% TVA
    );

    assert.strictEqual(result.totalTVA, 0);
    assert.strictEqual(result.totalTTC, 117.65);
    assert.strictEqual(result.effectiveTaxRate, 0);
  });

  test('gère panier vide', () => {
    const result = calculateCartTotals([]);

    assert.strictEqual(result.totalHT, 0);
    assert.strictEqual(result.totalTVA, 0);
    assert.strictEqual(result.totalTTC, 0);
    assert.strictEqual(result.totalCommission, 0);
    assert.strictEqual(result.itemsCount, 0);
  });
});

// ============================================================================
// TESTS: Formatage
// ============================================================================

describe('formatEuros / formatPercent', () => {
  test('formate montant en euros (format FR)', () => {
    const formatted = formatEuros(117.65);
    // Format FR: "117,65 €" ou "117.65 €" selon locale
    assert.ok(formatted.includes('117'));
    assert.ok(formatted.includes('€'));
  });

  test('formate pourcentage', () => {
    const formatted = formatPercent(15);
    assert.strictEqual(formatted, '15.0%');
  });
});

// ============================================================================
// VALIDATION CROISÉE: Frontend vs DB
// ============================================================================

describe('Validation croisée Frontend/DB', () => {
  test('formule identique à la migration SQL (20251216_001_taux_de_marque_formula.sql)', () => {
    // La DB utilise: selling_price_ht = base_price_ht / (1 - margin_rate / 100)
    // Vérifions que notre code produit le même résultat

    const testCases = [
      { base: 100, margin: 15, expected: 117.65 },
      { base: 100, margin: 10, expected: 111.11 },
      { base: 100, margin: 20, expected: 125 },
      { base: 50, margin: 15, expected: 58.82 },
      { base: 20.19, margin: 15, expected: 23.75 },
    ];

    for (const tc of testCases) {
      const result = calculateMargin({ basePriceHt: tc.base, marginRate: tc.margin });
      assert.strictEqual(
        result.sellingPriceHt,
        tc.expected,
        `base=${tc.base}, margin=${tc.margin}: attendu ${tc.expected}, reçu ${result.sellingPriceHt}`
      );
    }
  });
});

// ============================================================================
// RÉSUMÉ
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`RÉSULTAT: ${passed} passés, ${failed} échoués`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
