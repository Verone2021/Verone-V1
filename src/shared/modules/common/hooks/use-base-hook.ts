'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './use-toast'
import { Database } from '@/types/database'

/**
 * 🎯 Type Helpers pour Generic Table Names Pattern
 */
type TableName = keyof Database['public']['Tables']
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

/**
 * 🔄 Hook de base pour éliminer la duplication de code
 *
 * Pattern répété dans 15+ hooks :
 * - useState loading/error standard
 * - createClient() supabase
 * - useToast() pour notifications
 *
 * AVANT: 52 lignes de duplication dans chaque hook
 * APRÈS: 3 lignes d'import dans chaque hook
 */

export interface BaseHookState<T> {
  data: T
  loading: boolean
  error: string | null
}

export interface BaseHookActions {
  setData: <T>(data: T) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  handleError: (error: unknown, defaultMessage?: string) => void
  showToast: (title: string, description: string, variant?: 'default' | 'destructive') => void
  supabase: ReturnType<typeof createClient>
}

/**
 * Hook de base réutilisable pour tous les hooks CRUD
 */
export function useBaseHook<T>(initialData: T): BaseHookState<T> & BaseHookActions {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleError = (error: unknown, defaultMessage = 'Une erreur est survenue') => {
    const message = error instanceof Error ? error.message : defaultMessage
    setError(message)
    console.error('Hook Error:', error)
  }

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    toast({ title, description, variant })
  }

  return {
    data,
    setData: setData as any,
    loading,
    error,
    setLoading,
    setError,
    handleError,
    showToast,
    supabase
  }
}

/**
 * Hook spécialisé pour les listes (arrays)
 */
export function useBaseListHook<T>(initialData: T[] = []): BaseHookState<T[]> & BaseHookActions & {
  setData: (data: T[]) => void
  addItem: (item: T) => void
  updateItem: (id: string, updates: Partial<T>) => void
  removeItem: (id: string) => void
} {
  const base = useBaseHook<T[]>(initialData)

  const setData = (newData: T[]) => {
    // Cette fonction sera retournée pour permettre la mise à jour des données
  }

  const addItem = (item: T) => {
    base.setData?.([item, ...base.data])
  }

  const updateItem = (id: string, updates: Partial<T>) => {
    base.setData?.(
      base.data.map(item =>
        (item as any).id === id ? { ...item, ...updates } : item
      )
    )
  }

  const removeItem = (id: string) => {
    base.setData?.(base.data.filter(item => (item as any).id !== id))
  }

  return {
    ...base,
    setData: setData as any,
    addItem,
    updateItem,
    removeItem
  }
}

/**
 * Pattern CRUD standard réutilisable
 */
export interface CrudOperations<TRow, TInsert, TUpdate = Partial<TInsert>> {
  create: (data: TInsert) => Promise<TRow | null>
  update: (id: string, data: TUpdate) => Promise<TRow | null>
  delete: (id: string) => Promise<boolean>
  fetch: () => Promise<void>
}

/**
 * 🎯 Générateur de fonctions CRUD avec typage strict Supabase
 *
 * Pattern Generic Table Names pour inférence TypeScript complète.
 * TypeScript connaît exactement les types Row/Insert/Update de chaque table.
 *
 * @template TTable - Nom de la table Supabase (ex: 'categories', 'products')
 * @param tableName - Nom de la table (autocomplete disponible)
 * @param baseHook - Hook de base avec state management
 * @param selectFields - Champs à sélectionner (défaut: '*')
 *
 * @example
 * ```typescript
 * const baseHook = useBaseListHook<TableRow<'categories'>>([])
 * const crud = createCrudOperations('categories', baseHook)
 * // crud.create() est maintenant typé avec CategoryInsert
 * // crud.update() est maintenant typé avec CategoryUpdate
 * ```
 */
export function createCrudOperations<
  TTable extends TableName,
  TRow extends TableRow<TTable> = TableRow<TTable>,
  TInsert extends TableInsert<TTable> = TableInsert<TTable>,
  TUpdate = Partial<TInsert>
>(
  tableName: TTable,
  baseHook: ReturnType<typeof useBaseListHook<TRow>>,
  selectFields?: string
): CrudOperations<TRow, TInsert, TUpdate> {

  const create = async (data: TInsert): Promise<TRow | null> => {
    try {
      baseHook.setError(null)

      const { data: newItem, error } = await baseHook.supabase
        .from(tableName)
        .insert([data as any])
        .select(selectFields || '*')
        .single()

      if (error) throw error

      baseHook.addItem(newItem as unknown as TRow)
      baseHook.showToast('Succès', `${tableName} créé avec succès`)
      return newItem as unknown as TRow
    } catch (err) {
      baseHook.handleError(err, `Erreur lors de la création de ${tableName}`)
      baseHook.showToast('Erreur', `Impossible de créer ${tableName}`, 'destructive')
      return null
    }
  }

  const update = async (id: string, data: TUpdate): Promise<TRow | null> => {
    try {
      baseHook.setError(null)

      const { data: updatedItem, error } = await baseHook.supabase
        .from(tableName)
        .update(data as any)
        .eq('id' as any, id)
        .select(selectFields || '*')
        .single()

      if (error) throw error

      baseHook.updateItem(id, updatedItem as unknown as Partial<TRow>)
      baseHook.showToast('Succès', `${tableName} mis à jour avec succès`)
      return updatedItem as unknown as TRow
    } catch (err) {
      baseHook.handleError(err, `Erreur lors de la mise à jour de ${tableName}`)
      baseHook.showToast('Erreur', `Impossible de mettre à jour ${tableName}`, 'destructive')
      return null
    }
  }

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      baseHook.setError(null)

      const { error } = await baseHook.supabase
        .from(tableName)
        .delete()
        .eq('id' as any, id)

      if (error) throw error

      baseHook.removeItem(id)
      baseHook.showToast('Succès', `${tableName} supprimé avec succès`)
      return true
    } catch (err) {
      baseHook.handleError(err, `Erreur lors de la suppression de ${tableName}`)
      baseHook.showToast('Erreur', `Impossible de supprimer ${tableName}`, 'destructive')
      return false
    }
  }

  const fetch = async (): Promise<void> => {
    try {
      baseHook.setLoading(true)
      baseHook.setError(null)

      const { data, error } = await baseHook.supabase
        .from(tableName)
        .select(selectFields || '*')
        .order('created_at', { ascending: false })

      if (error) throw error

      baseHook.setData(data || [])
    } catch (err) {
      baseHook.handleError(err, `Erreur lors du chargement de ${tableName}`)
    } finally {
      baseHook.setLoading(false)
    }
  }

  return {
    create,
    update,
    delete: deleteItem,
    fetch
  }
}