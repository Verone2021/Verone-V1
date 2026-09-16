/**
 * Tests unitaires — adaptateur unique ligne de consultation → calcul
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-MULTI-001 — 2026-09-16
 */

import { strict as assert } from 'node:assert';

import {
  computeItemsEconomics,
  consultationToEconomicsSettings,
  itemToEconomicsInput,
  itemsToEconomicsInputs,
  withResolvedPrices,
  type ConsultationEconomicsItemLike,
} from '../consultation-economics-input';
import {
  countUnpricedLines,
  filterBillableItems,
} from '../consultation-order-guards';

import {
  approxEqual,
  createTestRunner,
} from './consultation-economics.test-utils';

const { test, report } = createTestRunner();

/** Ligne de test : forme calcul + `archived_at` attendu par les gardes. */
type TestItem = ConsultationEconomicsItemLike & {
  product: {
    cost_price: number | null;
    eco_tax_default: number | null;
    supplier_id: string | null;
    archived_at: string | null;
  } | null;
};

function makeItem(overrides: Partial<TestItem> = {}): TestItem {
  return {
    id: 'item-1',
    quantity: 1,
    unit_price: null,
    is_free: false,
    is_sample: false,
    status: 'pending',
    shipping_cost: 0,
    selling_shipping_cost: 0,
    cost_price_override: null,
    margin_percentage: null,
    product: {
      cost_price: 100,
      eco_tax_default: 0,
      supplier_id: 'sup-1',
      archived_at: null,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// (a) Adaptateur de ligne
// ---------------------------------------------------------------------------

console.log('\n--- (a) ADAPTATEUR DE LIGNE ---');

test('cost_price_override prime sur products.cost_price', () => {
  const input = itemToEconomicsInput(makeItem({ cost_price_override: 42 }));
  assert.equal(input.unitCost, 42);
});

test('sans override, le coût vient du produit', () => {
  assert.equal(itemToEconomicsInput(makeItem()).unitCost, 100);
});

test('produit absent → coût null (costMissing côté calcul)', () => {
  const input = itemToEconomicsInput(makeItem({ product: null }));
  assert.equal(input.unitCost, null);
  assert.equal(input.supplierId, null);
});

test('marge de ligne reportée dans l’entrée de calcul', () => {
  assert.equal(
    itemToEconomicsInput(makeItem({ margin_percentage: 35 })).marginPercentage,
    35
  );
});

test('statut reporté tel quel (vocabulaire commun avec les gardes)', () => {
  assert.equal(
    itemToEconomicsInput(makeItem({ status: 'approved' })).status,
    'approved'
  );
});

test('quantité ≤ 0 écartée — computeLineEconomics lève sinon', () => {
  const inputs = itemsToEconomicsInputs([
    makeItem({ id: 'ok', quantity: 2 }),
    makeItem({ id: 'zero', quantity: 0 }),
    makeItem({ id: 'negatif', quantity: -3 }),
  ]);
  assert.equal(inputs.length, 1);
  assert.equal(inputs[0]?.id, 'ok');
});

// ---------------------------------------------------------------------------
// (b) Réglages depuis la consultation
// ---------------------------------------------------------------------------

console.log('\n--- (b) RÉGLAGES DE LA CONSULTATION ---');

test('marge par défaut absente → null', () => {
  assert.equal(
    consultationToEconomicsSettings(null).defaultMarginPercentage,
    null
  );
  assert.equal(
    consultationToEconomicsSettings({}).defaultMarginPercentage,
    null
  );
});

test('marge par défaut numérique conservée', () => {
  assert.equal(
    consultationToEconomicsSettings({ default_margin_percentage: 40 })
      .defaultMarginPercentage,
    40
  );
});

test('marge 0 conservée (0 % ≠ pas de marge)', () => {
  assert.equal(
    consultationToEconomicsSettings({ default_margin_percentage: 0 })
      .defaultMarginPercentage,
    0
  );
});

// ---------------------------------------------------------------------------
// (c) La marge produit enfin un prix de vente
// ---------------------------------------------------------------------------

console.log('\n--- (c) MARGE → PRIX DE VENTE ---');

test('ligne sans prix + marge 50 % → prix calculé 150', () => {
  const { byItemId } = computeItemsEconomics([makeItem()], {
    default_margin_percentage: 50,
  });
  const econ = byItemId.get('item-1');
  assert.ok(econ);
  assert.ok(
    approxEqual(econ.unitPrice ?? 0, 150),
    `unitPrice=${econ.unitPrice}`
  );
  assert.equal(econ.priceToFix, false);
});

test('prix saisi : la marge ne l’écrase pas', () => {
  const { byItemId } = computeItemsEconomics([makeItem({ unit_price: 180 })], {
    default_margin_percentage: 50,
  });
  assert.equal(byItemId.get('item-1')?.unitPrice, 180);
});

test('marge de ligne prioritaire sur la marge par défaut', () => {
  const { byItemId } = computeItemsEconomics(
    [makeItem({ margin_percentage: 20 })],
    { default_margin_percentage: 50 }
  );
  assert.ok(approxEqual(byItemId.get('item-1')?.unitPrice ?? 0, 120));
});

test('sans marge, la ligne reste « prix à fixer »', () => {
  const { byItemId, totals } = computeItemsEconomics([makeItem()], null);
  assert.equal(byItemId.get('item-1')?.unitPrice, null);
  assert.equal(totals.linesToPrice, 1);
});

test('frais de transport inclus dans le revient avant marge', () => {
  // revient = 100 + 20/2 = 110 ; marge 50 % → 165
  const { byItemId } = computeItemsEconomics(
    [makeItem({ quantity: 2, shipping_cost: 20 })],
    { default_margin_percentage: 50 }
  );
  assert.ok(approxEqual(byItemId.get('item-1')?.unitPrice ?? 0, 165));
});

// ---------------------------------------------------------------------------
// (d) Prix effectif et gardes de commande / devis
// ---------------------------------------------------------------------------

console.log('\n--- (d) PRIX EFFECTIF ET GARDES ---');

test('withResolvedPrices remplace le prix vide par le prix calculé', () => {
  const items = [makeItem()];
  const resolved = withResolvedPrices(
    items,
    computeItemsEconomics(items, { default_margin_percentage: 50 })
  );
  assert.ok(approxEqual(resolved[0]?.unit_price ?? 0, 150));
});

test('withResolvedPrices ne touche pas un prix saisi', () => {
  const items = [makeItem({ unit_price: 180 })];
  const resolved = withResolvedPrices(
    items,
    computeItemsEconomics(items, { default_margin_percentage: 50 })
  );
  assert.equal(resolved[0], items[0], 'objet inchangé attendu');
});

test('withResolvedPrices laisse une quantité ≤ 0 intacte', () => {
  const items = [makeItem({ quantity: 0, unit_price: 12 })];
  const resolved = withResolvedPrices(
    items,
    computeItemsEconomics(items, { default_margin_percentage: 50 })
  );
  assert.equal(resolved[0]?.unit_price, 12);
});

test('le devis n’est plus bloqué : 0 ligne sans prix après résolution', () => {
  const items = [makeItem(), makeItem({ id: 'item-2' })];
  assert.equal(countUnpricedLines(items), 2, 'sans marge : 2 prix à fixer');

  const resolved = withResolvedPrices(
    items,
    computeItemsEconomics(items, { default_margin_percentage: 50 })
  );
  assert.equal(countUnpricedLines(resolved), 0);
  assert.equal(filterBillableItems(resolved).length, 2);
  assert.ok(
    approxEqual(filterBillableItems(resolved)[0]?.unit_price ?? 0, 150)
  );
});

test('ligne refusée : hors facturable même avec une marge', () => {
  const items = [makeItem({ status: 'rejected' })];
  const resolved = withResolvedPrices(
    items,
    computeItemsEconomics(items, { default_margin_percentage: 50 })
  );
  assert.equal(filterBillableItems(resolved).length, 0);
  assert.equal(countUnpricedLines(resolved), 0);
});

test('ligne gratuite : prix calculé non facturé', () => {
  const items = [makeItem({ is_free: true })];
  const { totals } = computeItemsEconomics(items, {
    default_margin_percentage: 50,
  });
  assert.equal(totals.billed, 0);
  assert.equal(
    filterBillableItems(
      withResolvedPrices(
        items,
        computeItemsEconomics(items, { default_margin_percentage: 50 })
      )
    ).length,
    0
  );
});

test('total facturé = somme des prix calculés', () => {
  const items = [makeItem(), makeItem({ id: 'item-2', quantity: 3 })];
  const { totals } = computeItemsEconomics(items, {
    default_margin_percentage: 50,
  });
  assert.ok(approxEqual(totals.billed, 150 + 450), `billed=${totals.billed}`);
});

report('consultation-economics-input');
