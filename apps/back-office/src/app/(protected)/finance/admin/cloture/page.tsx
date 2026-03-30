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

import { Alert, AlertDescription, Card, CardContent } from '@verone/ui';
import { KpiCard, KpiGrid } from '@verone/ui-business';
import {
  Info,
  TrendingUp,
  TrendingDown,
  Calculator,
  FileText,
} from 'lucide-react';

import { ClotureChecks } from './components/ClotureChecks';
import { ClotureExports } from './components/ClotureExports';
import { ClotureHeader } from './components/ClotureHeader';
import { ClotureRecap } from './components/ClotureRecap';
import { useClotureData } from './hooks';

export default function CloturePage() {
  const {
    selectedYear,
    setSelectedYear,
    exporting,
    loading,
    yearTransactions,
    checks,
    years,
    handleExportFec,
    handleExportJustificatifs,
  } = useClotureData();

  return (
    <div className="space-y-6">
      <ClotureHeader
        selectedYear={selectedYear}
        years={years}
        onYearChange={setSelectedYear}
      />

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

          <ClotureChecks checks={checks} selectedYear={selectedYear} />

          <ClotureExports
            selectedYear={selectedYear}
            totalTransactions={yearTransactions.totalTransactions}
            withAttachments={yearTransactions.withAttachments}
            exporting={exporting}
            onExportFec={() => {
              void handleExportFec();
            }}
            onExportJustificatifs={() => {
              void handleExportJustificatifs();
            }}
          />

          <ClotureRecap
            selectedYear={selectedYear}
            totalRecettes={yearTransactions.totalRecettes}
            totalDepenses={yearTransactions.totalDepenses}
            resultat={yearTransactions.resultat}
            tvaCollectee={yearTransactions.tvaCollectee}
            tvaDeductible={yearTransactions.tvaDeductible}
            tvaNette={yearTransactions.tvaNette}
          />
        </>
      )}
    </div>
  );
}
