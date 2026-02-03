/**
 * Base Hook: useSupabaseQuery
 *
 * Hook base pour queries Supabase read-only
 * Usage : Dashboard widgets, analytics, listes avec filtres
 *
 * Note: Ce hook est intentionnellement générique et utilise `any` pour
 * le query builder afin de supporter n'importe quelle table dynamiquement.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface QueryOptions<_T> {
  tableName: string;
  select?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: (query: any) => any;
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

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(options.tableName as any)
        .select(options.select ?? '*');

      // Apply filters
      if (options.filters) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dynamic query builder
        query = options.filters(query);
      }

      // Apply ordering
      if (options.orderBy) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dynamic query builder
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (options.limit) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dynamic query builder
        query = query.limit(options.limit);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dynamic query result
      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData((result as T[]) ?? []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Individual properties listed to avoid unnecessary re-renders
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
      void fetch().catch((error: unknown) => {
        console.error('[useSupabaseQuery] useEffect fetch failed:', error);
      });
    }
  }, [fetch, options.autoFetch]);

  return {
    data,
    loading,
    error,
    fetch,
    refetch: fetch,
  };
}
