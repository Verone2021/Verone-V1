/**
 * Base Hook: useSupabaseQuery (Query Builder API)
 *
 * Hook base pour queries Supabase read-only avec API orientée objet
 * Usage : Dashboard widgets, analytics, listes avec filtres
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

type SupabaseQuery = Record<string, unknown> & {
  order: (...args: unknown[]) => SupabaseQuery;
  limit: (...args: unknown[]) => SupabaseQuery;
  then: (...args: unknown[]) => unknown;
};

export interface QueryOptions<_T> {
  tableName: string;
  select?: string;
  filters?: (query: SupabaseQuery) => SupabaseQuery;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  autoFetch?: boolean;
}

export interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T>(options: QueryOptions<T>): QueryState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX: useMemo garantit createClient() appelé une seule fois par instance
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(options.tableName)
        .select(options.select ?? '*') as unknown as SupabaseQuery;

      // Apply filters
      if (options.filters) {
        query = options.filters(query);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: fetchError } =
        await (query as unknown as Promise<{
          data: T[] | null;
          error: { message: string } | null;
        }>);

      if (fetchError) throw new Error(fetchError.message);

      setData(result ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error(
        `[useSupabaseQuery] Error fetching ${options.tableName}:`,
        err
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supabase,
    options.tableName,
    options.select,
    options.filters,
    options.orderBy,
    options.limit,
  ]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      void fetchData();
    }
  }, [options.autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    fetch: fetchData,
    refetch: fetchData,
  };
}
