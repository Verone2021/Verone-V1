/**
 * Tests unitaires — gouvernance du prix de vente (BO-PRICING-GOV-001)
 *
 * Exécution: npx tsx packages/@verone/products/src/utils/__tests__/pricing-governance.test.ts
 *
 * Les cas chiffrés viennent de la base de production au 2026-09-17 : ils verrouillent
 * les anomalies constatées pendant l'audit (LinkMe plus cher que le site, prix de
 * repli à ×1,5, articles à 0 €), pour qu'aucune régression ne les ramène.
 */

import { strict as assert } from 'node:assert';

import {
  FALLBACK_COEFFICIENTS,
  LINKME_MIN_GAP_RATE,
  allocateShippingToLines,
  computeLineMargin,
  evaluateChannelGap,
  evaluateCoefficient,
  maxLinkmePrice,
  recommendedPrice,
  resolveCoefficient,
  roundMoney,
} from '../pricing-governance';
import { resolveCost } from '../product-sales-margin';

const TOL = 0.005;

function near(a: number | null, b: number, label: string): void {
  assert.ok(a != null, `${label}: attendu un nombre, reçu null`);
  assert.ok(
    Math.abs(a - b) < TOL,
    `${label}: attendu ≈${b}, reçu ${a} (écart ${Math.abs(a - b).toFixed(4)})`
  );
}

// ---------- resolveCost : la saisie manuelle passe devant ----------
{
  const manual = resolveCost({
    costNetAvg: 6.29,
    costPrice: 3.05,
    costNetManual: 7.5,
  });
  assert.equal(manual.cost, 7.5, 'le revient manuel est prioritaire');
  assert.equal(manual.origin, 'manual');
  assert.equal(manual.includesFees, true);

  const computed = resolveCost({ costNetAvg: 6.29, costPrice: 3.05 });
  assert.equal(computed.cost, 6.29, 'sinon la moyenne pondérée des achats');
  assert.equal(computed.origin, 'weighted_average');

  // Cas réel : SUS-0009, aucun achat reçu → seul le prix d'achat existe.
  const bare = resolveCost({ costNetAvg: null, costPrice: 29 });
  assert.equal(bare.cost, 29, 'repli sur le prix d’achat nu');
  assert.equal(bare.origin, 'purchase_price');
  assert.equal(
    bare.includesFees,
    false,
    'sans frais d’approche : la marge sera optimiste, il faut le dire'
  );

  const missing = resolveCost({ costNetAvg: null, costPrice: null });
  assert.equal(missing.cost, null);
  assert.equal(missing.origin, 'missing');
  assert.equal(missing.missing, true);

  // Un revient manuel à 0 ou négatif ne doit jamais être retenu (la base l'interdit
  // déjà, le calcul ne doit pas s'y fier non plus).
  assert.equal(
    resolveCost({ costNetAvg: 6.29, costPrice: 3.05, costNetManual: 0 }).origin,
    'weighted_average',
    'un revient manuel à 0 est ignoré'
  );
}

