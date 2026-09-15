/**
 * Tests unitaires — Calculs marge nette LinkMe (BO-PRODUCTS-PROFIT-001)
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
} from '../product-sales-margin';

const TOL = 0.005; // 0,5 centime de tolérance

function near(a: number | null, b: number, label: string): void {
  assert.ok(a != null, `${label}: expected number, got null`);
  assert.ok(
    Math.abs(a - b) < TOL,
    `${label}: expected ≈${b}, got ${a} (diff ${Math.abs(a - b).toFixed(4)})`
  );
}

// ---------- resolveCost ----------
{
  const c1 = resolveCost({ costNetAvg: 2.13, costPrice: 1.5 });
  assert.equal(c1.cost, 2.13, 'cost_net_avg prioritaire sur cost_price');
  assert.equal(c1.includesFees, true);
  assert.equal(c1.missing, false);

  const c2 = resolveCost({ costNetAvg: null, costPrice: 11 });
  assert.equal(c2.cost, 11, 'fallback sur cost_price');
  assert.equal(c2.includesFees, false);
  assert.equal(c2.missing, false);

  const c3 = resolveCost({ costNetAvg: null, costPrice: null });
  assert.equal(c3.cost, null, 'coût manquant');
  assert.equal(c3.missing, true);
}

// ---------- isValidLine ----------
{
  for (const s of [
    'validated',
    'partially_shipped',
    'shipped',
    'delivered',
    'closed',
  ]) {
    assert.ok(isValidLine({ status: s }), `${s} doit être valide`);
  }
  for (const s of ['draft', 'cancelled', 'pending', '']) {
    assert.ok(!isValidLine({ status: s }), `${s} doit être invalide`);
  }
}

// ---------- Canal manuel — Sac jute PM ----------
// 300 × 3,59 = 1 077, coût 2,13 → marge 438 €, 40,7 %
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
  assert.equal(
    line.affiliateCommission,
    0,
    'Pas de commission sur canal manuel'
  );
}

// ---------- LinkMe — base 18,50 / vente 21,77 / coût 11 ----------
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
}

// ---------- LinkMe sans prix verrouillés (fallback unitPriceHt) ----------
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

// ---------- Produit créé par l'affilié ----------
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
    },
    {
      costNetAvg: null,
      costPrice: null,
      createdByAffiliate: true,
      affiliateCommissionRate: 15,
    },
    cost
  );
  near(line.veroneCommission, 150.921, 'Commission Vérone produit affilié');
  assert.equal(line.marginTotal, null, 'Pas de marge pour produit affilié');
  assert.equal(line.marginUnit, null);
}

// ---------- Coût manquant → marge null ----------
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
}

// ---------- summarizeByChannel — statut invalide ignoré ----------
{
  const cost = resolveCost({ costNetAvg: 5, costPrice: null });
  const valid = computeSaleLine(
    {
      orderId: 'ov',
      orderNumber: 'SV-001',
      orderDate: null,
      channelId: 'ch-1',
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
    },
    {
      costNetAvg: 5,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );
  const cancelled = computeSaleLine(
    {
      orderId: 'oc',
      orderNumber: 'SC-001',
      orderDate: null,
      channelId: 'ch-1',
      channelCode: 'manuel',
      channelName: 'Manuel',
      status: 'cancelled',
      quantity: 5,
      unitPriceHt: 20,
      totalHt: 100,
      basePriceLocked: null,
      sellingPriceLocked: null,
      retrocessionAmount: null,
      affiliateId: null,
      affiliateName: null,
    },
    {
      costNetAvg: 5,
      costPrice: null,
      createdByAffiliate: false,
      affiliateCommissionRate: null,
    },
    cost
  );

  const summary = summarizeByChannel([valid, cancelled]);
  assert.equal(summary.length, 1, 'Ligne annulée exclue');
  assert.equal(summary[0]?.quantity, 10, 'Seulement la ligne valide');
}

// ---------- summarizeLinkMe — comptage affiliés ----------
{
  const cost = resolveCost({ costNetAvg: 10, costPrice: null });
  const mkLine = (id: string, affId: string, status = 'shipped') =>
    computeSaleLine(
      {
        orderId: id,
        orderNumber: id,
        orderDate: null,
        channelId: LINKME_CHANNEL_ID,
        channelCode: 'linkme',
        channelName: 'LinkMe',
        status,
        quantity: 3,
        unitPriceHt: 25,
        totalHt: 75,
        basePriceLocked: 20,
        sellingPriceLocked: 25,
        retrocessionAmount: 15,
        affiliateId: affId,
        affiliateName: `Affilié ${affId}`,
      },
      {
        costNetAvg: 10,
        costPrice: null,
        createdByAffiliate: false,
        affiliateCommissionRate: null,
      },
      cost
    );

  const lm = summarizeLinkMe([mkLine('oA', 'aff-A'), mkLine('oB', 'aff-B')], {
    linkmePriceHt: 20,
    cost,
    offeringAffiliateCount: 5,
  });

  assert.equal(lm.sellingAffiliateCount, 2, '2 affiliés vendeurs');
  assert.equal(lm.offeringAffiliateCount, 5, '5 affiliés qui proposent');
  assert.equal(lm.quantity, 6, 'Total pièces');
  near(lm.veroneRevenue, 120, 'Revenu Vérone');
  near(lm.marginTotal, 60, 'Marge totale (120 − 10×6)');
  near(lm.affiliateCommissionTotal, 30, 'Total commissions exclues');
}

console.log('product-sales-margin: OK');
