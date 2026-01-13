/**
 * Hook Cash Flow Forecast - Donnees tresorerie 12 mois pour graphiques
 *
 * Recupere les flux financiers (entrees/sorties) sur 12 mois :
 * - Factures clients payees (incoming)
 * - Factures fournisseurs payees (outgoing)
 * - Balance calculee mois par mois
 *
 * @created 2026-01-12
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Types pour les donnees de tresorerie
export interface TreasuryDataPoint {
  month: string;
  incoming: number;
  outgoing: number;
  balance: number;
}

export interface CashFlowForecast {
  data: TreasuryDataPoint[];
  currentBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
}

export function useCashFlowForecast() {
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      // Date il y a 12 mois
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const startDate = twelveMonthsAgo.toISOString();

      // Recuperer les factures clients payees (incoming)
      const { data: incomingInvoices, error: inError } = await supabase
        .from('invoices')
        .select('total_ht, created_at')
        .gte('created_at', startDate)
        .eq('type', 'invoice')
        .eq('status', 'paid');

      if (inError) throw inError;

      // Recuperer les factures fournisseurs payees (outgoing)
      const { data: outgoingDocs, error: outError } = await supabase
        .from('financial_documents')
        .select('total_ttc, created_at')
        .gte('created_at', startDate)
        .eq('document_direction', 'outbound')
        .eq('status', 'paid');

      if (outError) throw outError;

      // Grouper par mois
      const monthsData: Record<string, { incoming: number; outgoing: number }> =
        {};

      // Initialiser les 12 derniers mois
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsData[monthKey] = { incoming: 0, outgoing: 0 };
      }

      // Agreger les entrees (incoming)
      (incomingInvoices || []).forEach(inv => {
        const date = new Date(inv.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData[monthKey]) {
          monthsData[monthKey].incoming += parseFloat(
            String(inv.total_ht || 0)
          );
        }
      });

      // Agreger les sorties (outgoing)
      (outgoingDocs || []).forEach(doc => {
        const date = new Date(doc.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsData[monthKey]) {
          monthsData[monthKey].outgoing += parseFloat(
            String(doc.total_ttc || 0)
          );
        }
      });

      // Convertir en tableau et calculer la balance cumulative
      let cumulativeBalance = 0;
      const data: TreasuryDataPoint[] = Object.entries(monthsData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, values]) => {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const monthLabel = date.toLocaleDateString('fr-FR', {
            month: 'short',
            year: '2-digit',
          });

          cumulativeBalance += values.incoming - values.outgoing;

          return {
            month: monthLabel,
            incoming: Math.round(values.incoming),
            outgoing: Math.round(values.outgoing),
            balance: Math.round(cumulativeBalance),
          };
        });

      // Calculer les totaux
      const totalIncoming = data.reduce((sum, d) => sum + d.incoming, 0);
      const totalOutgoing = data.reduce((sum, d) => sum + d.outgoing, 0);

      setForecast({
        data,
        currentBalance: cumulativeBalance,
        totalIncoming,
        totalOutgoing,
      });
    } catch (err) {
      console.error('[CashFlowForecast] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    forecast,
    isLoading,
    error,
    refetch: fetchData,
  };
}
