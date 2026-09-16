/**
 * Tests unitaires — Règle de complétude sourcing (BO-SOURCING-COMPLETUDE-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/sourcing-completeness.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  blockingMessage,
  blockingRequirements,
  canPassGate,
  missingFieldKeys,
  missingRequirements,
  requirementsFor,
  requirementsFromKeys,
  type SourcingCompletenessProduct,
} from '../sourcing-completeness';

// ---------------------------------------------------------------------------
// Périmètre de chaque porte
// ---------------------------------------------------------------------------

assert.deepEqual(
  requirementsFor('sample').map(r => r.key),
  ['supplier_id', 'cost_price']
);
assert.deepEqual(
  requirementsFor('catalogue').map(r => r.key),
  [
    'supplier_id',
    'cost_price',
    'subcategory_id',
    'images',
    'supplier_reference',
    'weight',
  ]
);
// Le poids est le seul champ conseillé, et il n'est jamais bloquant.
assert.deepEqual(
  requirementsFor('catalogue')
    .filter(r => !r.blocking)
    .map(r => r.key),
  ['weight']
);

// ---------------------------------------------------------------------------
// Produit vide : tout manque
// ---------------------------------------------------------------------------

const vide: SourcingCompletenessProduct = {};

assert.deepEqual(missingFieldKeys(vide, 'sample'), [
  'cost_price',
  'supplier_id',
]);
assert.deepEqual(missingFieldKeys(vide, 'catalogue'), [
  'cost_price',
  'images',
  'subcategory_id',
  'supplier_id',
  'supplier_reference',
]);
assert.equal(canPassGate(vide, 'sample'), false);
assert.equal(canPassGate(vide, 'catalogue'), false);
// Le poids apparaît dans la checklist mais jamais dans les clés bloquantes.
assert.ok(missingRequirements(vide, 'catalogue').some(r => r.key === 'weight'));
assert.ok(!missingFieldKeys(vide, 'catalogue').includes('weight'));

// ---------------------------------------------------------------------------
// Les 6 produits réellement en sourcing au 2026-09-16 (relevé en base)
// ---------------------------------------------------------------------------

const reels: Array<[string, SourcingCompletenessProduct]> = [
  ['PRD-0313', { product_images: [{}] }],
  [
    'SRC-MNZ71MS9',
    { supplier_id: 'f-1', cost_price: 2.75, product_images: [{}] },
  ],
  [
    'SRC-MPN3RXB5',
    { supplier_id: 'f-2', cost_price: 7.47, product_images: [{}] },
  ],
  [
    'SRC-MU2O45CK',
    { supplier_id: 'f-3', cost_price: 0.99, product_images: [{}] },
  ],
  ['SRC-MU2QFJ2R', { product_images: [{}] }],
  ['SRC-MU2QM3SE', { cost_price: 1, product_images: [{}] }],
];

/**
 * PARITÉ ÉCRAN ↔ BASE.
 *
 * Sortie de `sourcing_missing_fields` relevée en production le 2026-09-16 sur
 * les 6 produits en sourcing. La règle TypeScript doit renvoyer exactement les
 * mêmes clés, sinon un bouton serait actif à l'écran et refusé par la base
 * (ou l'inverse).
 */
const attenduBase: Record<string, { sample: string[]; catalogue: string[] }> = {
  'PRD-0313': {
    sample: ['cost_price', 'supplier_id'],
    catalogue: [
      'cost_price',
      'subcategory_id',
      'supplier_id',
      'supplier_reference',
    ],
  },
  'SRC-MNZ71MS9': {
    sample: [],
    catalogue: ['subcategory_id', 'supplier_reference'],
  },
  'SRC-MPN3RXB5': {
    sample: [],
    catalogue: ['subcategory_id', 'supplier_reference'],
  },
  'SRC-MU2O45CK': {
    sample: [],
    catalogue: ['subcategory_id', 'supplier_reference'],
  },
  'SRC-MU2QFJ2R': {
    sample: ['cost_price', 'supplier_id'],
    catalogue: [
      'cost_price',
      'subcategory_id',
      'supplier_id',
      'supplier_reference',
    ],
  },
  'SRC-MU2QM3SE': {
    sample: ['supplier_id'],
    catalogue: ['subcategory_id', 'supplier_id', 'supplier_reference'],
  },
};

