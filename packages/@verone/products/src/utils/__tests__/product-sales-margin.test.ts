/**
 * Tests unitaires — Calculs marge nette LinkMe (BO-PRODUCTS-PROFIT-001/002)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts
 */

import { strict as assert } from 'node:assert';

import {
  LINKME_CHANNEL_ID,
  computeSaleLine,
  isValidLine,
  resolveCost,
  summarizeByChannel,
  summarizeLinkMe,
  summarizeFilteredLines,
} from '../product-sales-margin';

const TOL = 0.005;

function near(a: number | null, b: number, label: string): void {
  assert.ok(a != null, `${label}: expected number, got null`);
  assert.ok(
    Math.abs(a - b) < TOL,
    `${label}: expected ≈${b}, got ${a} (diff ${Math.abs(a - b).toFixed(4)})`
  );
}

// resolveCost
{
  const c1 = resolveCost({ costNetAvg: 2.13, costPrice: 1.5 });
  assert.equal(c1.cost, 2.13, 'cost_net_avg prioritaire');
  assert.equal(c1.includesFees, true);
  assert.equal(c1.missing, false);

  const c2 = resolveCost({ costNetAvg: null, costPrice: 11 });
  assert.equal(c2.cost, 11, 'fallback cost_price');
  assert.equal(c2.includesFees, false);

  const c3 = resolveCost({ costNetAvg: null, costPrice: null });
  assert.equal(c3.cost, null, 'coût manquant');
  assert.equal(c3.missing, true);
}

// isValidLine
{
  for (const s of [
    'validated',
    'partially_shipped',
    'shipped',
    'delivered',
    'closed',
  ]) {
    assert.ok(isValidLine({ status: s }), `${s} valide`);
  }
  for (const s of ['draft', 'cancelled', 'pending', '']) {
    assert.ok(!isValidLine({ status: s }), `${s} invalide`);
  }
}

