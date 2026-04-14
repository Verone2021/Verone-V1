'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { useBankReconciliation } from '@verone/finance';
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { Money } from '@verone/ui-business';
import { Info, ArrowLeft, HelpCircle } from 'lucide-react';

import { computeMonthlyTva } from './tva-helpers';

export default function TvaPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [showGuide, setShowGuide] = useState(false);

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const monthlyTva = useMemo(
    () =>
      computeMonthlyTva(creditTransactions, debitTransactions, selectedYear),
    [creditTransactions, debitTransactions, selectedYear]
  );

  const annualTotals = useMemo(() => {
    return monthlyTva.reduce(
      (acc, m) => ({
        collectee: acc.collectee + m.totalCollectee,
        deductible: acc.deductible + m.totalDeductible,
        caHT: acc.caHT + m.caHT,
      }),
      { collectee: 0, deductible: 0, caHT: 0 }
    );
  }, [monthlyTva]);

  const annualNet = annualTotals.collectee - annualTotals.deductible;
  const lastMonthCredit =
    monthlyTva.length > 0 ? monthlyTva[0].creditAReporter : 0;

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
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
            <span className="text-black">TVA (CA3)</span>
          </div>
          <h1 className="text-2xl font-bold">Declaration TVA (CA3)</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {showGuide ? 'Masquer le guide' : 'Guide formulaire 3310'}
          </button>
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
      </div>

      {/* Guide "pour les nuls" */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>La TVA CA3</strong> est votre declaration mensuelle de TVA.{' '}
          <strong>TVA collectee</strong> = TVA sur vos ventes (vous la devez a
          l&apos;Etat). <strong>TVA deductible</strong> = TVA sur vos achats
          (l&apos;Etat vous la rembourse).{' '}
          <strong>TVA nette = collectee - deductible - report credit</strong>.
          Si negatif, c&apos;est un credit qui se reporte automatiquement sur le
          mois suivant. A declarer avant le 19-24 du mois suivant sur{' '}
          <strong>impots.gouv.fr</strong>.
        </AlertDescription>
      </Alert>

      {/* Guide correspondance formulaire 3310 */}
      {showGuide && (
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-3 bg-indigo-50 border-b">
            <h2 className="font-semibold text-sm text-indigo-900">
              Correspondance formulaire 3310-CA3 (impots.gouv.fr)
            </h2>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            <p>
              <strong>Ligne 08-09-9B</strong> : Operations imposables (= votre
              CA HT par taux)
            </p>
            <p>
              <strong>Ligne 16</strong> : TVA brute due = total TVA collectee
              sur vos ventes
            </p>
            <p>
              <strong>Ligne 19-20</strong> : TVA deductible = TVA sur achats
              (biens + services)
            </p>
            <p>
              <strong className="text-blue-700">Ligne 22</strong> : Report du
              credit de TVA du mois precedent (reporte automatiquement ici)
            </p>
            <p>
              <strong>Ligne 23</strong> : Total a deduire = TVA deductible +
              report credit (ligne 20 + ligne 22)
            </p>
            <p>
              <strong>Ligne 25</strong> : Credit de TVA = ligne 23 - ligne 16
              (si vous deduisez plus que vous collectez)
            </p>
            <p>
              <strong>Ligne 26</strong> : Remboursement demande (formulaire
              3519, minimum <strong>760 EUR</strong>)
            </p>
            <p>
              <strong className="text-blue-700">Ligne 27</strong> : Credit a
              reporter = ligne 25 - ligne 26 (se reporte sur la ligne 22 du mois
              suivant)
            </p>
            <p>
              <strong className="text-red-700">Ligne 28</strong> : TVA nette due
              = ligne 16 - ligne 23 (montant a payer a l&apos;Etat)
            </p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Remboursement</strong> : si votre credit depasse 760 EUR,
              vous pouvez demander un remboursement via le formulaire 3519-SD au
              lieu de le reporter. En dessous de 760 EUR, le credit est
              automatiquement reporte.
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          Les montants sont calcules a partir des transactions bancaires.
          Verifiez avant de declarer.
          {lastMonthCredit > 0 && (
            <span className="block mt-1 font-medium text-blue-700">
              Credit a reporter sur le mois en cours :{' '}
              {lastMonthCredit.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}{' '}
              EUR (ligne 22)
            </span>
          )}
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
        <div className="space-y-6">
          {/* KPIs recap annuel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                TVA collectee
              </p>
              <p className="text-base font-bold text-gray-900">
                {annualTotals.collectee.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                &euro;
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                TVA deductible
              </p>
              <p className="text-base font-bold text-gray-900">
                {annualTotals.deductible.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                &euro;
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                TVA nette {selectedYear}
              </p>
              <p
                className={`text-base font-bold ${annualNet >= 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {annualNet.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                &euro;
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Credit a reporter
              </p>
              <p
                className={`text-base font-bold ${lastMonthCredit > 0 ? 'text-blue-600' : 'text-gray-900'}`}
              >
                {lastMonthCredit.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                &euro;
              </p>
            </div>
          </div>

          {/* Detail mensuel AVEC report credit */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-semibold text-sm">
                Detail mensuel CA3 — avec report de credit
              </h2>
              <span className="text-xs text-muted-foreground">
                Le credit se reporte automatiquement chaque mois
              </span>
            </div>

            {monthlyTva.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune donnee TVA pour cette periode</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-8 gap-1 px-5 py-2.5 text-[10px] font-medium text-muted-foreground border-b uppercase">
                  <div className="col-span-2">Mois</div>
                  <div className="text-right">Collectee (L16)</div>
                  <div className="text-right">Deductible (L20)</div>
                  <div className="text-right text-blue-600">Report (L22)</div>
                  <div className="text-right">Total deduit (L23)</div>
                  <div className="text-right">A payer / Credit</div>
                  <div className="text-center">Statut</div>
                </div>
                <ScrollArea className="h-[400px]">
                  {monthlyTva.map(m => {
                    const isCredit = m.creditTva > 0;
                    return (
                      <div
                        key={m.month}
                        className="grid grid-cols-8 gap-1 px-5 py-3 border-b hover:bg-gray-50 transition-colors items-center text-sm"
                      >
                        <div className="col-span-2">
                          <span className="font-medium capitalize">
                            {m.label}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            CA{' '}
                            {m.caHT.toLocaleString('fr-FR', {
                              minimumFractionDigits: 0,
                            })}{' '}
                            &euro; HT
                          </span>
                        </div>
                        <div className="text-right">
                          <Money amount={m.totalCollectee} size="sm" />
                        </div>
                        <div className="text-right">
                          <Money amount={m.totalDeductible} size="sm" />
                        </div>
                        <div className="text-right">
                          {m.reportCreditPrecedent > 0 ? (
                            <span className="text-blue-600 font-medium">
                              {m.reportCreditPrecedent.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              &euro;
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                        <div className="text-right">
                          <Money
                            amount={m.totalDeductibleAvecReport}
                            size="sm"
                          />
                        </div>
                        <div className="text-right">
                          <Money
                            amount={isCredit ? -m.creditTva : m.tvaNettedue}
                            colorize
                            bold
                            size="sm"
                          />
                        </div>
                        <div className="text-center text-xs">
                          {isCredit ? (
                            <span className="text-green-600 font-medium">
                              Credit
                            </span>
                          ) : m.tvaNettedue === 0 ? (
                            <span className="text-gray-400">Neutre</span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              A payer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>

                {/* Total annuel */}
                <div className="grid grid-cols-8 gap-1 px-5 py-3 bg-gray-100 font-bold text-sm border-t">
                  <div className="col-span-2">
                    TOTAL {selectedYear === 'all' ? 'GENERAL' : selectedYear}
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.collectee} />
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.deductible} />
                  </div>
                  <div className="text-right text-blue-600">—</div>
                  <div className="text-right">—</div>
                  <div className="text-right">
                    <Money amount={annualNet} colorize />
                  </div>
                  <div className="text-center text-xs">
                    <span
                      className={
                        annualNet >= 0
                          ? 'text-red-600 font-bold'
                          : 'text-green-600 font-bold'
                      }
                    >
                      {annualNet >= 0 ? 'A payer' : 'Credit'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Info remboursement */}
          {lastMonthCredit >= 760 && (
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                <strong>Remboursement possible</strong> : votre credit de TVA (
                {lastMonthCredit.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                EUR) depasse le seuil de 760 EUR. Vous pouvez demander un
                remboursement via le formulaire <strong>3519-SD</strong> sur
                impots.gouv.fr au lieu de le reporter.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
