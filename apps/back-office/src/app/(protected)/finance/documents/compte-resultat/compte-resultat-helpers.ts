import type { BankTransaction } from '@verone/finance';

type TransactionWithExtras = BankTransaction & {
  category_pcg?: string;
  ignore_reason?: string;
};

export const PCG_STRUCTURE = {
  produitsExploitation: [
    { code: '70', label: 'Ventes de produits/services' },
    { code: '74', label: 'Subventions' },
    { code: '75', label: 'Autres produits de gestion' },
  ],
  chargesExploitation: [
    { code: '60', label: 'Achats (marchandises, matieres)' },
    { code: '61', label: 'Services exterieurs' },
    { code: '62', label: 'Autres services exterieurs' },
    { code: '63', label: 'Impots et taxes' },
    { code: '64', label: 'Charges de personnel' },
    { code: '65', label: 'Autres charges de gestion' },
    { code: '68', label: 'Dotations aux amortissements' },
  ],
  produitsFinanciers: [{ code: '76', label: 'Produits financiers' }],
  chargesFinancieres: [{ code: '66', label: 'Charges financieres' }],
  produitsExceptionnels: [{ code: '77', label: 'Produits exceptionnels' }],
  chargesExceptionnelles: [{ code: '67', label: 'Charges exceptionnelles' }],
  impots: [{ code: '69', label: 'Impot sur les benefices (IS)' }],
};

export const ALL_PRODUITS = [
  ...PCG_STRUCTURE.produitsExploitation,
  ...PCG_STRUCTURE.produitsFinanciers,
  ...PCG_STRUCTURE.produitsExceptionnels,
];

export const ALL_CHARGES = [
  ...PCG_STRUCTURE.chargesExploitation,
  ...PCG_STRUCTURE.chargesFinancieres,
  ...PCG_STRUCTURE.chargesExceptionnelles,
  ...PCG_STRUCTURE.impots,
];

export interface YearData {
  produitsClasses: Record<string, number>;
  chargesClasses: Record<string, number>;
}

export function computeForYear(
  year: string,
  creditTransactions: BankTransaction[],
  debitTransactions: BankTransaction[]
): YearData {
  const filterByYear = (txs: BankTransaction[]) =>
    year === 'all'
      ? txs
      : txs.filter(tx => {
          const date = tx.settled_at ?? tx.emitted_at;
          return date?.startsWith(year);
        });

  const credits = filterByYear(creditTransactions);
  const debits = filterByYear(debitTransactions);

  const produitsClasses: Record<string, number> = {};
  ALL_PRODUITS.forEach(p => (produitsClasses[p.code] = 0));
  credits.forEach(tx => {
    const pcgCode = tx.category_pcg;
    if (pcgCode) {
      const classCode = pcgCode.substring(0, 2);
      if (produitsClasses[classCode] !== undefined)
        produitsClasses[classCode] += Math.abs(tx.amount);
    }
  });

  const chargesClasses: Record<string, number> = {};
  ALL_CHARGES.forEach(c => (chargesClasses[c.code] = 0));
  (debits as TransactionWithExtras[]).forEach(tx => {
    const pcgCode =
      tx.category_pcg || tx.ignore_reason?.match(/PCG (\d+)/)?.[1];
    if (pcgCode) {
      const classCode = pcgCode.substring(0, 2);
      if (chargesClasses[classCode] !== undefined)
        chargesClasses[classCode] += Math.abs(tx.amount);
    }
  });

  return { produitsClasses, chargesClasses };
}

export function sumGroup(
  items: { code: string }[],
  data: YearData,
  type: 'produits' | 'charges'
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      ((type === 'produits'
        ? data.produitsClasses[item.code]
        : data.chargesClasses[item.code]) ?? 0),
    0
  );
}

export interface CompteResultatTotals {
  prodExplN: number;
  prodExplN1: number;
  charExplN: number;
  charExplN1: number;
  resExplN: number;
  resExplN1: number;
  prodFinN: number;
  prodFinN1: number;
  charFinN: number;
  charFinN1: number;
  resFinN: number;
  resFinN1: number;
  resCourantN: number;
  resCourantN1: number;
  prodExcN: number;
  prodExcN1: number;
  charExcN: number;
  charExcN1: number;
  resExcN: number;
  resExcN1: number;
  isN: number;
  isN1: number;
  resultatN: number;
  resultatN1: number;
}

export function computeTotals(
  dataN: YearData,
  dataN1: YearData
): CompteResultatTotals {
  const pcg = PCG_STRUCTURE;
  const prodExplN = sumGroup(pcg.produitsExploitation, dataN, 'produits');
  const prodExplN1 = sumGroup(pcg.produitsExploitation, dataN1, 'produits');
  const charExplN = sumGroup(pcg.chargesExploitation, dataN, 'charges');
  const charExplN1 = sumGroup(pcg.chargesExploitation, dataN1, 'charges');
  const resExplN = prodExplN - charExplN;
  const resExplN1 = prodExplN1 - charExplN1;

  const prodFinN = sumGroup(pcg.produitsFinanciers, dataN, 'produits');
  const prodFinN1 = sumGroup(pcg.produitsFinanciers, dataN1, 'produits');
  const charFinN = sumGroup(pcg.chargesFinancieres, dataN, 'charges');
  const charFinN1 = sumGroup(pcg.chargesFinancieres, dataN1, 'charges');
  const resFinN = prodFinN - charFinN;
  const resFinN1 = prodFinN1 - charFinN1;

  const resCourantN = resExplN + resFinN;
  const resCourantN1 = resExplN1 + resFinN1;

  const prodExcN = sumGroup(pcg.produitsExceptionnels, dataN, 'produits');
  const prodExcN1 = sumGroup(pcg.produitsExceptionnels, dataN1, 'produits');
  const charExcN = sumGroup(pcg.chargesExceptionnelles, dataN, 'charges');
  const charExcN1 = sumGroup(pcg.chargesExceptionnelles, dataN1, 'charges');
  const resExcN = prodExcN - charExcN;
  const resExcN1 = prodExcN1 - charExcN1;

  const isN = sumGroup(pcg.impots, dataN, 'charges');
  const isN1 = sumGroup(pcg.impots, dataN1, 'charges');

  const resultatN = resCourantN + resExcN - isN;
  const resultatN1 = resCourantN1 + resExcN1 - isN1;

  return {
    prodExplN,
    prodExplN1,
    charExplN,
    charExplN1,
    resExplN,
    resExplN1,
    prodFinN,
    prodFinN1,
    charFinN,
    charFinN1,
    resFinN,
    resFinN1,
    resCourantN,
    resCourantN1,
    prodExcN,
    prodExcN1,
    charExcN,
    charExcN1,
    resExcN,
    resExcN1,
    isN,
    isN1,
    resultatN,
    resultatN1,
  };
}
