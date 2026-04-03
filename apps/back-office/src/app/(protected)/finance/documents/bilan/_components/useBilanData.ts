import { useMemo } from 'react';

import { type BankTransaction } from '@verone/finance';

// =====================================================================
// TYPES
// =====================================================================

export interface BilanLine {
  label: string;
  brut: number;
  amortissement: number;
  net: number;
  netN1: number;
  isBold?: boolean;
  isTotal?: boolean;
  indent?: boolean;
}

type TransactionWithPcg = BankTransaction & {
  category_pcg?: string;
  vat_rate?: number;
};

interface BilanYearData {
  immoIncorporelles: number;
  immoCorporelles: number;
  immoFinancieres: number;
  stocks: number;
  fournisseursDebiteurs: number;
  creances: number;
  associesApport: number;
  disponibilites: number;
  chargesConstatees: number;
  capital: number;
  primes: number;
  reserves: number;
  reportNouveau: number;
  resultat: number;
  dettesFinancieres: number;
  clientsCrediteurs: number;
  dettesFournisseurs: number;
  dettesExploitation: number;
  produitsConstates: number;
}

export interface BilanData {
  yearN: string;
  yearN1: string;
  actifLines: BilanLine[];
  actifCirculantLines: BilanLine[];
  totalActifImmo: number;
  totalActifImmoN1: number;
  totalActifCirculant: number;
  totalActifCirculantN1: number;
  totalActif: number;
  totalActifN1: number;
  passifLines: BilanLine[];
  totalCapitauxPropres: number;
  totalCapitauxPropresN1: number;
  dettesLines: BilanLine[];
  totalDettes: number;
  totalDettesN1: number;
  produitsConstates: number;
  produitsConstatesN1: number;
  totalPassif: number;
  totalPassifN1: number;
}

// =====================================================================
// HOOK
// =====================================================================

function filterByYear(txs: BankTransaction[], year: string): BankTransaction[] {
  return year === 'all'
    ? txs
    : txs.filter(tx => {
        const date = tx.settled_at ?? tx.emitted_at;
        return date?.startsWith(year);
      });
}

function computeForYear(
  creditTransactions: BankTransaction[],
  debitTransactions: BankTransaction[],
  year: string
): BilanYearData {
  const credits = filterByYear(creditTransactions, year);
  const debits = filterByYear(debitTransactions, year);

  const pcgTotals = new Map<string, number>();
  const processTx = (tx: BankTransaction, isCredit: boolean) => {
    const pcgCode = (tx as TransactionWithPcg).category_pcg;
    if (!pcgCode) return;
    const classCode = pcgCode.substring(0, 1);
    const amount = Math.abs(tx.amount);
    const current = pcgTotals.get(classCode) ?? 0;
    pcgTotals.set(classCode, current + (isCredit ? amount : -amount));
  };
  credits.forEach(tx => processTx(tx, true));
  debits.forEach(tx => processTx(tx, false));

  const totalCredits = credits.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0
  );
  const totalDebits = debits.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const soldeBancaire = totalCredits - totalDebits;
  const resultat = totalCredits - totalDebits;

  const tvaCollectee = credits.reduce((sum, tx) => {
    const vatRate = (tx as TransactionWithPcg).vat_rate ?? 0;
    const ttc = Math.abs(tx.amount);
    return sum + (ttc - ttc / (1 + vatRate / 100));
  }, 0);
  const tvaDeductible = debits.reduce((sum, tx) => {
    const vatRate = (tx as TransactionWithPcg).vat_rate ?? 0;
    const ttc = Math.abs(tx.amount);
    return sum + (ttc - ttc / (1 + vatRate / 100));
  }, 0);
  const tvaEstimee = tvaCollectee - tvaDeductible;

  const immo = pcgTotals.get('2') ?? 0;
  const stocks = pcgTotals.get('3') ?? 0;
  const creances = pcgTotals.get('4') ?? 0;

  return {
    immoIncorporelles: 0,
    immoCorporelles: Math.abs(immo),
    immoFinancieres: 0,
    stocks: Math.abs(stocks),
    fournisseursDebiteurs: 0,
    creances: creances > 0 ? creances : 0,
    associesApport: 0,
    disponibilites: Math.max(0, soldeBancaire),
    chargesConstatees: 0,
    capital: 0,
    primes: 0,
    reserves: 0,
    reportNouveau: 0,
    resultat,
    dettesFinancieres: 0,
    clientsCrediteurs: 0,
    dettesFournisseurs: creances < 0 ? Math.abs(creances) : 0,
    dettesExploitation: tvaEstimee > 0 ? tvaEstimee : 0,
    produitsConstates: 0,
  };
}

