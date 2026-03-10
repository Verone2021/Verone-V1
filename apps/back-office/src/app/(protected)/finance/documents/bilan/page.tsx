'use client';

/**
 * Bilan — Style Indy (tableau formel Cerfa)
 *
 * BILAN ACTIF : Brut | Amortissements | Net N | Net N-1
 * BILAN PASSIF : Net N | Net N-1
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { useBankReconciliation, type BankTransaction } from '@verone/finance';
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import { ArrowLeft, Info } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface BilanLine {
  label: string;
  brut: number;
  amortissement: number;
  net: number;
  netN1: number;
  isBold?: boolean;
  isTotal?: boolean;
  indent?: boolean;
}

type TransactionWithPcg = BankTransaction & { category_pcg?: string };

// =====================================================================
// PAGE
// =====================================================================

export default function BilanPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  const bilan = useMemo(() => {
    const filterByYear = (txs: BankTransaction[], year: string) =>
      year === 'all'
        ? txs
        : txs.filter(tx => {
            const date = tx.settled_at ?? tx.emitted_at;
            return date?.startsWith(year);
          });

    const computeForYear = (year: string) => {
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
      const totalDebits = debits.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      );
      const soldeBancaire = totalCredits - totalDebits;
      const resultat = totalCredits - totalDebits;

      // TVA estimee
      const tvaCollectee = credits.reduce((sum, tx) => {
        const vatRate =
          (tx as TransactionWithPcg & { vat_rate?: number }).vat_rate ?? 0;
        const ttc = Math.abs(tx.amount);
        return sum + (ttc - ttc / (1 + vatRate / 100));
      }, 0);
      const tvaDeductible = debits.reduce((sum, tx) => {
        const vatRate =
          (tx as TransactionWithPcg & { vat_rate?: number }).vat_rate ?? 0;
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
    };

    const yearN = selectedYear === 'all' ? String(currentYear) : selectedYear;
    const yearN1 = String(Number(yearN) - 1);
    const dataN = computeForYear(yearN);
    const dataN1 = computeForYear(yearN1);

    // ACTIF lines
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
        brut: dataN.immoCorporelles,
        amortissement: 0,
        net: dataN.immoCorporelles,
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
      dataN.immoIncorporelles + dataN.immoCorporelles + dataN.immoFinancieres;
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

    // PASSIF lines
    const passifLines: BilanLine[] = [
      {
        label: 'Capital',
        brut: 0,
        amortissement: 0,
        net: dataN.capital,
        netN1: dataN1.capital,
        indent: true,
      },
      {
        label: "Primes d'emission",
        brut: 0,
        amortissement: 0,
        net: dataN.primes,
        netN1: dataN1.primes,
        indent: true,
      },
      {
        label: 'Reserves',
        brut: 0,
        amortissement: 0,
        net: dataN.reserves,
        netN1: dataN1.reserves,
        indent: true,
      },
      {
        label: 'Report a nouveau',
        brut: 0,
        amortissement: 0,
        net: dataN.reportNouveau,
        netN1: dataN1.reportNouveau,
        indent: true,
      },
      {
        label: "Resultat de l'exercice",
        brut: 0,
        amortissement: 0,
        net: dataN.resultat,
        netN1: dataN1.resultat,
        indent: true,
      },
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
      {
        label: 'Dettes financieres',
        brut: 0,
        amortissement: 0,
        net: dataN.dettesFinancieres,
        netN1: dataN1.dettesFinancieres,
        indent: true,
      },
      {
        label: 'Clients crediteurs',
        brut: 0,
        amortissement: 0,
        net: dataN.clientsCrediteurs,
        netN1: dataN1.clientsCrediteurs,
        indent: true,
      },
      {
        label: "Dettes d'exploitation",
        brut: 0,
        amortissement: 0,
        net: dataN.dettesFournisseurs + dataN.dettesExploitation,
        netN1: dataN1.dettesFournisseurs + dataN1.dettesExploitation,
        indent: true,
      },
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
  }, [creditTransactions, debitTransactions, selectedYear, currentYear]);

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  // Render helper for amount cell
  const renderAmount = (amount: number) => (
    <Money
      amount={amount}
      size="sm"
      className={amount === 0 ? 'text-muted-foreground' : ''}
    />
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/finance/documents"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Documents
            </Link>
            <span>/</span>
            <span className="text-black">Bilan</span>
          </div>
          <h1 className="text-2xl font-bold">Bilan</h1>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les annees</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                Exercice {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          Votre bilan {bilan.yearN} n&apos;est{' '}
          <strong>pas encore cloture</strong>, les montants affiches sont{' '}
          <strong>previsionnels</strong>.
          <br />
          Rendez-vous dans l&apos;onglet <em>A faire</em> pour acceder a la
          cloture et <strong>generer votre bilan definitif</strong>.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* ====== BILAN ACTIF ====== */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-bold text-sm uppercase tracking-wide">
                Bilan Actif
              </h2>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b bg-gray-50/50">
              <div className="col-span-4" />
              <div className="col-span-4 text-center">
                Exercice {bilan.yearN}
              </div>
              <div className="col-span-2 text-center border-l">
                Exercice {bilan.yearN1}
              </div>
              <div className="col-span-2" />
            </div>
            <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-4" />
              <div className="col-span-2 text-right">Brut</div>
              <div className="col-span-2 text-right">Amortissements</div>
              <div className="col-span-2 text-right border-l pl-2">Net</div>
              <div className="col-span-2 text-right">Net</div>
            </div>

            {/* Actif immobilise */}
            {bilan.actifLines.map((line, i) => (
              <div
                key={`ai-${i}`}
                className={`grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm ${line.isBold ? 'font-semibold bg-gray-50/30' : ''}`}
              >
                <div className={`col-span-4 ${line.indent ? 'pl-4' : ''}`}>
                  {line.label}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.brut)}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.amortissement)}
                </div>
                <div className="col-span-2 text-right border-l pl-2">
                  {!line.isBold && renderAmount(line.net)}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.netN1)}
                </div>
              </div>
            ))}

            {/* Actif circulant */}
            {bilan.actifCirculantLines.map((line, i) => (
              <div
                key={`ac-${i}`}
                className={`grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm ${line.isBold ? 'font-semibold bg-gray-50/30' : ''}`}
              >
                <div className={`col-span-4 ${line.indent ? 'pl-4' : ''}`}>
                  {line.label}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.brut)}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.amortissement)}
                </div>
                <div className="col-span-2 text-right border-l pl-2">
                  {!line.isBold && renderAmount(line.net)}
                </div>
                <div className="col-span-2 text-right">
                  {!line.isBold && renderAmount(line.netN1)}
                </div>
              </div>
            ))}

            {/* Total actif et circulant */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm bg-gray-50/50">
              <div className="col-span-4 pl-4 font-medium">
                Total actif et circulant
              </div>
              <div className="col-span-2" />
              <div className="col-span-2" />
              <div className="col-span-2 text-right border-l pl-2">
                {renderAmount(bilan.totalActif)}
              </div>
              <div className="col-span-2 text-right">
                {renderAmount(bilan.totalActifN1)}
              </div>
            </div>

            {/* TOTAL ACTIF */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm font-bold bg-orange-50">
              <div className="col-span-4">TOTAL ACTIF</div>
              <div className="col-span-2" />
              <div className="col-span-2" />
              <div className="col-span-2 text-right border-l pl-2">
                <Money amount={bilan.totalActif} />
              </div>
              <div className="col-span-2 text-right">
                <Money amount={bilan.totalActifN1} />
              </div>
            </div>
          </div>

          {/* ====== BILAN PASSIF ====== */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-bold text-sm uppercase tracking-wide">
                Bilan Passif
              </h2>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-6" />
              <div className="col-span-3 text-right">
                Exercice {bilan.yearN} (Net)
              </div>
              <div className="col-span-3 text-right">
                Exercice {bilan.yearN1} (Net)
              </div>
            </div>

            {/* Capitaux propres */}
            {bilan.passifLines.map((line, i) => (
              <div
                key={`p-${i}`}
                className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm"
              >
                <div className={`col-span-6 ${line.indent ? 'pl-4' : ''}`}>
                  {line.label}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(line.net)}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(line.netN1)}
                </div>
              </div>
            ))}

            {/* Total Capitaux Propres */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-semibold bg-gray-50/50">
              <div className="col-span-6">Total Capitaux Propres</div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.totalCapitauxPropres)}
              </div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.totalCapitauxPropresN1)}
              </div>
            </div>

            {/* Dettes */}
            {bilan.dettesLines.map((line, i) => (
              <div
                key={`d-${i}`}
                className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm"
              >
                <div className={`col-span-6 ${line.indent ? 'pl-4' : ''}`}>
                  {line.label}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(line.net)}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(line.netN1)}
                </div>
              </div>
            ))}

            {/* Total Dettes */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-semibold bg-gray-50/50">
              <div className="col-span-6">Total Dettes</div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.totalDettes)}
              </div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.totalDettesN1)}
              </div>
            </div>

            {/* Produits constates d'avance */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm">
              <div className="col-span-6 pl-4">
                Produits constates d&apos;avance
              </div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.produitsConstates)}
              </div>
              <div className="col-span-3 text-right">
                {renderAmount(bilan.produitsConstatesN1)}
              </div>
            </div>

            {/* TOTAL PASSIF */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 text-sm font-bold bg-orange-50">
              <div className="col-span-6">TOTAL PASSIF</div>
              <div className="col-span-3 text-right">
                <Money amount={bilan.totalPassif} />
              </div>
              <div className="col-span-3 text-right">
                <Money amount={bilan.totalPassifN1} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