// ---------- resolveCoefficient : le plus précis l'emporte ----------
{
  const famille = { retailCoefficient: 2.5, wholesaleCoefficient: 1.7 };
  const categorie = { retailCoefficient: 2.3, wholesaleCoefficient: 1.6 };
  const sousCategorie = { retailCoefficient: 3.1, wholesaleCoefficient: 1.9 };

  // Les trois niveaux renseignés : la sous-catégorie gagne.
  const precis = resolveCoefficient('retail', {
    subcategory: sousCategorie,
    category: categorie,
    family: famille,
  });
  assert.equal(precis.value, 3.1);
  assert.equal(precis.source, 'subcategory');

  // Sous-catégorie vide : la catégorie prend la main.
  const parCategorie = resolveCoefficient('retail', {
    subcategory: { retailCoefficient: null, wholesaleCoefficient: null },
    category: categorie,
    family: famille,
  });
  assert.equal(parCategorie.value, 2.3);
  assert.equal(parCategorie.source, 'category');

  // Sous-catégorie et catégorie vides : la famille prend la main.
  const parFamille = resolveCoefficient('retail', {
    subcategory: null,
    category: { retailCoefficient: null, wholesaleCoefficient: null },
    family: famille,
  });
  assert.equal(parFamille.value, 2.5);
  assert.equal(parFamille.source, 'family');

  // Rien du tout : réglage général.
  const repli = resolveCoefficient('retail', null);
  assert.equal(repli.value, FALLBACK_COEFFICIENTS.retail);
  assert.equal(repli.source, 'fallback');

  // Les deux échelles se résolvent indépendamment : une sous-catégorie peut
  // préciser le prix de détail sans toucher au prix de gros.
  const detailSeul = {
    subcategory: { retailCoefficient: 3.1, wholesaleCoefficient: null },
    category: categorie,
    family: famille,
  };
  assert.equal(resolveCoefficient('retail', detailSeul).source, 'subcategory');
  assert.equal(
    resolveCoefficient('wholesale', detailSeul).source,
    'category',
    'le prix de gros descend d’un niveau tout seul'
  );
  assert.equal(resolveCoefficient('wholesale', detailSeul).value, 1.6);

  // Un coefficient à 0 est ignoré comme s'il était vide : il conseillerait un
  // prix de vente nul.
  assert.equal(
    resolveCoefficient('retail', {
      subcategory: { retailCoefficient: 0, wholesaleCoefficient: null },
      category: categorie,
    }).source,
    'category',
    'un coefficient à 0 ne bloque pas l’héritage'
  );
}

// ---------- recommendedPrice ----------
{
  // PLA-0001 Plateau bois 20×30 : revient 11,00 €, catégorie Objets décoratifs.
  near(
    recommendedPrice({ unitCostHt: 11, coefficient: 2.9 }),
    31.9,
    'prix détail conseillé'
  );
  near(
    recommendedPrice({ unitCostHt: 11, coefficient: 1.8 }),
    19.8,
    'prix de gros conseillé'
  );
  // L'éco-participation s'ajoute après le coefficient : elle est reversée, pas margée.
  near(
    recommendedPrice({ unitCostHt: 11, coefficient: 2.9, ecoTaxHt: 1.5 }),
    33.4,
    'éco-participation ajoutée après coup'
  );

  assert.equal(
    recommendedPrice({ unitCostHt: null, coefficient: 2.5 }),
    null,
    'aucun prix inventé sans prix de revient'
  );
  assert.equal(
    recommendedPrice({ unitCostHt: 0, coefficient: 2.5 }),
    null,
    'un revient à 0 ne produit pas un prix à 0'
  );
}

// ---------- evaluateCoefficient ----------
{
  // Cas réel : les 96 produits au prix de repli cost × 1,5.
  // PLA-0002 Plateau bois 30×40, revient 6,19 €, prix site 9,29 €.
  const repli = evaluateCoefficient({
    priceHt: 9.29,
    unitCostHt: 6.19,
    scale: 'retail',
    hierarchy: {
      category: { retailCoefficient: 2.9, wholesaleCoefficient: 1.8 },
    },
  });
  near(repli.actual, 1.5, 'coefficient réellement pratiqué');
  near(repli.recommendedPrice, 17.95, 'prix conseillé');
  assert.equal(repli.belowRecommended, true, 'sous le conseil');
  assert.ok(
    repli.gapPercent != null && repli.gapPercent < -40,
    'écart largement négatif'
  );
  assert.equal(repli.costMissing, false);

  // Cas réel : les 30 produits posés à cost × 2,5, catégorie Mobilier (conseil 2,3).
  // CHA-0002, revient 99,69 €, prix site 247,50 € → au-dessus du conseil.
  const auDessus = evaluateCoefficient({
    priceHt: 247.5,
    unitCostHt: 99.69,
    scale: 'retail',
    hierarchy: {
      category: { retailCoefficient: 2.3, wholesaleCoefficient: 1.6 },
    },
  });
  assert.equal(auDessus.belowRecommended, false, 'au-dessus du conseil');
  assert.ok(auDessus.gapPercent != null && auDessus.gapPercent > 0);

  // Prix de revient absent : aucun verdict, et surtout aucune marge inventée.
  const sansRevient = evaluateCoefficient({
    priceHt: 50,
    unitCostHt: null,
    scale: 'retail',
    hierarchy: null,
  });
  assert.equal(sansRevient.actual, null);
  assert.equal(sansRevient.recommendedPrice, null);
  assert.equal(sansRevient.costMissing, true);
  assert.equal(
    sansRevient.belowRecommended,
    false,
    'jamais d’alerte de marge sans prix de revient'
  );
}

