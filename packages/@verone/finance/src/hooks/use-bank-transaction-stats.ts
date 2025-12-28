/**
 * Hook: Bank Transaction Statistics
 * Description: Récupère les statistiques des transactions bancaires classifiées
 *
 * Ce hook utilise les VRAIES données :
 * - Table `bank_transactions` : transactions Qonto
 * - Table `matching_rules` : règles de classification
 * - Vue `v_matching_rules_with_org` : règles avec organisations
 *
 * Retourne :
 * - Stats globales (total entrées/sorties, solde)
 * - Évolution mensuelle (pour AreaChart/BarChart)
 * - Répartition par organisation (pour DonutChart)
 * - Transactions récentes
 */

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface BankTransactionStats {
  // Totaux
  totalCredit: number; // Entrées
  totalDebit: number; // Sorties
  netBalance: number; // Solde net
  transactionCount: number;

  // Comparaison mois précédent
  creditVariation: number; // % variation entrées
  debitVariation: number; // % variation sorties

  // Période (null si "Tout" sélectionné)
  periodStart: string | null;
  periodEnd: string | null;
}

export interface MonthlyEvolution {
  month: string; // YYYY-MM
  monthLabel: string; // "Jan", "Fév", etc.
  credit: number; // Entrées
  debit: number; // Sorties
  balance: number; // Net
  // Index signature for Recharts compatibility
  [key: string]: string | number;
}

export interface OrganisationBreakdown {
  organisationId: string | null;
  organisationName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  category: string | null; // default_category de la règle
  // Index signature for Recharts compatibility
  [key: string]: string | number | null;
}

export interface CategoryBreakdown {
  code: string; // Code PCG (ex: "627")
  label: string; // Libellé (ex: "Services bancaires")
  parentCode: string; // Classe parente (ex: "62")
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  // Index signature for Recharts compatibility
  [key: string]: string | number;
}

export interface RecentTransaction {
  id: string;
  label: string;
  amount: number;
  side: 'credit' | 'debit';
  settledAt: string | null;
  counterpartyName: string | null;
  matchedOrganisation: string | null;
  category: string | null;
}

// =====================================================================
// OPTIONS
// =====================================================================

export interface BankTransactionStatsOptions {
  /** Nombre de mois à récupérer (par défaut 12) - ignoré si startDate/endDate fournis */
  months?: number;
  /** Date de début optionnelle */
  startDate?: Date | null;
  /** Date de fin optionnelle */
  endDate?: Date | null;
}

// =====================================================================
// HOOK
// =====================================================================

