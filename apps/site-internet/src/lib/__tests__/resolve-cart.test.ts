/**
 * Tests unitaires — le prix encaissé vient de la base, jamais du navigateur
 *
 * C'est le vrai livrable du sprint SI-CHECKOUT-PRICE-001 : sans ces cas,
 * rien n'empêche quelqu'un de réintroduire dans six mois un montant venu du
 * navigateur. Chaque test correspond à une tentative réelle possible.
 *
 * Exécution :
 *   npx tsx apps/site-internet/src/lib/__tests__/resolve-cart.test.ts
 *
 * Sprint SI-CHECKOUT-PRICE-001 — 2026-09-19
 */

import { strict as assert } from 'node:assert';

import type { CatalogPrice } from '../checkout/catalog-prices';
import type { DeclaredItem } from '../checkout/resolve-cart';
import { resolveCartItems } from '../checkout/resolve-cart';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}`);
    console.error(`       ${String(error)}`);
  }
}

const CANAPE = '11111111-1111-1111-1111-111111111111';
const LAMPE = '22222222-2222-2222-2222-222222222222';
const INCONNU = '99999999-9999-9999-9999-999999999999';

function catalogue(): Map<string, CatalogPrice> {
  return new Map<string, CatalogPrice>([
    [
      CANAPE,
      {
        product_id: CANAPE,
        name: 'Canapé Milano 3 places',
        price_ttc: 1499.0,
        eco_participation: 12.5,
        assembly_price: 90.0,
        requires_assembly: true,
      },
    ],
    [
      LAMPE,
      {
        product_id: LAMPE,
        name: 'Lampe boule GM naturelle',
        price_ttc: 49.65,
        eco_participation: 0,
        assembly_price: 0,
        requires_assembly: false,
      },
    ],
  ]);
}

function ligne(over: Partial<DeclaredItem> = {}): DeclaredItem {
  return {
    product_id: CANAPE,
    quantity: 1,
    include_assembly: false,
    price_ttc: 1499.0,
    eco_participation: 12.5,
    assembly_price: 90.0,
    ...over,
  };
}

console.log('Panier reconstruit depuis la base');

test('un panier au bon prix passe', () => {
  const result = resolveCartItems([ligne()], catalogue());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].unit_amount_cents, 151150);
  assert.equal(result.subtotalCents, 151150);
});

test('le libellé envoyé à Stripe vient de la base, pas du navigateur', () => {
  const result = resolveCartItems([ligne()], catalogue());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.items[0].name, 'Canapé Milano 3 places');
});

test('un prix minoré est refusé — le canapé à 1 centime ne passe pas', () => {
  const result = resolveCartItems([ligne({ price_ttc: 0.01 })], catalogue());
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
});

test('un prix majoré est refusé aussi', () => {
  const result = resolveCartItems([ligne({ price_ttc: 2000 })], catalogue());
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
});

test("l'éco-participation minorée est refusée", () => {
  const result = resolveCartItems(
    [ligne({ eco_participation: 0 })],
    catalogue()
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
});

test('un écart d’un seul centime est refusé', () => {
  const result = resolveCartItems([ligne({ price_ttc: 1498.99 })], catalogue());
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
});

test('un produit inconnu est refusé', () => {
  const result = resolveCartItems(
    [ligne({ product_id: INCONNU })],
    catalogue()
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'produit_indisponible');
});

test('un produit non publié est absent du catalogue, donc refusé', () => {
  // La fonction SQL ne renvoie que les produits vendables en ligne : un
  // produit dépublié disparaît de la table, exactement comme un inconnu.
  const sansLampe = catalogue();
  sansLampe.delete(LAMPE);
  const result = resolveCartItems(
    [ligne({ product_id: LAMPE, price_ttc: 49.65, eco_participation: 0 })],
    sansLampe
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'produit_indisponible');
});

test('le montage est facturé au prix de la base', () => {
  const result = resolveCartItems(
    [ligne({ include_assembly: true })],
    catalogue()
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.items[0].unit_amount_cents, 160150);
});

test('un prix de montage minoré est refusé', () => {
  const result = resolveCartItems(
    [ligne({ include_assembly: true, assembly_price: 1 })],
    catalogue()
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
});

test("le montage sur un produit qui n'en propose pas est refusé", () => {
  const result = resolveCartItems(
    [
      ligne({
        product_id: LAMPE,
        price_ttc: 49.65,
        eco_participation: 0,
        assembly_price: 0,
        include_assembly: true,
      }),
    ],
    catalogue()
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'montage_indisponible');
});

test('la quantité multiplie bien le prix de la base', () => {
  const result = resolveCartItems([ligne({ quantity: 3 })], catalogue());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.subtotalCents, 453450);
  assert.equal(Math.round(result.subtotalTtc * 100), 453450);
});

test('un panier à plusieurs lignes est refusé si UNE seule triche', () => {
  const result = resolveCartItems(
    [
      ligne(),
      ligne({
        product_id: LAMPE,
        price_ttc: 1,
        eco_participation: 0,
        assembly_price: 0,
      }),
    ],
    catalogue()
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'prix_modifie');
  assert.equal(result.product_id, LAMPE);
});

test('un panier vide donne un total nul, sans erreur', () => {
  const result = resolveCartItems([], catalogue());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.subtotalCents, 0);
});

console.log(`\n${passed} réussis, ${failed} échoués`);
if (failed > 0) process.exit(1);