export interface BilanExternalData {
  stockValue?: number;
  fixedAssetsBrut?: number;
  fixedAssetsAmort?: number;
}

export function useBilanData(
  creditTransactions: BankTransaction[],
  debitTransactions: BankTransaction[],
  selectedYear: string,
  currentYear: number,
  externalData?: BilanExternalData
): BilanData {
  return useMemo(() => {
    const yearN = selectedYear === 'all' ? String(currentYear) : selectedYear;
    const yearN1 = String(Number(yearN) - 1);
    const dataN = computeForYear(creditTransactions, debitTransactions, yearN);
    const dataN1 = computeForYear(
      creditTransactions,
      debitTransactions,
      yearN1
    );

    // Integrate external data (stock + fixed assets) for current year
    const stockVal = externalData?.stockValue ?? 0;
    const faBrut = externalData?.fixedAssetsBrut ?? 0;
    const faAmort = externalData?.fixedAssetsAmort ?? 0;
    const faNet = faBrut - faAmort;

    // Override stocks with real product inventory value
    if (stockVal > 0) {
      dataN.stocks = stockVal;
    }

    // Override immobilisations with fixed_assets data
    if (faBrut > 0) {
      dataN.immoCorporelles = faBrut;
    }

    const actifLines: BilanLine[] = [
      {
        label: 'Actif immobilise',
        brut: 0,
        amortissement: 0,
        net: 0,
        netN1: 0,
        isBold: true,
      },
      {
        label: 'Immobilisations incorporelles',
        brut: dataN.immoIncorporelles,
        amortissement: 0,
        net: dataN.immoIncorporelles,
        netN1: dataN1.immoIncorporelles,
        indent: true,
      },
      {
        label: 'Immobilisations corporelles',
        brut: faBrut > 0 ? faBrut : dataN.immoCorporelles,
        amortissement: faAmort,
        net: faBrut > 0 ? faNet : dataN.immoCorporelles,
        netN1: dataN1.immoCorporelles,
        indent: true,
      },
      {
        label: 'Immobilisations financieres',
        brut: dataN.immoFinancieres,
        amortissement: 0,
        net: dataN.immoFinancieres,
        netN1: dataN1.immoFinancieres,
        indent: true,
      },
    ];

    const totalActifImmo =
      faBrut > 0
        ? dataN.immoIncorporelles + faNet + dataN.immoFinancieres
        : dataN.immoIncorporelles +
          dataN.immoCorporelles +
          dataN.immoFinancieres;
    const totalActifImmoN1 =
      dataN1.immoIncorporelles +
      dataN1.immoCorporelles +
      dataN1.immoFinancieres;

    const actifCirculantLines: BilanLine[] = [
      {
        label: 'Actif circulant',
        brut: 0,
        amortissement: 0,
        net: 0,
        netN1: 0,
        isBold: true,
      },
      {
        label: 'Stocks et en-cours',
        brut: dataN.stocks,
        amortissement: 0,
        net: dataN.stocks,
        netN1: dataN1.stocks,
        indent: true,
      },
      {
        label: 'Fournisseurs debiteurs',
        brut: dataN.fournisseursDebiteurs,
        amortissement: 0,
        net: dataN.fournisseursDebiteurs,
        netN1: dataN1.fournisseursDebiteurs,
        indent: true,
      },
      {
        label: 'Creances',
        brut: dataN.creances,
        amortissement: 0,
        net: dataN.creances,
        netN1: dataN1.creances,
        indent: true,
      },
      {
        label: "Associes - Comptes d'apport en societe",
        brut: dataN.associesApport,
        amortissement: 0,
        net: dataN.associesApport,
        netN1: dataN1.associesApport,
        indent: true,
      },
      {
        label: 'Disponibilites',
        brut: dataN.disponibilites,
        amortissement: 0,
        net: dataN.disponibilites,
        netN1: dataN1.disponibilites,
        indent: true,
      },
      {
        label: "Charges constatees d'avance",
        brut: dataN.chargesConstatees,
        amortissement: 0,
        net: dataN.chargesConstatees,
        netN1: dataN1.chargesConstatees,
        indent: true,
      },
    ];

    const totalActifCirculant =
      dataN.stocks +
      dataN.fournisseursDebiteurs +
      dataN.creances +
      dataN.associesApport +
      dataN.disponibilites +
      dataN.chargesConstatees;
    const totalActifCirculantN1 =
      dataN1.stocks +
      dataN1.fournisseursDebiteurs +
      dataN1.creances +
      dataN1.associesApport +
      dataN1.disponibilites +
      dataN1.chargesConstatees;

    const totalActif = totalActifImmo + totalActifCirculant;
    const totalActifN1 = totalActifImmoN1 + totalActifCirculantN1;

    const pLine = (label: string, net: number, netN1: number): BilanLine => ({
      label,
      brut: 0,
      amortissement: 0,
      net,
      netN1,
      indent: true,
    });

    const passifLines: BilanLine[] = [
      pLine('Capital', dataN.capital, dataN1.capital),
      pLine("Primes d'emission", dataN.primes, dataN1.primes),
      pLine('Reserves', dataN.reserves, dataN1.reserves),
      pLine('Report a nouveau', dataN.reportNouveau, dataN1.reportNouveau),
      pLine("Resultat de l'exercice", dataN.resultat, dataN1.resultat),
    ];

    const totalCapitauxPropres =
      dataN.capital +
      dataN.primes +
      dataN.reserves +
      dataN.reportNouveau +
      dataN.resultat;
    const totalCapitauxPropresN1 =
      dataN1.capital +
      dataN1.primes +
      dataN1.reserves +
      dataN1.reportNouveau +
      dataN1.resultat;

    const dettesLines: BilanLine[] = [
      pLine(
        'Dettes financieres',
        dataN.dettesFinancieres,
        dataN1.dettesFinancieres
      ),
      pLine(
        'Clients crediteurs',
        dataN.clientsCrediteurs,
        dataN1.clientsCrediteurs
      ),
      pLine(
        "Dettes d'exploitation",
        dataN.dettesFournisseurs + dataN.dettesExploitation,
        dataN1.dettesFournisseurs + dataN1.dettesExploitation
      ),
    ];

    const totalDettes =
      dataN.dettesFinancieres +
      dataN.clientsCrediteurs +
      dataN.dettesFournisseurs +
      dataN.dettesExploitation;
    const totalDettesN1 =
      dataN1.dettesFinancieres +
      dataN1.clientsCrediteurs +
      dataN1.dettesFournisseurs +
      dataN1.dettesExploitation;

    const totalPassif =
      totalCapitauxPropres + totalDettes + dataN.produitsConstates;
    const totalPassifN1 =
      totalCapitauxPropresN1 + totalDettesN1 + dataN1.produitsConstates;

    return {
      yearN,
      yearN1,
      actifLines,
      actifCirculantLines,
      totalActifImmo,
      totalActifImmoN1,
      totalActifCirculant,
      totalActifCirculantN1,
      totalActif,
      totalActifN1,
      passifLines,
      totalCapitauxPropres,
      totalCapitauxPropresN1,
      dettesLines,
      totalDettes,
      totalDettesN1,
      produitsConstates: dataN.produitsConstates,
      produitsConstatesN1: dataN1.produitsConstates,
      totalPassif,
      totalPassifN1,
    };
  }, [
    creditTransactions,
    debitTransactions,
    selectedYear,
    currentYear,
    externalData?.stockValue,
    externalData?.fixedAssetsBrut,
    externalData?.fixedAssetsAmort,
  ]);
}