export function useBankTransactionStats(
  options: BankTransactionStatsOptions = {}
) {
  const {
    months = 12,
    startDate: filterStartDate,
    endDate: filterEndDate,
  } = options;

  const [stats, setStats] = useState<BankTransactionStats | null>(null);
  const [evolution, setEvolution] = useState<MonthlyEvolution[]>([]);
  const [organisationBreakdown, setOrganisationBreakdown] = useState<
    OrganisationBreakdown[]
  >([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategoryBreakdown[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ==========================================================================
  // FIX: Gestion correcte du filtre "Tout" (null, null)
  // Quand les deux dates sont null, on ne filtre PAS par date
  // ==========================================================================
  const isAllTime = filterStartDate === null && filterEndDate === null;

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let startDateStr: string | null = null;
  let endDateStr: string | null = null;

  if (isAllTime) {
    // "Tout" sélectionné : pas de filtre de date
    startDate = null;
    endDate = null;
    startDateStr = null;
    endDateStr = null;
  } else if (filterStartDate && filterEndDate) {
    startDate = filterStartDate;
    endDate = filterEndDate;
    startDateStr = startDate.toISOString().split('T')[0];
    endDateStr = endDate.toISOString().split('T')[0];
  } else if (filterStartDate) {
    startDate = filterStartDate;
    endDate = new Date();
    startDateStr = startDate.toISOString().split('T')[0];
    endDateStr = endDate.toISOString().split('T')[0];
  } else if (filterEndDate) {
    endDate = filterEndDate;
    startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months);
    startDateStr = startDate.toISOString().split('T')[0];
    endDateStr = endDate.toISOString().split('T')[0];
  } else {
    // Fallback avec months (ne devrait pas arriver si isAllTime est bien géré)
    endDate = new Date();
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDateStr = startDate.toISOString().split('T')[0];
    endDateStr = endDate.toISOString().split('T')[0];
  }

  // Mois précédent pour comparaison
  const prevMonthStart = new Date();
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  prevMonthStart.setDate(1);
  const prevMonthEnd = new Date(
    prevMonthStart.getFullYear(),
    prevMonthStart.getMonth() + 1,
    0
  );

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer toutes les transactions de la période
      // FIX: Ne pas filtrer par date si isAllTime = true
      let query = supabase
        .from('bank_transactions')
        .select(
          `
          id,
          label,
          amount,
          side,
          settled_at,
          emitted_at,
          counterparty_name,
          matching_status,
          matched_document_id
        `
        )
        .order('settled_at', { ascending: false });

      // Appliquer les filtres de date SEULEMENT si on n'est pas en mode "Tout"
      if (startDateStr && endDateStr) {
        query = query
          .gte('settled_at', startDateStr)
          .lte('settled_at', endDateStr);
      }

      const { data: transactions, error: txError } = await query;

      if (txError) throw txError;

      // 2. Récupérer les règles de matching avec organisations
      const { data: rules, error: rulesError } = await supabase
        .from('v_matching_rules_with_org')
        .select('*')
        .eq('enabled', true);

      if (rulesError) throw rulesError;

      // Créer un map des règles pour matching rapide
      const rulesMap = new Map<
        string,
        {
          organisationId: string | null;
          organisationName: string | null;
          category: string | null;
        }
      >();

      rules?.forEach((rule: any) => {
        const key = rule.match_value?.toLowerCase() || '';
        rulesMap.set(key, {
          organisationId: rule.organisation_id,
          organisationName: rule.organisation_name || rule.display_label,
          category: rule.default_category,
        });
      });

      // 3. Fonction de matching
      const matchTransaction = (label: string) => {
        const labelLower = label.toLowerCase();
        for (const [matchValue, ruleData] of rulesMap.entries()) {
          if (labelLower.includes(matchValue)) {
            return ruleData;
          }
        }
        return null;
      };

      // 4. Calculer les stats globales
      let totalCredit = 0;
      let totalDebit = 0;
      let currentMonthCredit = 0;
      let currentMonthDebit = 0;
      let prevMonthCredit = 0;
      let prevMonthDebit = 0;

      const monthlyData: Record<string, { credit: number; debit: number }> = {};
      const orgData: Record<
        string,
        { name: string; total: number; count: number; category: string | null }
      > = {};

      const enrichedTransactions: RecentTransaction[] = [];

      transactions?.forEach((tx: any) => {
        const amount = Math.abs(tx.amount);
        const isCredit = tx.side === 'credit';
        const settledDate = tx.settled_at
          ? new Date(tx.settled_at)
          : new Date(tx.emitted_at);
        const month =
          tx.settled_at?.substring(0, 7) || tx.emitted_at?.substring(0, 7);

        // Totaux globaux
        if (isCredit) {
          totalCredit += amount;
        } else {
          totalDebit += amount;
        }

        // Données mensuelles
        if (month) {
          if (!monthlyData[month]) {
            monthlyData[month] = { credit: 0, debit: 0 };
          }
          if (isCredit) {
            monthlyData[month].credit += amount;
          } else {
            monthlyData[month].debit += amount;
          }
        }

        // Comparaison mois en cours vs mois précédent
        if (settledDate >= currentMonthStart) {
          if (isCredit) currentMonthCredit += amount;
          else currentMonthDebit += amount;
        } else if (
          settledDate >= prevMonthStart &&
          settledDate <= prevMonthEnd
        ) {
          if (isCredit) prevMonthCredit += amount;
          else prevMonthDebit += amount;
        }

        // Matching avec règles pour répartition par organisation
        const matchedRule = matchTransaction(tx.label);
        const orgKey = matchedRule?.organisationId || 'unclassified';
        const orgName = matchedRule?.organisationName || 'Non classé';

        // Seulement les débits pour la répartition dépenses
        if (!isCredit) {
          if (!orgData[orgKey]) {
            orgData[orgKey] = {
              name: orgName,
              total: 0,
              count: 0,
              category: matchedRule?.category || null,
            };
          }
          orgData[orgKey].total += amount;
          orgData[orgKey].count += 1;
        }

        // Transactions enrichies
        enrichedTransactions.push({
          id: tx.id,
          label: tx.label,
          amount: tx.amount,
          side: tx.side,
          settledAt: tx.settled_at,
          counterpartyName: tx.counterparty_name,
          matchedOrganisation: matchedRule?.organisationName || null,
          category: matchedRule?.category || null,
        });
      });

      // 5. Calculer variations
      const creditVariation =
        prevMonthCredit > 0
          ? ((currentMonthCredit - prevMonthCredit) / prevMonthCredit) * 100
          : currentMonthCredit > 0
            ? 100
            : 0;

      const debitVariation =
        prevMonthDebit > 0
          ? ((currentMonthDebit - prevMonthDebit) / prevMonthDebit) * 100
          : currentMonthDebit > 0
            ? 100
            : 0;

      // 6. Formater l'évolution mensuelle
      const monthNames = [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Août',
        'Sep',
        'Oct',
        'Nov',
        'Déc',
      ];

      let cumulativeBalance = 0;
      const evolutionArray: MonthlyEvolution[] = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => {
          cumulativeBalance += data.credit - data.debit;
          const monthIndex = parseInt(month.split('-')[1], 10) - 1;
          return {
            month,
            monthLabel: monthNames[monthIndex],
            credit: data.credit,
            debit: data.debit,
            balance: cumulativeBalance,
          };
        });

      // 7. Formater la répartition par organisation
      const totalExpenses = Object.values(orgData).reduce(
        (sum, org) => sum + org.total,
        0
      );

      const breakdownArray: OrganisationBreakdown[] = Object.entries(orgData)
        .map(([orgId, data]) => ({
          organisationId: orgId === 'unclassified' ? null : orgId,
          organisationName: data.name,
          totalAmount: data.total,
          transactionCount: data.count,
          percentage:
            totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
          category: data.category,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      // 7b. Formater la répartition par catégorie PCG
      // Utilise les catégories PCG importées
      const PCG_LABELS: Record<string, { label: string; parentCode: string }> =
        {
          '60': { label: 'Achats', parentCode: '6' },
          '61': { label: 'Services extérieurs', parentCode: '6' },
          '62': { label: 'Autres services', parentCode: '6' },
          '63': { label: 'Impôts et taxes', parentCode: '6' },
          '64': { label: 'Charges personnel', parentCode: '6' },
          '65': { label: 'Autres charges', parentCode: '6' },
          '66': { label: 'Charges financières', parentCode: '6' },
          '67': { label: 'Charges except.', parentCode: '6' },
          // Comptes niveau 2 courants
          '607': { label: 'Achats marchandises', parentCode: '60' },
          '613': { label: 'Locations', parentCode: '61' },
          '616': { label: 'Assurances', parentCode: '61' },
          '622': { label: 'Honoraires', parentCode: '62' },
          '623': { label: 'Publicité/Marketing', parentCode: '62' },
          '624': { label: 'Transports', parentCode: '62' },
          '625': { label: 'Déplacements', parentCode: '62' },
          '626': { label: 'Télécoms', parentCode: '62' },
          '627': { label: 'Frais bancaires', parentCode: '62' },
          '651': { label: 'Licences/SaaS', parentCode: '65' },
          unclassified: { label: 'Non classé', parentCode: '' },
        };

      // Agréger par catégorie PCG
      const categoryData: Record<string, { total: number; count: number }> = {};

      Object.entries(orgData).forEach(([, data]) => {
        const cat = data.category || 'unclassified';
        // Prendre le compte de niveau 2 (3 premiers chiffres) ou le code complet
        const catCode = cat.length >= 3 ? cat.substring(0, 3) : cat;

        if (!categoryData[catCode]) {
          categoryData[catCode] = { total: 0, count: 0 };
        }
        categoryData[catCode].total += data.total;
        categoryData[catCode].count += data.count;
      });

      const categoryArray: CategoryBreakdown[] = Object.entries(categoryData)
        .map(([code, data]) => {
          const info = PCG_LABELS[code] || {
            label: `Compte ${code}`,
            parentCode: code.substring(0, 2),
          };
          return {
            code,
            label: info.label,
            parentCode: info.parentCode,
            totalAmount: data.total,
            transactionCount: data.count,
            percentage:
              totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
          };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount);

      // 8. Mettre à jour les states
      setStats({
        totalCredit,
        totalDebit,
        netBalance: totalCredit - totalDebit,
        transactionCount: transactions?.length || 0,
        creditVariation,
        debitVariation,
        periodStart: startDateStr,
        periodEnd: endDateStr,
      });

      setEvolution(evolutionArray);
      setOrganisationBreakdown(breakdownArray);
      setCategoryBreakdown(categoryArray);
      setRecentTransactions(enrichedTransactions.slice(0, 20)); // Top 20
    } catch (err: any) {
      console.error('Error fetching bank transaction stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [supabase, startDateStr, endDateStr]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    evolution,
    organisationBreakdown,
    categoryBreakdown,
    recentTransactions,
    loading,
    error,
    refresh: fetchStats,
  };
}
