/**
 * Base Hook: useSupabaseMutation
 *
 * Hook base pour mutations Supabase (create, update, delete)
 * Gère toasts, error handling, callbacks onSuccess/onError
 */

'use client';

import { useState, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'react-hot-toast';

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

  // ✅ FIX: useMemo garantit createClient() appelé une seule fois par instance
  const supabase = useMemo(() => createClient(), []);

  const create = async (data: Partial<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: createError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(options.tableName as any)
        .insert([data])
        .select()
        .single();

      if (createError) {
        // Handle duplicate constraint
        if (createError.code === '23505') {
          throw new Error('Un élément avec ces valeurs existe déjà');
        }
        throw createError;
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: updateError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(options.tableName as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(options.tableName as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

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
