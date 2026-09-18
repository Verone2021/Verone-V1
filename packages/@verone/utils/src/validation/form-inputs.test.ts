/**
 * Tests unitaires — saisies de formulaire tolérantes
 * Exécution standalone : npx tsx <ce-fichier>
 * Sprint BO-SOURCING-FORM-006 — 2026-09-17
 */

import { strict as assert } from 'node:assert';

import { isValidUrl, normalizeUrl, parseDecimalInput } from './form-inputs';

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

console.log('\n--- normalizeUrl ---');

test('champ vide reste vide', () => {
  assert.equal(normalizeUrl(''), '');
  assert.equal(normalizeUrl('   '), '');
});

test('adresse sans schéma est complétée en https', () => {
  assert.equal(
    normalizeUrl('zentrada.com/article/123'),
    'https://zentrada.com/article/123'
  );
  assert.equal(
    normalizeUrl('www.fournisseur.fr'),
    'https://www.fournisseur.fr'
  );
});

test('adresse déjà complète est laissée telle quelle', () => {
  assert.equal(normalizeUrl('https://x.fr/p'), 'https://x.fr/p');
  assert.equal(normalizeUrl('http://x.fr'), 'http://x.fr');
});

test('espaces autour sont ignorés', () => {
  assert.equal(normalizeUrl('  x.fr  '), 'https://x.fr');
});

console.log('\n--- isValidUrl ---');

test('accepte une adresse sans schéma (le cas qui bloquait la création)', () => {
  assert.equal(isValidUrl('zentrada.com/article/123'), true);
});

test('accepte une adresse complète', () => {
  assert.equal(isValidUrl('https://www.fournisseur.fr/produit?a=1'), true);
});

test('refuse un champ vide', () => {
  assert.equal(isValidUrl(''), false);
});

test('refuse un mot sans point', () => {
  assert.equal(isValidUrl('fournisseur'), false);
});

test('refuse un schéma non web', () => {
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('file:///etc/passwd'), false);
});

console.log('\n--- parseDecimalInput ---');

test('lit une virgule française', () => {
  assert.equal(parseDecimalInput('12,50'), 12.5);
});

test('lit un point anglais', () => {
  assert.equal(parseDecimalInput('12.50'), 12.5);
});

test('ignore les espaces, y compris insécables', () => {
  assert.equal(parseDecimalInput('1 234,5'), 1234.5);
  assert.equal(parseDecimalInput('1 234,5'), 1234.5);
});

test('lit un entier', () => {
  assert.equal(parseDecimalInput('250'), 250);
});

test('rend null sur une saisie vide ou inexploitable', () => {
  assert.equal(parseDecimalInput(''), null);
  assert.equal(parseDecimalInput('abc'), null);
  assert.equal(parseDecimalInput('12,,5'), null);
  assert.equal(parseDecimalInput('12€'), null);
});

test('accepte une saisie en cours de frappe', () => {
  assert.equal(parseDecimalInput('12,'), 12);
  assert.equal(parseDecimalInput(','), null);
});

console.log('\n══════════════════════════════════════');
console.log(
  `form-inputs.test — ${passed} ✅ / ${failed} ❌ (total: ${passed + failed})`
);
console.log('══════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
