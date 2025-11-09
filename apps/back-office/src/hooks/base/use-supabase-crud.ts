/**
 * Base Hook: useSupabaseCRUD
 *
 * Hook CRUD complet (Query + Mutations) pour pattern standard
 * Auto-refresh après mutations
 *
 * Usage: Tables simples avec CRUD standard sans logique métier complexe
 */

'use client';

import {
  useSupabaseMutation,
  type MutationOptions,
} from './use-supabase-mutation';
import { useSupabaseQuery, type QueryOptions } from './use-supabase-query';

export interface CRUDOptions<T> extends QueryOptions<T>, MutationOptions<T> {}

export function useSupabaseCRUD<T>(options: CRUDOptions<T>) {
  const query = useSupabaseQuery<T>(options);
  const mutation = useSupabaseMutation<T>(options);

  return {
    // Query state
    data: query.data,
    loading: query.loading || mutation.loading,
    error: query.error || mutation.error,

    // Query actions
    fetch: query.fetch,
    refetch: query.refetch,

    // Mutation actions (with auto-refresh)
    create: async (data: Partial<T>) => {
      const result = await mutation.create(data);
      if (result) {
        await query.refetch(); // Auto-refresh after create
      }
      return result;
    },
    update: async (id: string, data: Partial<T>) => {
      const result = await mutation.update(id, data);
      if (result) {
        await query.refetch(); // Auto-refresh after update
      }
      return result;
    },
    delete: async (id: string) => {
      await mutation.delete(id);
      await query.refetch(); // Auto-refresh after delete
    },
  };
}
