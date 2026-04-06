/**
 * Hook spécialisé pour la gestion de l'historique des mouvements de stock
 * Page dédiée avec filtres avancés, pagination et exports
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import { useStockMovements } from './use-stock-movements';
import { exportMovementsToCSV } from './use-movements-history.export';
import { queryMovements, queryStats } from './use-movements-history.fetcher';
import type {
  MovementHistoryFilters,
  MovementWithDetails,
  MovementsStats,
  UseMovementsHistoryOptions,
} from './use-movements-history.types';

export type {
  MovementHistoryFilters,
  MovementWithDetails,
  MovementsStats,
  UseMovementsHistoryOptions,
} from './use-movements-history.types';

export function useMovementsHistory(options?: UseMovementsHistoryOptions) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [stats, setStats] = useState<MovementsStats | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<MovementHistoryFilters>({
    affects_forecast: false,
    forecast_type: undefined,
    ...options?.initialFilters,
  });
  const { toast } = useToast();
  const { getReasonDescription } = useStockMovements();

  const supabase = createClient();

  const fetchMovements = useCallback(
    async (appliedFilters: MovementHistoryFilters = {}) => {
      setLoading(true);
      try {
        const result = await queryMovements(
          supabase,
          appliedFilters,
          getReasonDescription
        );
        setMovements(result.movements);
        setTotal(result.total);
      } catch (error) {
        console.error('Erreur lors de la récupération des mouvements:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer l'historique des mouvements",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast, getReasonDescription]
  );

  const fetchStats = useCallback(
    async (appliedFilters: MovementHistoryFilters = {}) => {
      try {
        const result = await queryStats(
          supabase,
          appliedFilters,
          getReasonDescription
        );
        setStats(result);
      } catch (error) {
        console.error(
          'Erreur lors de la récupération des statistiques:',
          error
        );
      }
    },
    [supabase, getReasonDescription]
  );

  // Chargement initial
  useEffect(() => {
    void fetchMovements(filters);
    void fetchStats(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chargement initial uniquement - éviter boucle infinie avec filters

  // Effet séparé pour les changements de filtres
  useEffect(() => {
    void fetchMovements(filters);
    void fetchStats(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]); // Stabiliser avec JSON.stringify

  const applyFilters = useCallback((newFilters: MovementHistoryFilters) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const exportMovements = useCallback(
    async (_format: 'csv' | 'excel' = 'csv') => {
      try {
        await exportMovementsToCSV(
          supabase,
          filters,
          getReasonDescription,
          toast
        );
      } catch (error) {
        console.error("Erreur lors de l'export:", error);
        toast({
          title: "Erreur d'export",
          description: "Impossible d'exporter les données",
          variant: 'destructive',
        });
      }
    },
    [supabase, filters, getReasonDescription, toast]
  );

  return {
    loading,
    movements,
    stats,
    total,
    filters,
    fetchMovements,
    fetchStats,
    applyFilters,
    resetFilters,
    exportMovements,
    hasFilters: Object.keys(filters).length > 0,
    pagination: {
      currentPage:
        Math.floor((filters.offset ?? 0) / (filters.limit ?? 50)) + 1,
      totalPages: Math.ceil(total / (filters.limit ?? 50)),
      pageSize: filters.limit ?? 50,
    },
  };
}
