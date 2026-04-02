/* eslint-disable max-lines */
'use client';

/**
 * Compte de Resultat — Style Indy (tableau formel)
 *
 * Format simple : libelle | montant N | montant N-1
 * Pas de badges colores, design epure.
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

type TransactionWithExtras = BankTransaction & {
  category_pcg?: string;
  ignore_reason?: string;
};

// =====================================================================
// PAGE
// =====================================================================

export default function CompteResultatPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Structure légale PCG art. 832-2 — 3 niveaux obligatoires
  const pcgStructure = {
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

  const allProduits = [
    ...pcgStructure.produitsExploitation,
    ...pcgStructure.produitsFinanciers,
    ...pcgStructure.produitsExceptionnels,
  ];
  const allCharges = [
    ...pcgStructure.chargesExploitation,
    ...pcgStructure.chargesFinancieres,
    ...pcgStructure.chargesExceptionnelles,
    ...pcgStructure.impots,
  ];

  const computeForYear = (year: string) => {
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
    allProduits.forEach(p => (produitsClasses[p.code] = 0));
    credits.forEach(tx => {
      const pcgCode = tx.category_pcg;
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (produitsClasses[classCode] !== undefined) {
          produitsClasses[classCode] += Math.abs(tx.amount);
        }
      }
    });

    const chargesClasses: Record<string, number> = {};
    allCharges.forEach(c => (chargesClasses[c.code] = 0));
    (debits as TransactionWithExtras[]).forEach(tx => {
      const pcgCode =
        tx.category_pcg || tx.ignore_reason?.match(/PCG (\d+)/)?.[1];
      if (pcgCode) {
        const classCode = pcgCode.substring(0, 2);
        if (chargesClasses[classCode] !== undefined) {
          chargesClasses[classCode] += Math.abs(tx.amount);
        }
      }
    });

    return { produitsClasses, chargesClasses };
  };

  const yearN = selectedYear === 'all' ? String(currentYear) : selectedYear;
  const yearN1 = String(Number(yearN) - 1);

  const dataN = useMemo(
    () => computeForYear(yearN),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creditTransactions, debitTransactions, yearN]
  );
  const dataN1 = useMemo(
    () => computeForYear(yearN1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creditTransactions, debitTransactions, yearN1]
  );

  const sumGroup = (
    items: { code: string }[],
    data: {
      produitsClasses: Record<string, number>;
      chargesClasses: Record<string, number>;
    },
    type: 'produits' | 'charges'
  ) =>
    items.reduce(
      (sum, item) =>
        sum +
        ((type === 'produits'
          ? data.produitsClasses[item.code]
          : data.chargesClasses[item.code]) ?? 0),
      0
    );

  // Exploitation
  const prodExplN = sumGroup(
    pcgStructure.produitsExploitation,
    dataN,
    'produits'
  );
  const prodExplN1 = sumGroup(
    pcgStructure.produitsExploitation,
    dataN1,
    'produits'
  );
  const charExplN = sumGroup(
    pcgStructure.chargesExploitation,
    dataN,
    'charges'
  );
  const charExplN1 = sumGroup(
    pcgStructure.chargesExploitation,
    dataN1,
    'charges'
  );
  const resExplN = prodExplN - charExplN;
  const resExplN1 = prodExplN1 - charExplN1;

  // Financier
  const prodFinN = sumGroup(pcgStructure.produitsFinanciers, dataN, 'produits');
  const prodFinN1 = sumGroup(
    pcgStructure.produitsFinanciers,
    dataN1,
    'produits'
  );
  const charFinN = sumGroup(pcgStructure.chargesFinancieres, dataN, 'charges');
  const charFinN1 = sumGroup(
    pcgStructure.chargesFinancieres,
    dataN1,
    'charges'
  );
  const resFinN = prodFinN - charFinN;
  const resFinN1 = prodFinN1 - charFinN1;

  // Courant
  const resCourantN = resExplN + resFinN;
  const resCourantN1 = resExplN1 + resFinN1;

  // Exceptionnel
  const prodExcN = sumGroup(
    pcgStructure.produitsExceptionnels,
    dataN,
    'produits'
  );
  const prodExcN1 = sumGroup(
    pcgStructure.produitsExceptionnels,
    dataN1,
    'produits'
  );
  const charExcN = sumGroup(
    pcgStructure.chargesExceptionnelles,
    dataN,
    'charges'
  );
  const charExcN1 = sumGroup(
    pcgStructure.chargesExceptionnelles,
    dataN1,
    'charges'
  );
  const resExcN = prodExcN - charExcN;
  const resExcN1 = prodExcN1 - charExcN1;

  // IS
  const isN = sumGroup(pcgStructure.impots, dataN, 'charges');
  const isN1 = sumGroup(pcgStructure.impots, dataN1, 'charges');

  // Résultat net
  const resultatN = resCourantN + resExcN - isN;
  const resultatN1 = resCourantN1 + resExcN1 - isN1;

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

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
            <span className="text-black">Compte de resultat</span>
          </div>
          <h1 className="text-2xl font-bold">Compte de Resultat</h1>
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

      {/* Guide */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Le Compte de Resultat</strong> montre si votre entreprise
          gagne ou perd de l&apos;argent sur l&apos;annee. En haut : ce que vous
          gagnez (<strong>Produits</strong>). En bas : ce que vous depensez (
          <strong>Charges</strong>). La difference = votre{' '}
          <strong>Resultat Net</strong> (benefice ou perte). Il est structure en
          3 niveaux : exploitation (activite courante), financier (interets),
          exceptionnel (evenements rares).
        </AlertDescription>
      </Alert>

      {/* Alert exercice */}
      {selectedYear !== 'all' && (
        <Alert className="border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 text-sm">
            Votre exercice {yearN} n&apos;est{' '}
            <strong>pas encore cloture</strong>, les montants affiches sont{' '}
            <strong>previsionnels</strong>.
          </AlertDescription>
        </Alert>
      )}

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
        <div className="border rounded-xl bg-white overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b bg-gray-50">
            <div className="col-span-6">Libelle</div>
            <div className="col-span-3 text-right">Exercice {yearN}</div>
            <div className="col-span-3 text-right">Exercice {yearN1}</div>
          </div>

          {/* ========== I. RESULTAT D'EXPLOITATION ========== */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b bg-gray-50/50 font-semibold text-sm">
            <div className="col-span-12">PRODUITS D&apos;EXPLOITATION</div>
          </div>
          {pcgStructure.produitsExploitation.map(p => {
            const amountN = dataN.produitsClasses[p.code] ?? 0;
            const amountN1 = dataN1.produitsClasses[p.code] ?? 0;
            if (amountN === 0 && amountN1 === 0) return null;
            return (
              <div
                key={p.code}
                className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
              >
                <div className="col-span-6 pl-4">
                  <span className="text-muted-foreground font-mono mr-2">
                    {p.code}
                  </span>
                  {p.label}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(amountN)}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(amountN1)}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b bg-gray-50/50 font-semibold text-sm">
            <div className="col-span-12">CHARGES D&apos;EXPLOITATION</div>
          </div>
          {pcgStructure.chargesExploitation.map(c => {
            const amountN = dataN.chargesClasses[c.code] ?? 0;
            const amountN1 = dataN1.chargesClasses[c.code] ?? 0;
            if (amountN === 0 && amountN1 === 0) return null;
            return (
              <div
                key={c.code}
                className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
              >
                <div className="col-span-6 pl-4">
                  <span className="text-muted-foreground font-mono mr-2">
                    {c.code}
                  </span>
                  {c.label}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(amountN)}
                </div>
                <div className="col-span-3 text-right">
                  {renderAmount(amountN1)}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-bold bg-blue-50/50">
            <div className="col-span-6">I. RESULTAT D&apos;EXPLOITATION</div>
            <div className="col-span-3 text-right">
              <Money
                amount={resExplN}
                className={resExplN >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resExplN1}
                className={resExplN1 >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
          </div>

          {/* ========== II. RESULTAT FINANCIER ========== */}
          {(prodFinN > 0 || prodFinN1 > 0 || charFinN > 0 || charFinN1 > 0) && (
            <>
              {pcgStructure.produitsFinanciers.map(p => {
                const amountN = dataN.produitsClasses[p.code] ?? 0;
                const amountN1 = dataN1.produitsClasses[p.code] ?? 0;
                if (amountN === 0 && amountN1 === 0) return null;
                return (
                  <div
                    key={p.code}
                    className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
                  >
                    <div className="col-span-6 pl-4">
                      <span className="text-muted-foreground font-mono mr-2">
                        {p.code}
                      </span>
                      {p.label}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN)}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN1)}
                    </div>
                  </div>
                );
              })}
              {pcgStructure.chargesFinancieres.map(c => {
                const amountN = dataN.chargesClasses[c.code] ?? 0;
                const amountN1 = dataN1.chargesClasses[c.code] ?? 0;
                if (amountN === 0 && amountN1 === 0) return null;
                return (
                  <div
                    key={c.code}
                    className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
                  >
                    <div className="col-span-6 pl-4">
                      <span className="text-muted-foreground font-mono mr-2">
                        {c.code}
                      </span>
                      {c.label}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN)}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN1)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-bold bg-blue-50/50">
            <div className="col-span-6">II. RESULTAT FINANCIER</div>
            <div className="col-span-3 text-right">
              <Money
                amount={resFinN}
                className={resFinN >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resFinN1}
                className={resFinN1 >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
          </div>

          {/* RESULTAT COURANT */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-semibold bg-gray-100">
            <div className="col-span-6">
              RESULTAT COURANT AVANT IMPOTS (I + II)
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resCourantN}
                className={resCourantN >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resCourantN1}
                className={
                  resCourantN1 >= 0 ? 'text-green-700' : 'text-red-700'
                }
              />
            </div>
          </div>

          {/* ========== III. RESULTAT EXCEPTIONNEL ========== */}
          {(prodExcN > 0 || prodExcN1 > 0 || charExcN > 0 || charExcN1 > 0) && (
            <>
              {pcgStructure.produitsExceptionnels.map(p => {
                const amountN = dataN.produitsClasses[p.code] ?? 0;
                const amountN1 = dataN1.produitsClasses[p.code] ?? 0;
                return (
                  <div
                    key={p.code}
                    className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
                  >
                    <div className="col-span-6 pl-4">
                      <span className="text-muted-foreground font-mono mr-2">
                        {p.code}
                      </span>
                      {p.label}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN)}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN1)}
                    </div>
                  </div>
                );
              })}
              {pcgStructure.chargesExceptionnelles.map(c => {
                const amountN = dataN.chargesClasses[c.code] ?? 0;
                const amountN1 = dataN1.chargesClasses[c.code] ?? 0;
                return (
                  <div
                    key={c.code}
                    className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-sm"
                  >
                    <div className="col-span-6 pl-4">
                      <span className="text-muted-foreground font-mono mr-2">
                        {c.code}
                      </span>
                      {c.label}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN)}
                    </div>
                    <div className="col-span-3 text-right">
                      {renderAmount(amountN1)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm font-bold bg-blue-50/50">
            <div className="col-span-6">III. RESULTAT EXCEPTIONNEL</div>
            <div className="col-span-3 text-right">
              <Money
                amount={resExcN}
                className={resExcN >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resExcN1}
                className={resExcN1 >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
          </div>

          {/* IMPOT SUR LES BENEFICES */}
          {(isN > 0 || isN1 > 0) && (
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b text-sm">
              <div className="col-span-6 pl-4">
                <span className="text-muted-foreground font-mono mr-2">69</span>
                Impot sur les benefices (IS)
              </div>
              <div className="col-span-3 text-right">{renderAmount(-isN)}</div>
              <div className="col-span-3 text-right">{renderAmount(-isN1)}</div>
            </div>
          )}

          {/* RESULTAT NET */}
          <div className="grid grid-cols-12 gap-2 px-5 py-4 text-sm font-bold bg-orange-50">
            <div className="col-span-6">
              RESULTAT NET
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({resultatN >= 0 ? 'Benefice' : 'Perte'})
              </span>
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resultatN}
                className={resultatN >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
            <div className="col-span-3 text-right">
              <Money
                amount={resultatN1}
                className={resultatN1 >= 0 ? 'text-green-700' : 'text-red-700'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
