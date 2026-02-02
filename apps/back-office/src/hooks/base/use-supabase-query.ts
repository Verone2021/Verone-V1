/**
 * Base Hook: useSupabaseQuery
 *
 * Hook base pour queries Supabase read-only
 * Usage : Dashboard widgets, analytics, listes avec filtres
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface QueryOptions<T> {
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

  const fetch = async () => {
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
  };

  useEffect(() => {
    if (options.autoFetch !== false) {
      void fetch().catch((error: unknown) => {
        console.error('[useSupabaseQuery] useEffect fetch failed:', error);
      });
    }
  }, [options.tableName]);

  return {
    data,
    loading,
    error,
    fetch,
    refetch: fetch,
  };
}
