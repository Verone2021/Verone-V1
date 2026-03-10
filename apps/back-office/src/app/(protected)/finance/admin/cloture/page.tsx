'use client';

/**
 * Clôture d'Exercice Comptable
 *
 * Workflow de clôture annuelle :
 * 1. Vérification pré-clôture (justificatifs, rapprochement)
 * 2. Calcul du résultat net
 * 3. Export FEC pour expert-comptable
 * 4. Archivage des pièces justificatives
 * 5. Marquage de l'exercice comme clôturé
 *
 * Note: La clôture officielle est effectuée par l'expert-comptable.
 * Cette page prépare les éléments nécessaires.
 */

import { useState, useMemo, useCallback } from 'react';

import {
  useBankReconciliation,
  calculateVAT,
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
  Button,
  Progress,
} from '@verone/ui';
import { KpiCard, KpiGrid, Money } from '@verone/ui-business';
import {
  Lock,
  Calendar,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Shield,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type CheckStatus = 'pass' | 'warn' | 'fail' | 'pending';

interface PreClotureCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
}

// =====================================================================
// PAGE
// =====================================================================

export default function CloturePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear - 1));
  const [exporting, setExporting] = useState<string | null>(null);

  const { creditTransactions, debitTransactions, loading } =
    useBankReconciliation();

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    const filterByYear = (txs: BankTransaction[]) =>
      txs.filter(tx => {
        const date = tx.settled_at ?? tx.emitted_at;
        return date?.startsWith(selectedYear);
      });

    const credits = filterByYear(creditTransactions);
    const debits = filterByYear(debitTransactions);

    const totalRecettes = credits.reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const totalDepenses = debits.reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const resultat = totalRecettes - totalDepenses;

    const tvaCollectee = credits.reduce(
      (s, tx) =>
        s +
        calculateVAT(
          Math.abs(tx.amount),
          ((tx as BankTransaction & { vat_rate?: number }).vat_rate ?? 0) as
            | 0
            | 5.5
            | 10
            | 20
        ),
      0
    );
    const tvaDeductible = debits.reduce(
      (s, tx) =>
        s +
        calculateVAT(
          Math.abs(tx.amount),
          ((tx as BankTransaction & { vat_rate?: number }).vat_rate ?? 0) as
            | 0
            | 5.5
            | 10
            | 20
        ),
      0
    );

    // Count transactions with attachments
    const withAttachments = [...credits, ...debits].filter(
      tx =>
        (tx as BankTransaction & { has_attachment?: boolean }).has_attachment
    ).length;

    return {
      credits,
      debits,
      totalRecettes,
      totalDepenses,
      resultat,
      tvaCollectee,
      tvaDeductible,
      tvaNette: tvaCollectee - tvaDeductible,
      totalTransactions: credits.length + debits.length,
      withAttachments,
    };
  }, [creditTransactions, debitTransactions, selectedYear]);

  // Pre-cloture checks
  const checks = useMemo((): PreClotureCheck[] => {
    const total = yearTransactions.totalTransactions;
    const withAtt = yearTransactions.withAttachments;
    const attachmentRate = total > 0 ? (withAtt / total) * 100 : 0;

    return [
      {
        id: 'transactions',
        label: 'Transactions bancaires',
        description: `${total} transactions trouvées pour ${selectedYear}`,
        status: total > 0 ? 'pass' : 'fail',
        detail:
          total === 0
            ? 'Aucune transaction — impossible de clôturer'
            : `${yearTransactions.credits.length} recettes, ${yearTransactions.debits.length} dépenses`,
      },
      {
        id: 'justificatifs',
        label: 'Justificatifs attachés',
        description: `${withAtt}/${total} transactions avec justificatif (${attachmentRate.toFixed(0)}%)`,
        status:
          attachmentRate >= 90
            ? 'pass'
            : attachmentRate >= 50
              ? 'warn'
              : 'fail',
        detail:
          attachmentRate < 90
            ? `${total - withAtt} justificatifs manquants — recommandé : 90% minimum`
            : 'Taux de couverture satisfaisant',
      },
      {
        id: 'resultat',
        label: "Résultat de l'exercice calculé",
        description: `Résultat net : ${yearTransactions.resultat >= 0 ? '+' : ''}${(yearTransactions.resultat / 100).toFixed(2)} €`,
        status: 'pass',
        detail: `Recettes: ${(yearTransactions.totalRecettes / 100).toFixed(2)} € — Dépenses: ${(yearTransactions.totalDepenses / 100).toFixed(2)} €`,
      },
      {
        id: 'tva',
        label: 'TVA calculée',
        description: `TVA nette : ${(yearTransactions.tvaNette / 100).toFixed(2)} €`,
        status: 'pass',
        detail: `Collectée: ${(yearTransactions.tvaCollectee / 100).toFixed(2)} € — Déductible: ${(yearTransactions.tvaDeductible / 100).toFixed(2)} €`,
      },
      {
        id: 'exercice_dates',
        label: "Dates de l'exercice",
        description: `01/01/${selectedYear} au 31/12/${selectedYear}`,
        status: parseInt(selectedYear) < currentYear ? 'pass' : 'warn',
        detail:
          parseInt(selectedYear) >= currentYear
            ? 'Exercice en cours — clôture anticipée'
            : 'Exercice terminé',
      },
    ];
  }, [yearTransactions, selectedYear, currentYear]);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const overallStatus =
    failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  // Export FEC
  const handleExportFec = useCallback(async () => {
    setExporting('fec');
    try {
      const response = await fetch(
        `/api/finance/export-fec?year=${selectedYear}`
      );
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? 'Erreur export FEC');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        response.headers
          .get('Content-Disposition')
          ?.split('filename="')[1]
          ?.replace('"', '') ?? `FEC${selectedYear}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Cloture] FEC export error:', err);
    } finally {
      setExporting(null);
    }
  }, [selectedYear]);

  // Export justificatifs ZIP
  const handleExportJustificatifs = useCallback(async () => {
    setExporting('justificatifs');
    try {
      const response = await fetch(
        `/api/finance/export-justificatifs?year=${selectedYear}`
      );
      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? 'Erreur export justificatifs');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `justificatifs-${selectedYear}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Cloture] Justificatifs export error:', err);
    } finally {
      setExporting(null);
    }
  }, [selectedYear]);

  const years = Array.from(
    { length: currentYear - 2022 },
    (_, i) => currentYear - i
  );

  const StatusIcon = ({ status }: { status: CheckStatus }) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Clôture d&apos;exercice
          </h1>
          <p className="text-muted-foreground">
            Préparation de la clôture comptable annuelle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  Exercice {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 text-sm">
          <strong>Outil de préparation.</strong> La clôture officielle des
          comptes doit être effectuée par votre expert-comptable. Cette page
          vous aide à préparer les éléments nécessaires et vérifier la
          complétude des données.
        </AlertDescription>
      </Alert>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">
                Analyse de l&apos;exercice {selectedYear}...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs exercice */}
          <KpiGrid columns={4}>
            <KpiCard
              title="Chiffre d'affaires"
              value={yearTransactions.totalRecettes}
              valueType="money"
              icon={<TrendingUp className="h-4 w-4" />}
              variant="success"
            />
            <KpiCard
              title="Total dépenses"
              value={yearTransactions.totalDepenses}
              valueType="money"
              icon={<TrendingDown className="h-4 w-4" />}
              variant="danger"
            />
            <KpiCard
              title={
                yearTransactions.resultat >= 0 ? 'Bénéfice net' : 'Perte nette'
              }
              value={Math.abs(yearTransactions.resultat)}
              valueType="money"
              icon={<Calculator className="h-4 w-4" />}
              variant={yearTransactions.resultat >= 0 ? 'success' : 'danger'}
            />
            <KpiCard
              title="Transactions"
              value={yearTransactions.totalTransactions}
              valueType="number"
              icon={<FileText className="h-4 w-4" />}
            />
          </KpiGrid>

          {/* Vérifications pré-clôture */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Vérifications pré-clôture
                  </CardTitle>
                  <CardDescription>
                    Contrôles automatiques avant clôture de l&apos;exercice{' '}
                    {selectedYear}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    overallStatus === 'pass'
                      ? 'default'
                      : overallStatus === 'warn'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className={
                    overallStatus === 'pass' ? 'bg-green-600' : undefined
                  }
                >
                  {passCount}/{checks.length} OK
                  {warnCount > 0 ? ` • ${warnCount} avert.` : ''}
                  {failCount > 0 ? ` • ${failCount} bloquant(s)` : ''}
                </Badge>
              </div>
              <Progress
                value={(passCount / checks.length) * 100}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {checks.map(check => (
                <div
                  key={check.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <StatusIcon status={check.status} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{check.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {check.description}
                    </div>
                    {check.detail && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {check.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions d'export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exports pour l&apos;expert-comptable
              </CardTitle>
              <CardDescription>
                Générez les fichiers nécessaires à la clôture officielle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export FEC */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">
                      Fichier des Écritures Comptables (FEC)
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export normalisé Art. A.47 A-1 du Livre des Procédures
                    Fiscales. 18 colonnes obligatoires, format tab-séparé UTF-8.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      - {yearTransactions.totalTransactions} écritures
                      comptables
                    </li>
                    <li>- Format : SIREN + FEC + YYYYMMDD.txt</li>
                    <li>- Obligatoire en cas de contrôle fiscal</li>
                  </ul>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      void handleExportFec();
                    }}
                    disabled={
                      exporting !== null ||
                      yearTransactions.totalTransactions === 0
                    }
                  >
                    {exporting === 'fec' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Télécharger FEC {selectedYear}
                  </Button>
                </div>

                {/* Export justificatifs */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Archive justificatifs</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Archive ZIP de tous les justificatifs stockés pour
                    l&apos;exercice {selectedYear}. Conservation obligatoire 10
                    ans.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>
                      - {yearTransactions.withAttachments} justificatifs
                      disponibles
                    </li>
                    <li>- Format : ZIP (justificatifs-YYYY.zip)</li>
                    <li>
                      - Source : Supabase Storage bucket
                      &quot;justificatifs&quot;
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      void handleExportJustificatifs();
                    }}
                    disabled={exporting !== null}
                  >
                    {exporting === 'justificatifs' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Télécharger justificatifs {selectedYear}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Récapitulatif exercice */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Récapitulatif exercice {selectedYear}
              </CardTitle>
              <CardDescription>
                Synthèse des données comptables pour transmission à
                l&apos;expert-comptable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium border-b">
                  <div>Rubrique</div>
                  <div className="text-right">Montant</div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">
                    Chiffre d&apos;affaires (recettes TTC)
                  </div>
                  <div className="text-right">
                    <Money
                      amount={yearTransactions.totalRecettes}
                      className="text-green-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">Total dépenses TTC</div>
                  <div className="text-right">
                    <Money
                      amount={yearTransactions.totalDepenses}
                      className="text-red-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b bg-muted/30 font-bold">
                  <div>
                    Résultat brut (
                    {yearTransactions.resultat >= 0 ? 'bénéfice' : 'perte'})
                  </div>
                  <div className="text-right">
                    <Money amount={yearTransactions.resultat} colorize bold />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">TVA collectée</div>
                  <div className="text-right">
                    <Money amount={yearTransactions.tvaCollectee} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b">
                  <div className="text-sm">TVA déductible</div>
                  <div className="text-right">
                    <Money amount={yearTransactions.tvaDeductible} size="sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-3">
                  <div className="text-sm font-medium">
                    TVA nette (
                    {yearTransactions.tvaNette >= 0 ? 'à payer' : 'crédit'})
                  </div>
                  <div className="text-right">
                    <Money amount={yearTransactions.tvaNette} colorize />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
