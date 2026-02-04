/**
 * Base Hook: useSupabaseMutation
 *
 * Hook base pour mutations Supabase (create, update, delete)
 * Gère toasts, error handling, callbacks onSuccess/onError
 *
 * Note: This hook accepts any table name dynamically.
 * Type safety is enforced at the call site through the generic T parameter.
 */

'use client';

import { useState, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'react-hot-toast';

/**
 * Response type from Supabase mutations
 */
interface MutationResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Generic Supabase client type that accepts dynamic table names.
 * This is necessary because the generated Database types create strict
 * literal unions that cause "Type instantiation is excessively deep" errors
 * when used with generic table name parameters.
 */
interface DynamicSupabaseClient {
  from: (table: string) => {
    insert: (data: Record<string, unknown>[]) => {
      select: () => {
        single: () => Promise<MutationResponse<unknown>>;
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string
      ) => {
        select: () => {
          single: () => Promise<MutationResponse<unknown>>;
        };
      };
    };
    delete: () => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

export interface MutationOptions<T> {
  tableName: string;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: string) => void;
}

export interface MutationState<T> {
  loading: boolean;
  error: string | null;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<void>;
}

export function useSupabaseMutation<T>(
  options: MutationOptions<T>
): MutationState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useMemo garantit createClient() appelé une seule fois par instance
  // Cast to DynamicSupabaseClient to avoid deep type recursion with 100+ table union
  const supabase = useMemo(
    () => createClient() as unknown as DynamicSupabaseClient,
    []
  );

  const create = async (data: Partial<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: createError } = await supabase
        .from(options.tableName)
        .insert([data as Record<string, unknown>])
        .select()
        .single();

      if (createError) {
        // Handle duplicate constraint
        if (createError.code === '23505') {
          throw new Error('Un élément avec ces valeurs existe déjà');
        }
        throw new Error(createError.message);
      }

      if (!result) {
        throw new Error('Aucune donnée retournée après création');
      }

      toast.success('Créé avec succès');

      if (options.onSuccess) {
        await options.onSuccess(result as T);
      }

      return result as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur création';
      setError(message);
      toast.error(message);

      if (options.onError) {
        options.onError(message);
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: updateError } = await supabase
        .from(options.tableName)
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      if (!result) {
        throw new Error('Aucune donnée retournée après modification');
      }

      toast.success('Modifié avec succès');

      if (options.onSuccess) {
        await options.onSuccess(result as T);
      }

      return result as T;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur modification';
      setError(message);
      toast.error(message);

      if (options.onError) {
        options.onError(message);
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from(options.tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw new Error(deleteError.message);

      toast.success('Supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression';
      setError(message);
      toast.error(message);

      if (options.onError) {
        options.onError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    create,
    update,
    delete: deleteItem,
  };
}
