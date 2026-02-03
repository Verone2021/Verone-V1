/**
 * Base Hook: useSupabaseQuery
 *
 * Hook base pour queries Supabase read-only
 * Usage : Dashboard widgets, analytics, listes avec filtres
 *
 * Note: This hook accepts any table name dynamically.
 * Type safety is enforced at the call site through the generic T parameter.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Generic query builder interface that matches Supabase's chainable API.
 * Used for type-safe filter functions without deep type recursion.
 */
interface SupabaseQueryBuilder {
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  neq: (column: string, value: unknown) => SupabaseQueryBuilder;
  gt: (column: string, value: unknown) => SupabaseQueryBuilder;
  gte: (column: string, value: unknown) => SupabaseQueryBuilder;
  lt: (column: string, value: unknown) => SupabaseQueryBuilder;
  lte: (column: string, value: unknown) => SupabaseQueryBuilder;
  like: (column: string, pattern: string) => SupabaseQueryBuilder;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder;
  is: (column: string, value: null | boolean) => SupabaseQueryBuilder;
  in: (column: string, values: unknown[]) => SupabaseQueryBuilder;
  contains: (column: string, value: unknown) => SupabaseQueryBuilder;
  containedBy: (column: string, value: unknown) => SupabaseQueryBuilder;
  or: (filters: string) => SupabaseQueryBuilder;
  not: (
    column: string,
    operator: string,
    value: unknown
  ) => SupabaseQueryBuilder;
  filter: (
    column: string,
    operator: string,
    value: unknown
  ) => SupabaseQueryBuilder;
  order: (
    column: string,
    options?: { ascending?: boolean }
  ) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => SupabaseQueryBuilder;
  maybeSingle: () => SupabaseQueryBuilder;
  then: <R>(
    onfulfilled?: (value: { data: unknown; error: unknown }) => R
  ) => Promise<R>;
}

/**
 * Generic Supabase client type that accepts dynamic table names.
 * This is necessary because the generated Database types create strict
 * literal unions that cause "Type instantiation is excessively deep" errors
 * when used with generic table name parameters.
 */
interface DynamicSupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => SupabaseQueryBuilder;
  };
}

export interface QueryOptions<_T> {
  tableName: string;
  select?: string;
  filters?: (query: SupabaseQueryBuilder) => SupabaseQueryBuilder;
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

  // useMemo garantit createClient() appelé une seule fois par instance
  // Cast to DynamicSupabaseClient to avoid deep type recursion with 100+ table union
  const supabase = useMemo(
    () => createClient() as unknown as DynamicSupabaseClient,
    []
  );

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(options.tableName)
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

      const { data: result, error: fetchError } = (await query) as {
        data: T[] | null;
        error: Error | null;
      };

      if (fetchError) throw fetchError;

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
    // Individual properties listed to avoid unnecessary re-renders
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
