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
    const yearInt = parseInt(selectedYear);
    const isExerciceClos = yearInt < currentYear;

    return [
      // === SECTION 1 : Enregistrements comptables ===
      {
        id: 'transactions',
        label: 'Transactions bancaires enregistrees',
        description: `${total} transactions trouvees pour ${selectedYear}`,
        status: total > 0 ? 'pass' : 'fail',
        detail:
          total === 0
            ? 'Aucune transaction — impossible de cloturer'
            : `${yearTransactions.credits.length} recettes, ${yearTransactions.debits.length} depenses`,
      },
      {
        id: 'justificatifs',
        label: 'Justificatifs attaches',
        description: `${withAtt}/${total} transactions avec justificatif (${attachmentRate.toFixed(0)}%)`,
        status:
          attachmentRate >= 90
            ? 'pass'
            : attachmentRate >= 50
              ? 'warn'
              : 'fail',
        detail:
          attachmentRate < 90
            ? `${total - withAtt} justificatifs manquants — recommande : 90% minimum. Conservation obligatoire 10 ans (Art. L123-22)`
            : 'Taux de couverture satisfaisant',
      },
      {
        id: 'rapprochement_bancaire',
        label: 'Rapprochement bancaire',
        description:
          'Verifier que le solde comptable = solde bancaire au 31/12',
        status: 'warn',
        detail:
          'A verifier manuellement : comparer le solde Qonto au 31/12 avec le total des transactions enregistrees. Ecarts = operations non comptabilisees.',
      },

      // === SECTION 2 : Inventaire & Stock (OBLIGATOIRE commerce) ===
      {
        id: 'inventaire_stock',
        label: 'Inventaire physique du stock',
        description:
          'Comptage et valorisation de tous les produits au 31/12 (Art. L123-12 Code de commerce)',
        status: 'warn',
        detail:
          "OBLIGATOIRE pour les commercants. Compter physiquement chaque produit, valoriser au cout d'achat HT (methode PEPS ou CUMP). Le stock figure a l'actif du bilan. Voir /stocks/inventaire pour l'etat actuel.",
      },
      {
        id: 'variation_stock',
        label: 'Variation de stock comptabilisee',
        description:
          'Ecriture : Stock final - Stock initial = Variation (impacte le resultat)',
        status: 'warn',
        detail:
          "Si stock final > stock initial = produit (diminue les charges). Si stock final < stock initial = charge supplementaire. A comptabiliser par l'expert-comptable.",
      },

      // === SECTION 3 : Amortissements & Immobilisations ===
      {
        id: 'amortissements',
        label: 'Dotations aux amortissements',
        description:
          "Calculer l'amortissement annuel des immobilisations (mobilier, materiel, agencements)",
        status: 'warn',
        detail:
          "Voir /finance/immobilisations pour le plan d'amortissement. Les dotations reduisent le resultat imposable. Methode lineaire ou degressive selon le bien.",
      },

      // === SECTION 4 : Ecritures de regularisation (cut-off) ===
      {
        id: 'charges_constatees_avance',
        label: "Charges constatees d'avance (CCA)",
        description:
          'Charges payees en N qui concernent N+1 (ex: loyer, assurance, abonnements)',
        status: 'warn',
        detail:
          "Verifier si des charges de decembre concernent janvier+. Si oui, les neutraliser en CCA pour ne pas fausser le resultat. A traiter par l'expert-comptable.",
      },
      {
        id: 'factures_non_parvenues',
        label: 'Factures non parvenues (FNP)',
        description:
          "Charges de l'exercice dont la facture n'est pas encore arrivee",
        status: 'warn',
        detail:
          'Ex: marchandise recue en decembre, facture en janvier. A provisionner pour rattacher la charge au bon exercice. Verifier les commandes fournisseurs recues mais non facturees.',
      },

      // === SECTION 5 : Calculs fiscaux ===
      {
        id: 'resultat',
        label: "Resultat de l'exercice calcule",
        description: `Resultat net : ${yearTransactions.resultat >= 0 ? '+' : ''}${(yearTransactions.resultat / 100).toFixed(2)} EUR`,
        status: 'pass',
        detail: `Recettes: ${(yearTransactions.totalRecettes / 100).toFixed(2)} EUR — Depenses: ${(yearTransactions.totalDepenses / 100).toFixed(2)} EUR`,
      },
      {
        id: 'tva',
        label: 'TVA annuelle calculee',
        description: `TVA nette : ${(yearTransactions.tvaNette / 100).toFixed(2)} EUR`,
        status: 'pass',
        detail: `Collectee: ${(yearTransactions.tvaCollectee / 100).toFixed(2)} EUR — Deductible: ${(yearTransactions.tvaDeductible / 100).toFixed(2)} EUR. Voir /finance/documents/tva pour le detail mensuel.`,
      },
      {
        id: 'exercice_dates',
        label: "Dates de l'exercice",
        description: `01/01/${selectedYear} au 31/12/${selectedYear}`,
        status: isExerciceClos ? 'pass' : 'warn',
        detail: isExerciceClos
          ? `Exercice termine. Approbation des comptes avant le 30/06/${yearInt + 1}. Depot Greffe avant le 31/07/${yearInt + 1}.`
          : 'Exercice en cours — cloture anticipee impossible',
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