// ---------- allocateShippingToLines ----------
{
  // Répartition simple au prorata du montant.
  const parts = allocateShippingToLines(
    [
      { unitPriceHt: 100, quantity: 1 },
      { unitPriceHt: 300, quantity: 1 },
    ],
    40
  );
  near(parts[0], 10, 'quote-part ligne 1');
  near(parts[1], 30, 'quote-part ligne 2');
  near(roundMoney(parts[0] + parts[1]), 40, 'somme = transport de départ');

  // Cas d'arrondi : 3 lignes égales, 10 € de port → 3,33 / 3,33 / 3,34.
  const trois = allocateShippingToLines(
    [
      { unitPriceHt: 10, quantity: 1 },
      { unitPriceHt: 10, quantity: 1 },
      { unitPriceHt: 10, quantity: 1 },
    ],
    10
  );
  near(
    roundMoney(trois[0] + trois[1] + trois[2]),
    10,
    'aucun centime perdu ni créé'
  );

  // Une ligne offerte n'absorbe pas de transport.
  const avecOffert = allocateShippingToLines(
    [
      { unitPriceHt: 0, quantity: 5 },
      { unitPriceHt: 50, quantity: 1 },
    ],
    20
  );
  near(avecOffert[0], 0, 'la ligne à 0 € ne porte pas de port');
  near(avecOffert[1], 20, 'tout le port va sur la ligne payante');

  // Toutes les lignes à 0 € (cas TAB-0003 / BAN-0001 sur LinkMe) : pas de base de
  // répartition, on n'impute rien plutôt que d'inventer une clé.
  const toutOffert = allocateShippingToLines(
    [
      { unitPriceHt: 0, quantity: 1 },
      { unitPriceHt: 0, quantity: 1 },
    ],
    15
  );
  assert.deepEqual(toutOffert, [0, 0], 'aucune répartition arbitraire');

  assert.deepEqual(allocateShippingToLines([], 10), [], 'commande vide');
  assert.deepEqual(
    allocateShippingToLines([{ unitPriceHt: 10, quantity: 1 }], 0),
    [0],
    'pas de transport à répartir'
  );
}

// ---------- computeLineMargin ----------
{
  // Cas réel SAC-0003 « Sac jute PM » : 300 × 3,59 € HT, revient 2,13 €.
  const sansPort = computeLineMargin({
    unitPriceHt: 3.59,
    quantity: 300,
    unitCostHt: 2.13,
  });
  near(sansPort.revenueHt, 1077, 'chiffre d’affaires');
  near(sansPort.costHt, 639, 'coût total');
  near(sansPort.marginHt, 438, 'marge sans transport');
  near(sansPort.marginPercent, 40.67, 'taux de marque');
  near(sansPort.coefficient, 1.69, 'coefficient obtenu');

  // Même ligne, 50 € de transport de livraison imputés : la marge baisse d'autant.
  const avecPort = computeLineMargin({
    unitPriceHt: 3.59,
    quantity: 300,
    unitCostHt: 2.13,
    allocatedShippingHt: 50,
  });
  near(
    avecPort.marginHt,
    388,
    'le transport de livraison se déduit de la marge'
  );
  assert.ok(
    avecPort.marginPercent != null &&
      sansPort.marginPercent != null &&
      avecPort.marginPercent < sansPort.marginPercent,
    'le taux baisse aussi'
  );

  // Sans prix de revient : pas de marge, surtout pas une marge égale au CA.
  const sansCout = computeLineMargin({
    unitPriceHt: 20,
    quantity: 3,
    unitCostHt: null,
  });
  near(sansCout.revenueHt, 60, 'le CA reste calculable');
  assert.equal(sansCout.marginHt, null, 'aucune marge inventée');
  assert.equal(sansCout.marginPercent, null);
  assert.equal(sansCout.coefficient, null);
}

