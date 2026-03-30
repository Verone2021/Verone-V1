'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  useBankReconciliation,
  calculateVAT,
  type BankTransaction,
} from '@verone/finance';

import type { PreClotureCheck } from './types';

export function useClotureData() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear - 1));
  const [exporting, setExporting] = useState<string | null>(null);

  const { creditTransactions, debitTransactions, loading } =
    useBankReconciliation();

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

  return {
    currentYear,
    selectedYear,
    setSelectedYear,
    exporting,
    loading,
    yearTransactions,
    checks,
    years,
    handleExportFec,
    handleExportJustificatifs,
  };
}
