"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  level: number
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([]) // Liste plate pour accès par family_id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level')
        .order('display_order')

      if (error) throw error

      // Stocker la liste plate pour accès par family_id
      setAllCategories(data || [])

      // Organiser en hiérarchie
      const hierarchical = buildHierarchy(data || [])
      setCategories(hierarchical)
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const buildHierarchy = (categories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>()

    // Convertir en map avec level
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    const roots: CategoryWithChildren[] = []

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!

      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        }
      } else {
        roots.push(category)
      }
    })

    return roots
  }

  const createCategory = async (categoryData: Omit<CategoryInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Générer slug unique
      const slug = generateSlug(categoryData.name)

      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...categoryData, slug }])
        .select()
        .single()

      if (error) throw error

      // Recharger les données
      await fetchCategories()

      return data
    } catch (err) {
      console.error('Erreur lors de la création:', err)
      throw err
    }
  }

  const updateCategory = async (id: string, categoryData: CategoryUpdate) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...categoryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Recharger les données
      await fetchCategories()

      return data
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Recharger les données
      await fetchCategories()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      throw err
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-")
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const getCategoriesByFamily = (familyId: string): Category[] => {
    return allCategories.filter(category => category.family_id === familyId)
  }

  const refreshCategories = async () => {
    await fetchCategories()
  }

  return {
    categories,
    allCategories, // Liste plate pour accès par family_id
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByFamily,
    refreshCategories
  }
}