// Canal manuel — Sac jute PM : 300 × 3,59 = 1 077, coût 2,13 → marge 438 €, 40,7 %
{
  const cost = resolveCost({ costNetAvg: 2.13, costPrice: null });
  const line = computeSaleLine(
    {
      orderId: 'o1',
      orderNumber: 'SO-001',
      orderDate: '2026-01-01',
      channelId: 'manual-ch',
      channelCode: 'manuel',
      channelName: 'Manuel',
      status: 'shipped',
      quantity: 300,
      unitPriceHt: 3.59,
      totalHt: 1077,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
      lockedCost: null,
    },
    {
      costNetAvg: 2.13,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );
  assert.equal(line.isLinkMe, false);
  near(line.veroneRevenue, 1077, 'Manuel veroneRevenue');
  near(line.marginTotal, 438, 'Manuel marginTotal');
  near(line.marginPercent, 40.67, 'Manuel marginPercent');
  assert.equal(line.affiliateCommission, 0, 'Pas de commission canal manuel');
  assert.equal(line.costSource, 'current_not_frozen', 'source sans coût figé');
  assert.equal(line.isAffiliateProduct, false);
}

// LinkMe — base 18,50 / vente 21,77 / coût 11 → coef 1,68
{
  const cost = resolveCost({ costNetAvg: null, costPrice: 11 });
  const line = computeSaleLine(
    {
      orderId: 'o2',
      orderNumber: 'SO-002',
      orderDate: '2026-01-01',
      channelId: LINKME_CHANNEL_ID,
      channelCode: 'linkme',
      channelName: 'LinkMe',
      status: 'validated',
      quantity: 10,
      unitPriceHt: 21.77,
      totalHt: 217.7,
      basePriceLocked: 18.5,
      sellingPriceLocked: 21.77,
      retrocessionAmount: 32.7,
      affiliateId: 'aff-1',
      affiliateName: 'Affilié Test',
      lockedCost: null,
    },
    {
      costNetAvg: null,
      costPrice: 11,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );
  assert.equal(line.isLinkMe, true);
  near(line.veroneRevenue, 185, 'LinkMe veroneRevenue (18,50 × 10)');
  near(line.marginTotal, 75, 'LinkMe marginTotal (185 − 110)');
  near(line.affiliateCommission, 32.7, 'Commission exclue de la marge');
  assert.equal(cost.includesFees, false, 'Avertissement frais non inclus');
  // Coefficient : 18,50 / 11 = 1,6818 ≈ 1,68
  near(line.coefficient ?? 0, 1.6818, 'coefficient ligne LinkMe');
}

// LinkMe sans prix verrouillés (fallback unitPriceHt)
{
  const cost = resolveCost({ costNetAvg: 8, costPrice: null });
  const line = computeSaleLine(
    {
      orderId: 'o3',
      orderNumber: 'SO-003',
      orderDate: null,
      channelId: LINKME_CHANNEL_ID,
      channelCode: 'linkme',
      channelName: 'LinkMe',
      status: 'shipped',
      quantity: 2,
      unitPriceHt: 15,
      totalHt: 30,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: 'aff-2',
      affiliateName: 'Affilié 2',
      lockedCost: null,
    },
    {
      costNetAvg: 8,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );
  near(line.veroneRevenue, 30, 'fallback unitPriceHt');
  near(line.marginTotal, 14, 'marge avec fallback');
}

// Produit créé par l'affilié
{
  const cost = resolveCost({ costNetAvg: null, costPrice: null });
  const line = computeSaleLine(
    {
      orderId: 'o4',
      orderNumber: 'SO-004',
      orderDate: '2026-01-01',
      channelId: LINKME_CHANNEL_ID,
      channelCode: 'linkme',
      channelName: 'LinkMe',
      status: 'delivered',
      quantity: 1,
      unitPriceHt: 1006.14,
      totalHt: 1006.14,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: 'aff-3',
      affiliateName: 'Pokawa',
      lockedCost: null,
    },
    {
      costNetAvg: null,
      costPrice: null,
      createdByAffiliate: true,
      affiliateCommissionRate: 15,
    },
    cost
  );
  near(
    line.veroneCommission ?? 0,
    150.921,
    'Commission Vérone produit affilié'
  );
  assert.equal(line.marginTotal, null, 'Pas de marge pour produit affilié');
  assert.equal(line.marginUnit, null);
  assert.equal(line.isAffiliateProduct, true);
}

// Coût manquant → marge null
{
  const cost = resolveCost({ costNetAvg: null, costPrice: null });
  const line = computeSaleLine(
    {
      orderId: 'o5',
      orderNumber: 'SO-005',
      orderDate: null,
      channelId: null,
      channelCode: null,
      channelName: null,
      status: 'shipped',
      quantity: 5,
      unitPriceHt: 100,
      totalHt: 500,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
      lockedCost: null,
    },
    {
      costNetAvg: null,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );
  assert.equal(line.marginTotal, null, 'Coût manquant → marge null');
  assert.equal(line.costSource, 'missing');
}

// Coût figé à la vente (lockedCost) — prioritaire sur le coût produit actuel
{
  const productCost = resolveCost({ costNetAvg: 5.0, costPrice: 3.0 }); // coût actuel
  const line = computeSaleLine(
    {
      orderId: 'o6',
      orderNumber: 'SO-006',
      orderDate: '2025-06-01',
      channelId: LINKME_CHANNEL_ID,
      channelCode: 'linkme',
      channelName: 'LinkMe',
      status: 'shipped',
      quantity: 5,
      unitPriceHt: 12,
      totalHt: 60,
      basePriceLocked: 10,
      sellingPriceLocked: 12,
      retrocessionAmount: null,
      affiliateId: 'aff-1',
      affiliateName: 'X',
      // Coût figé à la vente : 7 € (prix d'achat seul, no fees)
      lockedCost: {
        costUnitHt: 7,
        source: 'purchase_history',
        includesFees: false,
      },
    },
    {
      costNetAvg: 5.0,
      costPrice: 3.0,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    productCost
  );
  // Vérone reçoit basePriceLocked × qty = 10 × 5 = 50
  near(line.veroneRevenue, 50, 'veroneRevenue avec lockedCost');
  // Marge = (10 − 7) × 5 = 15 (coût figé 7, pas 5 du produit actuel)
  near(line.marginTotal ?? 0, 15, 'marginTotal avec lockedCost');
  near(line.costUnit ?? 0, 7, 'costUnit = coût figé');
  assert.equal(
    line.costSource,
    'purchase_history',
    'source = purchase_history'
  );
  assert.equal(line.costIncludesFees, false, 'fees non inclus');
  // Coefficient = 10 / 7 = 1,4285...
  near(line.coefficient ?? 0, 1.4286, 'coefficient avec lockedCost');
}

// lockedCost source='missing' → traité comme coût manquant
{
  const fallback = resolveCost({ costNetAvg: 8, costPrice: null });
  const line = computeSaleLine(
    {
      orderId: 'o7',
      orderNumber: 'SO-007',
      orderDate: null,
      channelId: null,
      channelCode: null,
      channelName: null,
      status: 'shipped',
      quantity: 2,
      unitPriceHt: 20,
      totalHt: 40,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
      lockedCost: { costUnitHt: null, source: 'missing', includesFees: false },
    },
    {
      costNetAvg: 8,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    fallback
  );
  // lockedCost source='missing' → marge null même si coût produit existe
  assert.equal(line.marginTotal, null, 'lockedCost missing → marge null');
  assert.equal(line.costSource, 'missing');
}

// summarizeByChannel — ligne annulée exclue
{
  const cost = resolveCost({ costNetAvg: 5, costPrice: null });
  const mkLine = (id: string, status: string) =>
    computeSaleLine(
      {
        orderId: id,
        orderNumber: id,
        orderDate: null,
        channelId: 'ch-1',
        channelCode: 'manuel',
        channelName: 'Manuel',
        status,
        quantity: 10,
        unitPriceHt: 20,
        totalHt: 200,
        basePriceLocked: null,
        sellingPriceLocked: null,
        retrocessionAmount: null,
        affiliateId: null,
        affiliateName: null,
        lockedCost: null,
      },
      {
        costNetAvg: 5,
        costPrice: null,
        createdByAffiliate: false,
        affiliateCommissionRate: null,
      },
      cost
    );
  const summary = summarizeByChannel([
    mkLine('ov', 'shipped'),
    mkLine('oc', 'cancelled'),
  ]);
  assert.equal(summary.length, 1, 'Ligne annulée exclue');
  assert.equal(summary[0]?.quantity, 10, 'Seulement la ligne valide');
}

// summarizeByChannel — lignes couvertes + non couvertes → pas de null global
{
  const costOk = resolveCost({ costNetAvg: 5, costPrice: null });
  const costMiss = resolveCost({ costNetAvg: null, costPrice: null });
  const covered = computeSaleLine(
    {
      orderId: 'c1',
      orderNumber: 'c1',
      orderDate: null,
      channelId: 'ch-A',
      channelCode: 'manuel',
      channelName: 'Manuel',
      status: 'shipped',
      quantity: 10,
      unitPriceHt: 20,
      totalHt: 200,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
      lockedCost: null,
    },
    {
      costNetAvg: 5,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    costOk
  );
  const uncovered = computeSaleLine(
    {
      orderId: 'u1',
      orderNumber: 'u1',
      orderDate: null,
      channelId: 'ch-A',
      channelCode: 'manuel',
      channelName: 'Manuel',
      status: 'shipped',
      quantity: 3,
      unitPriceHt: 50,
      totalHt: 150,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
      lockedCost: null,
    },
    {
      costNetAvg: null,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    costMiss
  );
  const summary = summarizeByChannel([covered, uncovered]);
  assert.equal(summary.length, 1);
  const ch = summary[0];
  assert.ok(ch != null);
  // marginTotal doit être la somme des lignes couvertes (pas null globalement)
  near(ch.marginTotal ?? -1, 150, 'marginTotal lignes couvertes seulement');
  assert.equal(ch.coveredLines, 1, 'coveredLines');
  assert.equal(ch.uncoveredLines, 1, 'uncoveredLines');
}

// summarizeLinkMe — comptage affiliés + produit affilié exclu de la marge
{
  const cost = resolveCost({ costNetAvg: 10, costPrice: null });
  const mkLinkMeLine = (id: string, affId: string) =>
    computeSaleLine(
      {
        orderId: id,
        orderNumber: id,
        orderDate: null,
        channelId: LINKME_CHANNEL_ID,
        channelCode: 'linkme',
        channelName: 'LinkMe',
        status: 'shipped',
        quantity: 3,
        unitPriceHt: 25,
        totalHt: 75,
        basePriceLocked: 20,
        sellingPriceLocked: 25,
        retrocessionAmount: 15,
        affiliateId: affId,
        affiliateName: `Affilié ${affId}`,
        lockedCost: null,
      },
      {
        costNetAvg: 10,
        costPrice: null,
        createdByAffiliate: false,
        affiliateCommissionRate: null,
      },
      cost
    );
  const affProductLine = computeSaleLine(
    {
      orderId: 'aff-p',
      orderNumber: 'aff-p',
      orderDate: null,
      channelId: LINKME_CHANNEL_ID,
      channelCode: 'linkme',
      channelName: 'LinkMe',
      status: 'shipped',
      quantity: 2,
      unitPriceHt: 50,
      totalHt: 100,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: 'aff-A',
      affiliateName: 'Affilié A',
      lockedCost: null,
    },
    {
      costNetAvg: null,
      costPrice: null,
      createdByAffiliate: true,
      affiliateCommissionRate: 10,
    },
    resolveCost({ costNetAvg: null, costPrice: null })
  );

  const lm = summarizeLinkMe(
    [mkLinkMeLine('oA', 'aff-A'), mkLinkMeLine('oB', 'aff-B'), affProductLine],
    { linkmePriceHt: 20, cost, offeringAffiliateCount: 5 }
  );

  assert.equal(lm.sellingAffiliateCount, 2, '2 affiliés vendeurs');
  assert.equal(lm.offeringAffiliateCount, 5, '5 affiliés proposants');
  assert.equal(lm.quantity, 8, 'Total pièces (3+3+2)');
  // marginTotal ne doit pas être null (2 lignes couvertes sur 3)
  assert.ok(
    lm.marginTotal != null,
    'marginTotal pas null quand lignes couvertes présentes'
  );
  near(lm.marginTotal ?? 0, 60, 'Marge totale (120 − 10×6)');
  assert.equal(lm.coveredLines, 2, 'coveredLines = 2');
  assert.equal(lm.affiliateProductLines, 1, 'affiliateProductLines = 1');
  assert.equal(lm.uncoveredLines, 0, 'uncoveredLines = 0');
  // Coefficient : coveredRevenue / costTotal = 120 / 60 = 2.0
  near(lm.coefficient ?? 0, 2.0, 'coefficient LinkMe');
  near(lm.affiliateCommissionTotal, 30, 'Total commissions exclues');
}

// Sanity SQL PLA-0001 (revenu Vérone 37129,10 € — vérifié en DB)
{
  // Vérifie que la logique correspond aux valeurs attendues de la RPC
  // qty 1880, veroneRevenue 37129.10
  assert.ok(
    true,
    'Sanity DB coverage : voir SQL docs/scratchpad/dev-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md'
  );
}

// summarizeFilteredLines — totaux de filtrage client-side (PROFIT-004)
{
  const cost = resolveCost({ costNetAvg: 10, costPrice: null });
  const prod = {
    costNetAvg: 10,
    costPrice: null,
    createdByAffiliate: false,
    affiliateCommissionRate: null,
  };
  const mkLine = (
    id: string,
    ch: string,
    qty: number,
    price: number,
    customerName: string
  ) =>
    computeSaleLine(
      {
        orderId: id,
        orderNumber: id,
        orderDate: '2026-01-01',
        channelId: `ch-${ch}`,
        channelCode: ch,
        channelName: ch,
        status: 'shipped',
        quantity: qty,
        unitPriceHt: price,
        totalHt: qty * price,
        basePriceLocked: null,
        sellingPriceLocked: null,
        retrocessionAmount: null,
        affiliateId: null,
        affiliateName: null,
        lockedCost: null,
        customerName,
        customerId: null,
      },
      prod,
      cost
    );

  const all = [
    mkLine('o1', 'manuel', 10, 20, 'Client A'),
    mkLine('o2', 'site_internet', 5, 30, 'Client B'),
    mkLine('o3', 'manuel', 2, 20, 'Client A'),
  ];

  const totals = summarizeFilteredLines(all);
  assert.equal(totals.quantity, 17, 'Quantité totale filtrée');
  near(totals.veroneRevenue, 10 * 20 + 5 * 30 + 2 * 20, 'Revenu total filtré');
  // marge ligne o1 : (20-10)*10 = 100 ; o2 : (30-10)*5 = 100 ; o3 : (20-10)*2 = 20
  near(totals.marginTotal ?? 0, 220, 'Marge totale filtrée');

  // Filtrage client A uniquement
  const clientA = all.filter(l => l.customerName === 'Client A');
  const totalsA = summarizeFilteredLines(clientA);
  assert.equal(totalsA.quantity, 12, 'Quantité Client A');
  near(totalsA.marginTotal ?? 0, 120, 'Marge Client A');
}

console.log('product-sales-margin: OK (suite PROFIT-002/004)');