for (const [sku, produit] of reels) {
  assert.deepEqual(
    missingFieldKeys(produit, 'sample'),
    attenduBase[sku].sample,
    `parité échantillon ${sku}`
  );
  assert.deepEqual(
    missingFieldKeys(produit, 'catalogue'),
    attenduBase[sku].catalogue,
    `parité catalogue ${sku}`
  );
}

// Seuls 3 des 6 produits peuvent commander un échantillon aujourd'hui,
// et aucun ne peut être validé au catalogue.
assert.deepEqual(
  reels.filter(([, p]) => canPassGate(p, 'sample')).map(([sku]) => sku),
  ['SRC-MNZ71MS9', 'SRC-MPN3RXB5', 'SRC-MU2O45CK']
);
assert.deepEqual(
  reels.filter(([, p]) => canPassGate(p, 'catalogue')).map(([sku]) => sku),
  []
);

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------

// Prix d'achat à 0 ou négatif = prix absent
assert.deepEqual(
  missingFieldKeys({ supplier_id: 'f', cost_price: 0 }, 'sample'),
  ['cost_price']
);
assert.deepEqual(
  missingFieldKeys({ supplier_id: 'f', cost_price: -1 }, 'sample'),
  ['cost_price']
);
// Chaîne d'espaces = champ absent
assert.deepEqual(
  missingFieldKeys(
    {
      supplier_id: 'f',
      cost_price: 10,
      subcategory_id: 'sc',
      supplier_reference: '   ',
      product_images: [{}],
    },
    'catalogue'
  ),
  ['supplier_reference']
);
// Repli sur has_images quand la jointure d'images n'est pas chargée
assert.equal(
  missingFieldKeys(
    {
      supplier_id: 'f',
      cost_price: 10,
      subcategory_id: 'sc',
      supplier_reference: 'REF-1',
      has_images: true,
    },
    'catalogue'
  ).length,
  0
);
assert.deepEqual(
  missingFieldKeys(
    {
      supplier_id: 'f',
      cost_price: 10,
      subcategory_id: 'sc',
      supplier_reference: 'REF-1',
      has_images: false,
    },
    'catalogue'
  ),
  ['images']
);
// Liste d'images vide = pas d'image, même si has_images dit le contraire
assert.deepEqual(
  missingFieldKeys(
    {
      supplier_id: 'f',
      cost_price: 10,
      subcategory_id: 'sc',
      supplier_reference: 'REF-1',
      product_images: [],
      has_images: true,
    },
    'catalogue'
  ),
  ['images']
);

// Produit complet : les deux portes passent, seul le poids reste conseillé
const complet: SourcingCompletenessProduct = {
  supplier_id: 'f',
  cost_price: 12.5,
  subcategory_id: 'sc',
  supplier_reference: 'REF-1',
  product_images: [{}],
};
assert.equal(canPassGate(complet, 'sample'), true);
assert.equal(canPassGate(complet, 'catalogue'), true);
assert.deepEqual(blockingRequirements(complet, 'catalogue'), []);
assert.deepEqual(
  missingRequirements(complet, 'catalogue').map(r => r.key),
  ['weight']
);

// ---------------------------------------------------------------------------
// Messages et traduction des clés renvoyées par la base
// ---------------------------------------------------------------------------

assert.equal(blockingMessage(complet, 'catalogue'), null);
assert.equal(
  blockingMessage(vide, 'sample'),
  "À renseigner avant : fournisseur et prix d'achat."
);
assert.equal(
  blockingMessage({ supplier_id: 'f' }, 'sample'),
  "À renseigner avant : prix d'achat."
);

// Les clés de la base redeviennent des libellés lisibles
assert.deepEqual(
  requirementsFromKeys(['subcategory_id', 'images']).map(r => r.label),
  ['Sous-catégorie', 'Au moins une photo']
);
// Une clé inconnue est ignorée, jamais affichée brute
assert.deepEqual(requirementsFromKeys(['champ_inconnu']), []);

console.log('sourcing-completeness: OK');
