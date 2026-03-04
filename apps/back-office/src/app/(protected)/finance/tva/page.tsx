'use client';

/**
 * Préparation Déclaration TVA (CA3)
 *
 * Calcul automatique:
 * - TVA collectée (sur ventes/recettes)
 * - TVA déductible (sur achats/dépenses)
 * - TVA nette à payer ou crédit de TVA
 *
 * Vue mensuelle pour déclaration CA3.
 */

import { useState, useMemo } from 'react';

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
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { KpiCard, KpiGrid, Money } from '@verone/ui-business';
import {
  Calculator,
  Calendar,
  TrendingUp,
  TrendingDown,
  Percent,
  Info,
  ArrowRight,
  Download,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type TransactionWithVat = BankTransaction & {
  vat_rate?: number;
};

interface MonthlyTva {
  month: string;
  label: string;
  collectee: { [rate: string]: number }; // TVA collected by rate
  deductible: { [rate: string]: number }; // TVA deductible by rate
  totalCollectee: number;
  totalDeductible: number;
  net: number; // positive = à payer, negative = crédit
  caHT: number; // Chiffre d'affaires HT
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

  // Calculate monthly TVA
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

    // TVA collectée (sur ventes)
    (creditTransactions as TransactionWithVat[]).forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;

      const key = getMonthKey(date);
      const m = ensureMonth(key);
      const vatRate = tx.vat_rate ?? 20;
      const ttc = Math.abs(tx.amount);
      const tva = calculateVAT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const ht = calculateHT(ttc, vatRate as 0 | 5.5 | 10 | 20);

      const rateKey = String(vatRate);
      m.collectee[rateKey] = (m.collectee[rateKey] ?? 0) + tva;
      m.totalCollectee += tva;
      m.caHT += ht;
    });

    // TVA déductible (sur achats)
    (debitTransactions as TransactionWithVat[]).forEach(tx => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;

      const key = getMonthKey(date);
      const m = ensureMonth(key);
      const vatRate = tx.vat_rate ?? 20;
      const ttc = Math.abs(tx.amount);
      const tva = calculateVAT(ttc, vatRate as 0 | 5.5 | 10 | 20);
      const ht = calculateHT(ttc, vatRate as 0 | 5.5 | 10 | 20);

      const rateKey = String(vatRate);
      m.deductible[rateKey] = (m.deductible[rateKey] ?? 0) + tva;
      m.totalDeductible += tva;
      m.achatsHT += ht;
    });

    // Calculate net
    for (const m of months.values()) {
      m.net = m.totalCollectee - m.totalDeductible;
    }

    return Array.from(months.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }, [creditTransactions, debitTransactions, selectedYear]);

  // Annual totals
  const annualTotals = useMemo(() => {
    return monthlyTva.reduce(
      (acc, m) => ({
        collectee: acc.collectee + m.totalCollectee,
        deductible: acc.deductible + m.totalDeductible,
        net: acc.net + m.net,
        caHT: acc.caHT + m.caHT,
        achatsHT: acc.achatsHT + m.achatsHT,
      }),
      { collectee: 0, deductible: 0, net: 0, caHT: 0, achatsHT: 0 }
    );
  }, [monthlyTva]);

  // Years
  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Percent className="h-6 w-6" />
            Déclaration TVA (CA3)
          </h1>
          <p className="text-muted-foreground">
            Préparation mensuelle — TVA collectée vs déductible
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 text-sm">
          <strong>Note :</strong> Les montants de TVA sont calculés à partir des
          transactions bancaires. Pour une déclaration CA3 définitive, vérifiez
          avec votre expert-comptable. Les taux de TVA par transaction peuvent
          être ajustés dans la page Transactions.
        </AlertDescription>
      </Alert>

      {/* KPIs annuels */}
      <KpiGrid columns={4}>
        <KpiCard
          title="TVA collectée"
          value={annualTotals.collectee}
          valueType="money"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="TVA déductible"
          value={annualTotals.deductible}
          valueType="money"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KpiCard
          title={annualTotals.net >= 0 ? 'TVA à payer' : 'Crédit de TVA'}
          value={Math.abs(annualTotals.net)}
          valueType="money"
          icon={<Calculator className="h-4 w-4" />}
          variant={annualTotals.net >= 0 ? 'danger' : 'success'}
        />
        <KpiCard
          title="CA HT"
          value={annualTotals.caHT}
          valueType="money"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </KpiGrid>

      {/* Détail annuel par taux */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Récapitulatif par taux de TVA
          </CardTitle>
          <CardDescription>
            Ventilation de la TVA collectée et déductible par taux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div>Taux</div>
              <div className="text-right">TVA collectée</div>
              <div className="text-right">TVA déductible</div>
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
                  className="grid grid-cols-5 gap-4 px-4 py-3 border-b hover:bg-muted/30"
                >
                  <div>
                    <Badge variant="outline" className="font-mono">
                      {rate.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      {rate.description}
                    </span>
                  </div>
                  <div className="text-right">
                    <Money
                      amount={collected}
                      className="text-green-600"
                      size="sm"
                    />
                  </div>
                  <div className="text-right">
                    <Money
                      amount={deducted}
                      className="text-red-600"
                      size="sm"
                    />
                  </div>
                  <div className="text-right">
                    <Money amount={net} colorize bold size="sm" />
                  </div>
                  <div className="text-center">
                    <Badge
                      variant={net >= 0 ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {net >= 0 ? 'À payer' : 'Crédit'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tableau mensuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Détail mensuel CA3
          </CardTitle>
          <CardDescription>
            Pour chaque mois : TVA collectée, TVA déductible, TVA nette
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 py-4">{error}</div>
          ) : monthlyTva.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucune donnée TVA pour cette période</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide">
                <div className="col-span-2">Mois</div>
                <div className="text-right">CA HT</div>
                <div className="text-right">TVA collectée</div>
                <div className="text-right">TVA déductible</div>
                <div className="text-right">TVA nette</div>
                <div className="text-center">Statut</div>
              </div>
              <ScrollArea className="h-[400px]">
                {monthlyTva.map(m => (
                  <div
                    key={m.month}
                    className="grid grid-cols-7 gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center"
                  >
                    <div className="col-span-2 font-medium capitalize">
                      {m.label}
                    </div>
                    <div className="text-right">
                      <Money amount={m.caHT} size="sm" />
                    </div>
                    <div className="text-right">
                      <Money
                        amount={m.totalCollectee}
                        className="text-green-600"
                        size="sm"
                      />
                    </div>
                    <div className="text-right">
                      <Money
                        amount={m.totalDeductible}
                        className="text-red-600"
                        size="sm"
                      />
                    </div>
                    <div className="text-right">
                      <Money amount={m.net} colorize bold size="sm" />
                    </div>
                    <div className="text-center">
                      {m.net >= 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          À payer
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-600"
                        >
                          Crédit
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>

              {/* Total annuel */}
              <div className="grid grid-cols-7 gap-2 px-4 py-3 bg-muted font-bold border-t-2">
                <div className="col-span-2">
                  TOTAL {selectedYear === 'all' ? 'GÉNÉRAL' : selectedYear}
                </div>
                <div className="text-right">
                  <Money amount={annualTotals.caHT} />
                </div>
                <div className="text-right">
                  <Money
                    amount={annualTotals.collectee}
                    className="text-green-700"
                  />
                </div>
                <div className="text-right">
                  <Money
                    amount={annualTotals.deductible}
                    className="text-red-700"
                  />
                </div>
                <div className="text-right">
                  <Money amount={annualTotals.net} colorize />
                </div>
                <div className="text-center">
                  <Badge
                    variant={annualTotals.net >= 0 ? 'destructive' : 'default'}
                  >
                    {annualTotals.net >= 0 ? 'À payer' : 'Crédit'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
