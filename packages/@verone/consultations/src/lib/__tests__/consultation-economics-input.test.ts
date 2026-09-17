/**
 * Tests unitaires — adaptateur unique ligne de consultation → calcul
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-CONSULT-MULTI-001 — 2026-09-16
 * Sprint BO-CONSULT-CURRENCY-001 — 2026-09-17 (tests devise)
 */

import { strict as assert } from 'node:assert';

import {
  CONSULTATION_PROPOSAL_VALIDITY_DAYS,
  computeItemsEconomics,
  consultationProposalValidUntil,
  consultationToEconomicsSettings,
  itemToEconomicsInput,
  itemsToEconomicsInputs,
  resolveConsultationTaxRate,
  resolveConsultationTvaPercentage,
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

// ---------------------------------------------------------------------------
// (e) TVA — une seule règle pour le devis, la commande et le PDF client
// ---------------------------------------------------------------------------

console.log('\n--- (e) TVA ---');

test('taux absent → 20 % (défaut de la colonne)', () => {
  assert.equal(resolveConsultationTvaPercentage(null), 20);
  assert.equal(resolveConsultationTvaPercentage({}), 20);
  assert.equal(resolveConsultationTvaPercentage({ tva_rate: null }), 20);
});

test('taux saisi respecté', () => {
  assert.equal(resolveConsultationTvaPercentage({ tva_rate: 5.5 }), 5.5);
  assert.equal(resolveConsultationTvaPercentage({ tva_rate: 0 }), 0);
});

test('taux illisible ou négatif → 20 %', () => {
  assert.equal(resolveConsultationTvaPercentage({ tva_rate: NaN }), 20);
  assert.equal(resolveConsultationTvaPercentage({ tva_rate: -3 }), 20);
});

test('fraction pour les documents financiers (0.2 et non 20)', () => {
  assert.ok(approxEqual(resolveConsultationTaxRate({ tva_rate: 20 }), 0.2));
  assert.ok(approxEqual(resolveConsultationTaxRate({ tva_rate: 5.5 }), 0.055));
  assert.ok(approxEqual(resolveConsultationTaxRate(null), 0.2));
});

// ---------------------------------------------------------------------------
// (f) Statut « option » (candidate) — neutralisé avant toute exposition
// ---------------------------------------------------------------------------

console.log('\n--- (f) OPTION CANDIDATE ---');

test('une option ne compte ni en chiffre d’affaires ni en marge', () => {
  const items = [
    makeItem({ id: 'retenue', unit_price: 200 }),
    makeItem({ id: 'option', unit_price: 900, status: 'candidate' }),
  ];
  const { totals, byItemId } = computeItemsEconomics(items, null);
  assert.equal(byItemId.get('option')?.included, false);
  assert.equal(totals.includedLines, 1);
  assert.ok(approxEqual(totals.billed, 200), `billed=${totals.billed}`);
  assert.ok(approxEqual(totals.revenue, 200));
});

test('une option ne bloque pas le devis et n’y entre pas', () => {
  const items = [
    makeItem({ id: 'retenue', unit_price: 200 }),
    makeItem({ id: 'option', status: 'candidate' }),
  ];
  assert.equal(
    countUnpricedLines(items),
    0,
    'option sans prix : non bloquante'
  );
  assert.equal(filterBillableItems(items).length, 1);
  assert.equal(filterBillableItems(items)[0]?.id, 'retenue');
});

test('une option ne porte aucune part des frais du fournisseur', () => {
  const items = [
    makeItem({ id: 'retenue', unit_price: 200 }),
    makeItem({ id: 'option', unit_price: 200, status: 'candidate' }),
  ];
  const { byItemId, totals } = computeItemsEconomics(items, null, [
    {
      supplierId: 'sup-1',
      shippingCostHt: 100,
      customsCostHt: 0,
      otherCostHt: 0,
    },
  ]);
  assert.equal(byItemId.get('option')?.supplierFees, 0);
  assert.ok(approxEqual(byItemId.get('retenue')?.supplierFees ?? 0, 100));
  assert.equal(totals.unallocatedSupplierFees, 0);
});

test('fournisseur sans ligne retenue : frais signalés comme non imputés', () => {
  const items = [makeItem({ id: 'option', status: 'candidate' })];
  const { totals } = computeItemsEconomics(items, null, [
    {
      supplierId: 'sup-1',
      shippingCostHt: 80,
      customsCostHt: 0,
      otherCostHt: 0,
    },
  ]);
  assert.ok(approxEqual(totals.unallocatedSupplierFees, 80));
  assert.equal(totals.supplierFees, 0);
});

// ---------------------------------------------------------------------------
// (g) Validité de la proposition client
// ---------------------------------------------------------------------------

console.log('\n--- (g) VALIDITÉ DE LA PROPOSITION ---');

test('30 jours après l’émission, au format français', () => {
  assert.equal(CONSULTATION_PROPOSAL_VALIDITY_DAYS, 30);
  assert.equal(
    consultationProposalValidUntil(new Date('2026-09-16T10:00:00Z')),
    '16/10/2026'
  );
});

test('passage d’une année', () => {
  assert.equal(
    consultationProposalValidUntil(new Date('2026-12-20T10:00:00Z')),
    '19/01/2027'
  );
});

test('la date d’émission n’est pas modifiée', () => {
  const issued = new Date('2026-09-16T10:00:00Z');
  consultationProposalValidUntil(issued);
  assert.equal(issued.toISOString(), '2026-09-16T10:00:00.000Z');
});

// ---------------------------------------------------------------------------
// (h) Conversion de devise — BO-CONSULT-CURRENCY-001
// ---------------------------------------------------------------------------

console.log('\n--- (h) CONVERSION DEVISE ---');

test('ligne EUR sans champ devise → coût inchangé (identité)', () => {
  const item = makeItem({ cost_price_override: 100 });
  const input = itemToEconomicsInput(item);
  assert.equal(input.unitCost, 100);
});

test('ligne USD à taux 0.87 → coût converti en euros', () => {
  const item = makeItem({
    cost_price_override: 100,
    cost_price_currency: 'USD',
    cost_price_exchange_rate: 0.87,
  });
  const input = itemToEconomicsInput(item);
  // 100 USD × 0.87 = 87.00 EUR
  assert.ok(
    input.unitCost !== null && Math.abs(input.unitCost - 87) < 0.001,
    `unitCost=${input.unitCost}, attendu 87`
  );
});

test('produit USD sans override → monnaie du produit appliquée', () => {
  const item = makeItem({
    cost_price_override: null,
    product: {
      cost_price: 200,
      cost_price_currency: 'USD',
      cost_price_exchange_rate: 0.87,
      eco_tax_default: 0,
      supplier_id: 'sup-1',
      archived_at: null,
    },
  });
  const input = itemToEconomicsInput(item);
  // 200 USD × 0.87 = 174.00 EUR
  assert.ok(
    input.unitCost !== null && Math.abs(input.unitCost - 174) < 0.001,
    `unitCost=${input.unitCost}, attendu 174`
  );
});

test('taux figé sur la ligne — changer la constante ne change plus rien', () => {
  // Le taux est stocké sur la ligne, pas recalculé depuis la constante
  const rate = 0.85; // taux "d’hier"
  const item = makeItem({
    cost_price_override: 100,
    cost_price_currency: 'USD',
    cost_price_exchange_rate: rate,
  });
  const input = itemToEconomicsInput(item);
  // 100 USD × 0.85 = 85.00 EUR (taux figé, pas 0.87)
  assert.ok(
    input.unitCost !== null && Math.abs(input.unitCost - 85) < 0.001,
    `unitCost=${input.unitCost}, attendu 85`
  );
});

test('ligne EUR explicite → pas de conversion', () => {
  const item = makeItem({
    cost_price_override: 250,
    cost_price_currency: 'EUR',
    cost_price_exchange_rate: 1,
  });
  const input = itemToEconomicsInput(item);
  assert.equal(input.unitCost, 250);
});

test('coût null → toujours null quelle que soit la devise', () => {
  const item = makeItem({
    cost_price_override: null,
    product: null,
    cost_price_currency: 'USD',
    cost_price_exchange_rate: 0.87,
  });
  const input = itemToEconomicsInput(item);
  assert.equal(input.unitCost, null);
});

test('arrondi au centime — 3 USD × 0.87 = 2.61 €', () => {
  const item = makeItem({
    cost_price_override: 3,
    cost_price_currency: 'USD',
    cost_price_exchange_rate: 0.87,
  });
  const input = itemToEconomicsInput(item);
  assert.equal(input.unitCost, 2.61);
});

test('la marge calcule sur le prix en euros, pas en dollars', () => {
  // 10 USD × 0.87 = 8.70 EUR ; marge 50 % → prix de vente = 8.70 × 1.5 = 13.05
  const { byItemId } = computeItemsEconomics(
    [
      makeItem({
        cost_price_override: 10,
        cost_price_currency: 'USD',
        cost_price_exchange_rate: 0.87,
      }),
    ],
    { default_margin_percentage: 50 }
  );
  const econ = byItemId.get('item-1');
  assert.ok(econ);
  assert.ok(
    approxEqual(econ.unitPrice ?? 0, 13.05),
    `unitPrice=${econ.unitPrice}, attendu 13.05`
  );
});

report('consultation-economics-input');
