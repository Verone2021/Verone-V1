'use client';

/**
 * Bilan Simplifié
 *
 * Présentation Actif / Passif / Capitaux propres
 * Basé sur les comptes PCG classes 1-5.
 *
 * Note: bilan simplifié pour aide à la décision.
 * Le bilan officiel est établi par l'expert-comptable.
 */

import { useState, useMemo } from 'react';

import {
  useBankReconciliation,
  getPcgCategory,
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
  Alert,
  AlertDescription,
} from '@verone/ui';
import { KpiCard, KpiGrid, Money } from '@verone/ui-business';
import {
  Scale,
  Calendar,
  TrendingUp,
  TrendingDown,
  Landmark,
  Info,
  Building2,
  Wallet,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface BilanLine {
  code: string;
  label: string;
  amount: number;
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

  // Build bilan from transactions
  const bilan = useMemo(() => {
    // Accumulate by PCG class
    const pcgTotals = new Map<string, number>();

    const processTx = (tx: BankTransaction, isCredit: boolean) => {
      const date = tx.settled_at ?? tx.emitted_at;
      if (!date) return;
      if (selectedYear !== 'all' && !date.startsWith(selectedYear)) return;

      const pcgCode =
        (tx as TransactionWithPcg).category_pcg ?? (isCredit ? '70' : '60');
      const classCode = pcgCode.substring(0, 1);
      const amount = Math.abs(tx.amount);
      const current = pcgTotals.get(classCode) ?? 0;
      pcgTotals.set(classCode, current + (isCredit ? amount : -amount));
    };

    creditTransactions.forEach(tx => processTx(tx, true));
    debitTransactions.forEach(tx => processTx(tx, false));

    // Actif
    const actifImmobilise: BilanLine[] = [];
    const actifCirculant: BilanLine[] = [];

    // Immobilisations (classe 2) — simplifié, pas de données directes
    const immo = pcgTotals.get('2') ?? 0;
    if (immo !== 0) {
      actifImmobilise.push({
        code: '2',
        label: 'Immobilisations',
        amount: Math.abs(immo),
      });
    }

    // Stocks (classe 3)
    const stocks = pcgTotals.get('3') ?? 0;
    if (stocks !== 0) {
      actifCirculant.push({
        code: '3',
        label: 'Stocks et en-cours',
        amount: Math.abs(stocks),
      });
    }

    // Créances (classe 4)
    const creances = pcgTotals.get('4') ?? 0;
    if (creances > 0) {
      actifCirculant.push({
        code: '4',
        label: 'Créances clients',
        amount: creances,
      });
    }

    // Trésorerie (classe 5) — solde bancaire
    const tresorerie = pcgTotals.get('5') ?? 0;
    // Use net result as proxy for bank balance
    const totalCredits = creditTransactions
      .filter(tx => {
        const date = tx.settled_at ?? tx.emitted_at;
        if (!date) return false;
        return selectedYear === 'all' || date.startsWith(selectedYear);
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalDebits = debitTransactions
      .filter(tx => {
        const date = tx.settled_at ?? tx.emitted_at;
        if (!date) return false;
        return selectedYear === 'all' || date.startsWith(selectedYear);
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const soldeBancaire = totalCredits - totalDebits;
    actifCirculant.push({
      code: '512',
      label: 'Disponibilités (banque)',
      amount: Math.max(0, soldeBancaire),
    });

    // Passif
    const capitauxPropres: BilanLine[] = [];
    const dettes: BilanLine[] = [];

    // Résultat de l'exercice
    const resultat = totalCredits - totalDebits;
    capitauxPropres.push({
      code: '12',
      label:
        resultat >= 0
          ? "Résultat de l'exercice (bénéfice)"
          : "Résultat de l'exercice (perte)",
      amount: resultat,
    });

    // Dettes fournisseurs (classe 4 négatif)
    if (creances < 0) {
      dettes.push({
        code: '401',
        label: 'Dettes fournisseurs',
        amount: Math.abs(creances),
      });
    }

    // TVA à payer (estimation)
    const tvaEstimee = (totalCredits * 0.2) / 1.2 - (totalDebits * 0.2) / 1.2;
    if (tvaEstimee > 0) {
      dettes.push({
        code: '4457',
        label: 'TVA à décaisser (estimée)',
        amount: tvaEstimee,
      });
    }

    const totalActif =
      actifImmobilise.reduce((s, l) => s + l.amount, 0) +
      actifCirculant.reduce((s, l) => s + l.amount, 0);

    const totalPassif =
      capitauxPropres.reduce((s, l) => s + l.amount, 0) +
      dettes.reduce((s, l) => s + l.amount, 0);

    return {
      actifImmobilise,
      actifCirculant,
      capitauxPropres,
      dettes,
      totalActif,
      totalPassif,
      resultat,
    };
  }, [creditTransactions, debitTransactions, selectedYear]);

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
            <Scale className="h-6 w-6" />
            Bilan Simplifié
          </h1>
          <p className="text-muted-foreground">
            Actif / Passif — Vue d&apos;aide à la décision
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

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          <strong>Bilan simplifié</strong> basé sur les flux de trésorerie. Le
          bilan officiel (normes PCG/IFRS) doit être établi par votre
          expert-comptable pour le dépôt au greffe du Tribunal de Commerce.
        </AlertDescription>
      </Alert>

      {/* KPIs */}
      <KpiGrid columns={3}>
        <KpiCard
          title="Total Actif"
          value={bilan.totalActif}
          valueType="money"
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiCard
          title="Total Passif"
          value={bilan.totalPassif}
          valueType="money"
          icon={<Landmark className="h-4 w-4" />}
        />
        <KpiCard
          title={bilan.resultat >= 0 ? 'Bénéfice' : 'Perte'}
          value={Math.abs(bilan.resultat)}
          valueType="money"
          icon={
            bilan.resultat >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          variant={bilan.resultat >= 0 ? 'success' : 'danger'}
        />
      </KpiGrid>

      {/* Bilan en 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ACTIF */}
        <Card>
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              ACTIF
            </CardTitle>
            <CardDescription className="text-blue-600">
              Ce que l&apos;entreprise possède
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Actif immobilisé */}
            {bilan.actifImmobilise.length > 0 && (
              <>
                <div className="px-4 py-2 bg-muted/30 text-sm font-semibold border-b">
                  Actif immobilisé
                </div>
                {bilan.actifImmobilise.map(line => (
                  <div
                    key={line.code}
                    className="flex justify-between px-4 py-3 border-b hover:bg-muted/20"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {line.code}
                      </Badge>
                      {line.label}
                    </span>
                    <Money amount={line.amount} size="sm" />
                  </div>
                ))}
              </>
            )}

            {/* Actif circulant */}
            <div className="px-4 py-2 bg-muted/30 text-sm font-semibold border-b">
              Actif circulant
            </div>
            {bilan.actifCirculant.map(line => (
              <div
                key={line.code}
                className="flex justify-between px-4 py-3 border-b hover:bg-muted/20"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {line.code}
                  </Badge>
                  {line.label}
                </span>
                <Money amount={line.amount} size="sm" />
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-blue-100 font-bold text-blue-800">
              <span>TOTAL ACTIF</span>
              <Money amount={bilan.totalActif} />
            </div>
          </CardContent>
        </Card>

        {/* PASSIF */}
        <Card>
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              PASSIF
            </CardTitle>
            <CardDescription className="text-purple-600">
              Ce que l&apos;entreprise doit
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Capitaux propres */}
            <div className="px-4 py-2 bg-muted/30 text-sm font-semibold border-b">
              Capitaux propres
            </div>
            {bilan.capitauxPropres.map(line => (
              <div
                key={line.code}
                className="flex justify-between px-4 py-3 border-b hover:bg-muted/20"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {line.code}
                  </Badge>
                  {line.label}
                </span>
                <Money amount={line.amount} colorize size="sm" />
              </div>
            ))}

            {/* Dettes */}
            {bilan.dettes.length > 0 && (
              <>
                <div className="px-4 py-2 bg-muted/30 text-sm font-semibold border-b">
                  Dettes
                </div>
                {bilan.dettes.map(line => (
                  <div
                    key={line.code}
                    className="flex justify-between px-4 py-3 border-b hover:bg-muted/20"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {line.code}
                      </Badge>
                      {line.label}
                    </span>
                    <Money
                      amount={line.amount}
                      className="text-red-600"
                      size="sm"
                    />
                  </div>
                ))}
              </>
            )}

            {/* Total */}
            <div className="flex justify-between px-4 py-3 bg-purple-100 font-bold text-purple-800">
              <span>TOTAL PASSIF</span>
              <Money amount={bilan.totalPassif} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
