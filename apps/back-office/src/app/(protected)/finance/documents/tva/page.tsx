'use client';

/**
 * Preparation Declaration TVA (CA3) — Style Indy epure
 *
 * Pas de KPIs cards. Tableau recap par taux + detail mensuel.
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useBankReconciliation,
  calculateHT,
  calculateVAT,
  TVA_RATES,
  type BankTransaction,
} from '@verone/finance';
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
import { Percent, Info, ArrowLeft } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TransactionWithVat = BankTransaction & {
  vat_rate?: number;
};

interface MonthlyTva {
  month: string;
  label: string;
  collectee: { [rate: string]: number };
  deductible: { [rate: string]: number };
  totalCollectee: number;
  totalDeductible: number;
  net: number;
  caHT: number;
  achatsHT: number;
}

// =====================================================================
// HELPERS
// =====================================================================

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// =====================================================================
// PAGE
// =====================================================================

export default function TvaPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { creditTransactions, debitTransactions, loading, error } =
    useBankReconciliation();

  const monthlyTva = useMemo(() => {
    const months = new Map<string, MonthlyTva>();

    const ensureMonth = (key: string): MonthlyTva => {
      if (!months.has(key)) {
        months.set(key, {
          month: key,
          label: formatMonthLabel(key),
          collectee: {},
          deductible: {},
          totalCollectee: 0,
          totalDeductible: 0,
          net: 0,
          caHT: 0,
          achatsHT: 0,
        });
      }
      return months.get(key)!;
    };

    (creditTransactions as TransactionWithVat[]).forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      const m = ensureMonth(key);
      const vatRate = tx.vat_rate ?? 0;
      const ttc = Math.abs(tx.amount);
      const tva = calculateVAT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const ht = calculateHT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const rateKey = String(vatRate);
      m.collectee[rateKey] = (m.collectee[rateKey] ?? 0) + tva;
      m.totalCollectee += tva;
      m.caHT += ht;
    });

    (debitTransactions as TransactionWithVat[]).forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;
      const key = getMonthKey(date);
      const m = ensureMonth(key);
      const vatRate = tx.vat_rate ?? 0;
      const ttc = Math.abs(tx.amount);
      const tva = calculateVAT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const ht = calculateHT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const rateKey = String(vatRate);
      m.deductible[rateKey] = (m.deductible[rateKey] ?? 0) + tva;
      m.totalDeductible += tva;
      m.achatsHT += ht;
    });

    for (const m of months.values()) {
      m.net = m.totalCollectee - m.totalDeductible;
    }

    return Array.from(months.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [creditTransactions, debitTransactions, selectedYear]);

  const annualTotals = useMemo(() => {
    return monthlyTva.reduce(
      (acc, m) => ({
        collectee: acc.collectee + m.totalCollectee,
        deductible: acc.deductible + m.totalDeductible,
        net: acc.net + m.net,
        caHT: acc.caHT + m.caHT,
      }),
      { collectee: 0, deductible: 0, net: 0, caHT: 0 }
    );
  }, [monthlyTva]);

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

      {/* Info banner */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700 text-sm">
          Les montants de TVA sont calcules a partir des transactions bancaires.
          Verifiez avec votre expert-comptable pour la declaration CA3
          definitive.
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
          {/* Recap par taux */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-sm">
                Recapitulatif par taux de TVA
              </h2>
            </div>
            <div className="grid grid-cols-5 gap-4 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b">
              <div>Taux</div>
              <div className="text-right">TVA collectee</div>
              <div className="text-right">TVA deductible</div>
              <div className="text-right">Net</div>
              <div className="text-center">Statut</div>
            </div>
            {TVA_RATES.filter(r => r.value > 0).map(rate => {
              const rateKey = String(rate.value);
              const collected = monthlyTva.reduce(
                (sum, m) => sum + (m.collectee[rateKey] ?? 0),
                0
              );
              const deducted = monthlyTva.reduce(
                (sum, m) => sum + (m.deductible[rateKey] ?? 0),
                0
              );
              const net = collected - deducted;
              if (collected === 0 && deducted === 0) return null;
              return (
                <div
                  key={rateKey}
                  className="grid grid-cols-5 gap-4 px-5 py-3 border-b text-sm"
                >
                  <div>
                    <span className="font-mono font-medium">{rate.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {rate.description}
                    </span>
                  </div>
                  <div className="text-right">
                    <Money amount={collected} size="sm" />
                  </div>
                  <div className="text-right">
                    <Money amount={deducted} size="sm" />
                  </div>
                  <div className="text-right">
                    <Money amount={net} colorize bold size="sm" />
                  </div>
                  <div className="text-center text-xs">
                    <span
                      className={net >= 0 ? 'text-red-600' : 'text-green-600'}
                    >
                      {net >= 0 ? 'A payer' : 'Credit'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail mensuel */}
          <div className="border rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-sm">Detail mensuel CA3</h2>
            </div>

            {monthlyTva.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Percent className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune donnee TVA pour cette periode</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-2">Mois</div>
                  <div className="text-right">CA HT</div>
                  <div className="text-right">TVA collectee</div>
                  <div className="text-right">TVA deductible</div>
                  <div className="text-right">TVA nette</div>
                  <div className="text-center">Statut</div>
                </div>
                <ScrollArea className="h-[400px]">
                  {monthlyTva.map(m => (
                    <div
                      key={m.month}
                      className="grid grid-cols-7 gap-2 px-5 py-3 border-b hover:bg-gray-50 transition-colors items-center text-sm"
                    >
                      <div className="col-span-2 font-medium capitalize">
                        {m.label}
                      </div>
                      <div className="text-right">
                        <Money amount={m.caHT} size="sm" />
                      </div>
                      <div className="text-right">
                        <Money amount={m.totalCollectee} size="sm" />
                      </div>
                      <div className="text-right">
                        <Money amount={m.totalDeductible} size="sm" />
                      </div>
                      <div className="text-right">
                        <Money amount={m.net} colorize bold size="sm" />
                      </div>
                      <div className="text-center text-xs">
                        <span
                          className={
                            m.net >= 0 ? 'text-red-600' : 'text-green-600'
                          }
                        >
                          {m.net >= 0 ? 'A payer' : 'Credit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                {/* Total */}
                <div className="grid grid-cols-7 gap-2 px-5 py-3 bg-gray-100 font-bold text-sm border-t">
                  <div className="col-span-2">
                    TOTAL {selectedYear === 'all' ? 'GENERAL' : selectedYear}
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.caHT} />
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.collectee} />
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.deductible} />
                  </div>
                  <div className="text-right">
                    <Money amount={annualTotals.net} colorize />
                  </div>
                  <div className="text-center text-xs">
                    <span
                      className={
                        annualTotals.net >= 0
                          ? 'text-red-600 font-bold'
                          : 'text-green-600 font-bold'
                      }
                    >
                      {annualTotals.net >= 0 ? 'A payer' : 'Credit'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