// ---------- evaluateChannelGap ----------
{
  assert.equal(LINKME_MIN_GAP_RATE, 0.05, 'le plancher dur est bien de 5 %');
  near(maxLinkmePrice(100), 95, 'plafond LinkMe');

  const hierarchie = {
    category: { retailCoefficient: 2.9, wholesaleCoefficient: 1.8 },
  };

  // Anomalie réelle : COU-0005, site 4,58 € et LinkMe 20,90 €.
  const inverse = evaluateChannelGap({
    sitePriceHt: 4.58,
    linkmePriceHt: 20.9,
    hierarchy: hierarchie,
  });
  assert.equal(inverse.violatesHardFloor, true, 'LinkMe plus cher que le site');
  assert.ok(inverse.gapPercent != null && inverse.gapPercent < 0);
  near(inverse.maxLinkmePriceHt, 4.35, 'prix LinkMe maximum autorisé');

  // Anomalie réelle : VAS-0008, site 6,75 € et LinkMe 6,84 € (1,3 % d'écart inversé).
  assert.equal(
    evaluateChannelGap({
      sitePriceHt: 6.75,
      linkmePriceHt: 6.84,
      hierarchy: hierarchie,
    }).violatesHardFloor,
    true,
    'un écart inversé de 1 % est refusé'
  );

  // Pile sur le plafond : 95 € pour un site à 100 € → accepté (refus au-delà).
  const pile = evaluateChannelGap({
    sitePriceHt: 100,
    linkmePriceHt: 95,
    hierarchy: hierarchie,
  });
  assert.equal(pile.violatesHardFloor, false, '5 % pile passe');
  assert.equal(
    evaluateChannelGap({
      sitePriceHt: 100,
      linkmePriceHt: 95.01,
      hierarchy: hierarchie,
    }).violatesHardFloor,
    true,
    'un centime au-dessus est refusé'
  );

  // Conforme aux 5 % mais sous la cible conseillée (38 % pour Objets décoratifs).
  assert.equal(pile.belowRecommendedGap, true, 'signalé, pas bloqué');
  near(pile.recommendedGapPercent, 37.93, 'écart conseillé de la catégorie');

  // Écart conforme à la cible : revient 11 €, site 31,90 €, LinkMe 19,80 €.
  const conforme = evaluateChannelGap({
    sitePriceHt: 31.9,
    linkmePriceHt: 19.8,
    hierarchy: hierarchie,
  });
  assert.equal(conforme.violatesHardFloor, false);
  assert.equal(conforme.belowRecommendedGap, false, 'cible atteinte');
  near(conforme.gapPercent, 37.93, 'écart réel');

  // Un des deux prix manque : on ne compare pas, et on n'accuse personne.
  const incomparable = evaluateChannelGap({
    sitePriceHt: null,
    linkmePriceHt: 19.8,
    hierarchy: hierarchie,
  });
  assert.equal(incomparable.notComparable, true);
  assert.equal(incomparable.violatesHardFloor, false);
  assert.equal(incomparable.belowRecommendedGap, false);
}

console.log('pricing-governance: OK (BO-PRICING-GOV-001)');
