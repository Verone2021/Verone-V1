'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { createClient } from '@verone/utils/supabase/client';

interface QueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  sloThreshold?: number; // Seuil SLO personnalisable (défaut 2000ms)
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface MutationState<T> {
  mutate: (variables: any) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    staleTime: number;
  };
}

const queryCache: QueryCache = {};

export function useSupabaseQuery<T = any>(
  queryKey: string,
  queryFn: (
    supabase: ReturnType<typeof createClient>
  ) => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): QueryState<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>({
    data: null,
    loading: enabled,
    error: null,
  });

  // ✅ Singleton déjà mémorisé - pas besoin de useMemo
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = queryCache[queryKey];
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setState({
        data: cached.data,
        loading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const startTime = performance.now();
      const result = await queryFn(supabase);
      const loadTime = performance.now() - startTime;

      // Performance monitoring selon SLO Vérone (seuil configurable)
      const sloLimit = options.sloThreshold ?? 2000;
      if (loadTime > sloLimit) {
        console.warn(
          `⚠️ SLO query dépassé: ${queryKey} ${Math.round(loadTime)}ms > ${sloLimit}ms`
        );
      }

      if (result.error) {
        setState({
          data: null,
          loading: false,
          error: result.error.message || 'Erreur inconnue',
        });
      } else {
        // Cache the result
        queryCache[queryKey] = {
          data: result.data,
          timestamp: Date.now(),
          staleTime,
        };

        setState({
          data: result.data,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error(`Erreur query ${queryKey}:`, error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }, [queryKey, queryFn, enabled, supabase, staleTime]);

  useEffect(() => {
    fetchData();
  }, [queryKey, enabled]); // Éviter boucle infinie - ne pas inclure fetchData

  // Optional: refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus]); // Éviter boucle infinie - ne pas inclure fetchData

  const refetch = useCallback(async () => {
    // Clear cache for this query
    delete queryCache[queryKey];
    await fetchData();
  }, [queryKey, fetchData]);

  return {
    ...state,
    refetch,
  };
}

export function useSupabaseMutation<T = any>(
  mutationFn: (
    supabase: ReturnType<typeof createClient>,
    variables: any
  ) => Promise<{ data: T | null; error: any }>
): MutationState<T> {
  const [state, setState] = useState({
    loading: false,
    error: null,
  });

  // ✅ Singleton déjà mémorisé - pas besoin de useMemo
  const supabase = createClient();

  const mutate = useCallback(
    async (variables: any): Promise<T | null> => {
      setState({ loading: true, error: null });

      try {
        const result = await mutationFn(supabase, variables);

        if (result.error) {
          setState({
            loading: false,
            error: result.error.message || 'Erreur mutation',
          });
          return null;
        }

        setState({
          loading: false,
          error: null,
        });

        // Invalidate related cache entries
        Object.keys(queryCache).forEach(key => {
          if (key.includes('products') || key.includes('catalogue')) {
            delete queryCache[key];
          }
        });

        return result.data;
      } catch (error) {
        console.error('Erreur mutation:', error);
        setState({
          loading: false,
          error: (error instanceof Error
            ? error.message
            : 'Erreur inconnue') as any,
        });
        return null;
      }
    },
    [mutationFn, supabase]
  );

  return {
    mutate,
    ...state,
  };
}

// Helper pour requêtes avec filtres standardisés
export function useSupabaseTable<T = any>(
  tableName: string,
  filters: Record<string, any> = {},
  options: QueryOptions & {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  } = {}
): QueryState<T[]> {
  const { select = '*', orderBy, limit, offset, ...queryOptions } = options;

  const queryKey = `table:${tableName}:${JSON.stringify({ filters, select, orderBy, limit, offset })}`;

  const queryFn = useCallback(
    async (supabase: ReturnType<typeof createClient>) => {
      let query = supabase.from(tableName as any).select(select) as any;

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (limit) {
        const start = offset || 0;
        query = query.range(start, start + limit - 1);
      }

      return await query;
    },
    [tableName, select, filters, orderBy, limit, offset]
  );

  return useSupabaseQuery<T[]>(queryKey, queryFn as any, queryOptions);
}

// Cache cleanup utility
export function clearQueryCache(pattern?: string) {
  if (pattern) {
    Object.keys(queryCache).forEach(key => {
      if (key.includes(pattern)) {
        delete queryCache[key];
      }
    });
  } else {
    Object.keys(queryCache).forEach(key => {
      delete queryCache[key];
    });
  }
}
