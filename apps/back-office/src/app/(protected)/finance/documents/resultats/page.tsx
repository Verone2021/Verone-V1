'use client';

/**
 * Resultats — Synthese mensuelle
 *
 * Extrait de l'ancien onglet "Resultats" de /finance/livres.
 * Vue synthese mensuelle avec details expansibles.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import { useBankReconciliation, type BankTransaction } from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Money, KpiCard, KpiGrid } from '@verone/ui-business';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react';

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'unknown';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// =====================================================================
// PAGE
// =====================================================================

export default function ResultatsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  // Grouper par mois
  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      {
        credits: number;
        debits: number;
        creditTx: BankTransaction[];
        debitTx: BankTransaction[];
      }
    > = {};

    creditTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      if (!months[key])
        months[key] = { credits: 0, debits: 0, creditTx: [], debitTx: [] };
      months[key].credits += Math.abs(tx.amount);
      months[key].creditTx.push(tx);
    });

    debitTransactions.forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      if (!months[key])
        months[key] = { credits: 0, debits: 0, creditTx: [], debitTx: [] };
      months[key].debits += Math.abs(tx.amount);
      months[key].debitTx.push(tx);
    });

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        label: formatMonth(`${month}-01`),
        ...data,
        solde: data.credits - data.debits,
      }));
  }, [creditTransactions, debitTransactions, selectedYear]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        credits: acc.credits + m.credits,
        debits: acc.debits + m.debits,
        solde: acc.solde + m.solde,
      }),
      { credits: 0, debits: 0, solde: 0 }
    );
  }, [monthlyData]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

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
            <span className="text-black">Resultats</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Resultats
          </h1>
          <p className="text-muted-foreground">
            Synthese mensuelle des recettes et depenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les annees</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid columns={3}>
        <KpiCard
          title="Total Recettes"
          value={totals.credits}
          valueType="money"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Total Achats"
          value={totals.debits}
          valueType="money"
          icon={<TrendingDown className="h-4 w-4" />}
          color="danger"
        />
        <KpiCard
          title="Resultat"
          value={totals.solde}
          valueType="money"
          icon={<Calculator className="h-4 w-4" />}
          variant={totals.solde >= 0 ? 'success' : 'danger'}
        />
      </KpiGrid>

      {/* Tableau mensuel */}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Synthese mensuelle{' '}
              {selectedYear === 'all' ? '— Toutes les annees' : selectedYear}
            </CardTitle>
            <CardDescription>
              Cliquez sur un mois pour voir le detail des transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
                <div />
                <div>Mois</div>
                <div className="text-right">Recettes</div>
                <div className="text-right">Achats</div>
                <div className="text-right">Solde</div>
              </div>

              {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune donnee pour{' '}
                  {selectedYear === 'all' ? 'cette periode' : selectedYear}
                </div>
              ) : (
                monthlyData.map(row => (
                  <Collapsible
                    key={row.month}
                    open={expandedMonths.has(row.month)}
                    onOpenChange={() => toggleMonth(row.month)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b hover:bg-muted/30 cursor-pointer transition-colors">
                        <div className="flex items-center">
                          {expandedMonths.has(row.month) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="font-medium capitalize text-left">
                          {row.label}
                        </div>
                        <div className="text-right">
                          <Money
                            amount={row.credits}
                            className="text-green-600"
                          />
                        </div>
                        <div className="text-right">
                          <Money
                            amount={-row.debits}
                            className="text-red-600"
                          />
                        </div>
                        <div className="text-right">
                          <Money amount={row.solde} colorize bold />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/20 px-8 py-4 border-b space-y-4">
                        {row.creditTx.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                              <ArrowDownLeft className="h-4 w-4" />
                              Recettes ({row.creditTx.length})
                            </h4>
                            <div className="space-y-1">
                              {row.creditTx.slice(0, 5).map(tx => (
                                <div
                                  key={tx.id}
                                  className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                                >
                                  <span className="text-muted-foreground">
                                    {formatDate(tx.settled_at ?? tx.emitted_at)}{' '}
                                    - {tx.counterparty_name ?? tx.label}
                                  </span>
                                  <Money
                                    amount={Math.abs(tx.amount)}
                                    className="text-green-600"
                                    size="sm"
                                  />
                                </div>
                              ))}
                              {row.creditTx.length > 5 && (
                                <p className="text-xs text-muted-foreground italic">
                                  + {row.creditTx.length - 5} autre(s)
                                  transaction(s)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {row.debitTx.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                              <ArrowUpRight className="h-4 w-4" />
                              Depenses ({row.debitTx.length})
                            </h4>
                            <div className="space-y-1">
                              {row.debitTx.slice(0, 5).map(tx => (
                                <div
                                  key={tx.id}
                                  className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                                >
                                  <span className="text-muted-foreground">
                                    {formatDate(tx.settled_at ?? tx.emitted_at)}{' '}
                                    - {tx.counterparty_name ?? tx.label}
                                  </span>
                                  <Money
                                    amount={-Math.abs(tx.amount)}
                                    className="text-red-600"
                                    size="sm"
                                  />
                                </div>
                              ))}
                              {row.debitTx.length > 5 && (
                                <p className="text-xs text-muted-foreground italic">
                                  + {row.debitTx.length - 5} autre(s)
                                  transaction(s)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}

              {/* Total */}
              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted font-bold">
                <div />
                <div>
                  TOTAL {selectedYear === 'all' ? 'GENERAL' : selectedYear}
                </div>
                <div className="text-right">
                  <Money amount={totals.credits} className="text-green-600" />
                </div>
                <div className="text-right">
                  <Money amount={-totals.debits} className="text-red-600" />
                </div>
                <div className="text-right">
                  <Money amount={totals.solde} colorize />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
