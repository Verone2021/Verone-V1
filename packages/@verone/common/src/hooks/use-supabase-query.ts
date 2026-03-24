'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import type { PostgrestError } from '@supabase/supabase-js';
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

interface MutationState<T, V = unknown> {
  mutate: (variables: V) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}

interface QueryCache {
  [key: string]: {
    data: unknown;
    timestamp: number;
    staleTime: number;
  };
}

const queryCache: QueryCache = {};

export function useSupabaseQuery<T = unknown>(
  queryKey: string,
  queryFn: (
    supabase: ReturnType<typeof createClient>
  ) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: QueryOptions = {}
): QueryState<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    // cacheTime reserved for future use
  } = options;

  const [state, setState] = useState<Omit<QueryState<T>, 'refetch'>>({
    data: null,
    loading: enabled,
    error: null,
  });

  // ✅ FIX: useMemo garantit createClient() appelé une seule fois par instance
  const supabase = useMemo(() => createClient(), []);

  // ✅ FIX: useRef stabilise queryFn (inline = nouvelle ref chaque render)
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = queryCache[queryKey];
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setState({
        data: cached.data as T,
        loading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const startTime = performance.now();
      const result = await queryFnRef.current(supabase);
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
          error: result.error.message ?? 'Erreur inconnue',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options.sloThreshold is stable config, queryFn stabilized via useRef
  }, [queryKey, enabled, supabase, staleTime]);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData excluded to prevent infinite loop
  }, [queryKey, enabled]);

  // Optional: refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      void fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData excluded to prevent infinite loop
  }, [refetchOnWindowFocus]);

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

export function useSupabaseMutation<T = unknown, V = unknown>(
  mutationFn: (
    supabase: ReturnType<typeof createClient>,
    variables: V
  ) => Promise<{ data: T | null; error: PostgrestError | Error | null }>
): MutationState<T, V> {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  // ✅ FIX: useMemo garantit createClient() appelé une seule fois par instance
  const supabase = useMemo(() => createClient(), []);

  // ✅ FIX: useRef stabilise mutationFn (inline = nouvelle ref chaque render → boucle infinie)
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setState({ loading: true, error: null });

      try {
        const result = await mutationFnRef.current(supabase, variables);

        if (result.error) {
          setState({
            loading: false,
            error: result.error.message ?? 'Erreur mutation',
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
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        return null;
      }
    },
    [supabase]
  );

  return {
    mutate,
    ...state,
  };
}

// Helper pour requêtes avec filtres standardisés
export function useSupabaseTable<T = unknown>(
  tableName: string,
  filters: Record<string, unknown> = {},
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
      // Dynamic table name requires type assertion for Supabase generic constraints
      // Dynamic table name requires type assertion for Supabase generic constraints
      type DynamicQuery = {
        in: (col: string, values: unknown[]) => DynamicQuery;
        ilike: (col: string, pattern: string) => DynamicQuery;
        eq: (col: string, value: unknown) => DynamicQuery;
        order: (col: string, opts: { ascending?: boolean }) => DynamicQuery;
        range: (from: number, to: number) => DynamicQuery;
        then: Promise<{
          data: T[] | null;
          error: PostgrestError | null;
        }>['then'];
      };
      let query = (
        supabase as unknown as {
          from: (t: string) => { select: (s: string) => DynamicQuery };
        }
      )
        .from(tableName)
        .select(select);

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
        const start = offset ?? 0;
        query = query.range(start, start + limit - 1);
      }

      return await (query as unknown as Promise<{
        data: T[] | null;
        error: PostgrestError | null;
      }>);
    },
    [tableName, select, filters, orderBy, limit, offset]
  );

  return useSupabaseQuery<T[]>(queryKey, queryFn as never, queryOptions);
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
