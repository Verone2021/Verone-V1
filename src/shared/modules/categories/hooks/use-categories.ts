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

// Type pour catégories avec compteur de sous-catégories (computed field)
export interface CategoryWithCount extends Category {
  subcategory_count?: number
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [allCategories, setAllCategories] = useState<CategoryWithCount[]>([]) // Liste plate avec count
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCategories = async () => {
    try {
      setLoading(true)

      // Requête SQL pour obtenir le comptage réel des sous-catégories
      const { data, error } = await supabase
        .rpc('get_categories_with_real_counts')

      if (error) {
        // Fallback: requête manuelle avec deux étapes
        console.warn('RPC non disponible, utilisation de requête manuelle')

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('level')
          .order('display_order')

        if (categoriesError) throw categoriesError

        // Obtenir les comptages pour chaque catégorie
        const categoriesWithCount = await Promise.all(
          (categoriesData || []).map(async (category) => {
            const { count, error: countError } = await supabase
              .from('subcategories')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)

            if (countError) {
              console.error('Erreur comptage pour', category.name, countError)
              return { ...category, subcategory_count: 0 }
            }

            return { ...category, subcategory_count: count || 0 }
          })
        )

        setAllCategories(categoriesWithCount)
        const hierarchical = buildHierarchy(categoriesWithCount)
        setCategories(hierarchical)
        return
      }

      // Si la RPC fonctionne, utiliser les données directement
      const categoriesWithCount = data || []

      // Stocker la liste plate pour accès par family_id
      setAllCategories(categoriesWithCount)

      // Organiser en hiérarchie
      const hierarchical = buildHierarchy(categoriesWithCount)
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
      categoryMap.set(cat.id, { ...cat, children: [] } as any)
    })

    const roots: CategoryWithChildren[] = []

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!

      if (cat.family_id) {
        const parent = categoryMap.get(cat.family_id)
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

      if (error) {
        // Gestion spécifique des erreurs de contrainte unique
        if (error.code === '23505') {
          // Créer une erreur avec le code préservé pour le form
          const duplicateError: any = new Error('Une catégorie avec ce nom existe déjà dans cette famille. Veuillez choisir un nom différent.')
          duplicateError.code = '23505'
          throw duplicateError
        }
        throw error
      }

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
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const getCategoriesByFamily = (familyId: string): CategoryWithCount[] => {
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