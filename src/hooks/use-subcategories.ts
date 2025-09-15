"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Subcategory = Database['public']['Tables']['subcategories']['Row']
type SubcategoryInsert = Database['public']['Tables']['subcategories']['Insert']
type SubcategoryUpdate = Database['public']['Tables']['subcategories']['Update']

export interface SubcategoryWithDetails extends Subcategory {
  products_count?: number
  category?: {
    id: string
    name: string
    family_id: string
  }
}

export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<SubcategoryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSubcategories = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('subcategories')
        .select(`
          *,
          categories!subcategories_category_id_fkey(
            id,
            name,
            family_id
          )
        `)

      // Filtrer par catégorie si spécifiée
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
        .order('sort_order')
        .order('name')

      if (error) throw error

      // Transformer les données pour inclure les détails
      const subcategoriesWithDetails: SubcategoryWithDetails[] = (data || []).map(sub => ({
        ...sub,
        products_count: 0, // TODO: Calculer via join avec products si nécessaire
        category: sub.categories ? {
          id: sub.categories.id,
          name: sub.categories.name,
          family_id: sub.categories.family_id
        } : undefined
      }))

      setSubcategories(subcategoriesWithDetails)
    } catch (err) {
      console.error('❌ Erreur lors du chargement des sous-catégories:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const createSubcategory = async (subcategoryData: Omit<SubcategoryInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Générer slug unique à partir du nom
      const slug = generateSlug(subcategoryData.name)

      const { data, error } = await supabase
        .from('subcategories')
        .insert([{
          ...subcategoryData,
          slug,
          sort_order: subcategoryData.sort_order || 0
        }])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Sous-catégorie créée:', data.name)

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories()

      return data
    } catch (err) {
      console.error('❌ Erreur lors de la création de la sous-catégorie:', err)
      throw err
    }
  }

  const updateSubcategory = async (id: string, subcategoryData: SubcategoryUpdate) => {
    try {
      // Mettre à jour le slug si le nom change
      const updateData = { ...subcategoryData }
      if (subcategoryData.name) {
        updateData.slug = generateSlug(subcategoryData.name)
      }
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('subcategories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Sous-catégorie modifiée:', data.name)

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories()

      return data
    } catch (err) {
      console.error('❌ Erreur lors de la modification de la sous-catégorie:', err)
      throw err
    }
  }

  const deleteSubcategory = async (id: string) => {
    try {
      // TODO: Vérifier s'il y a des produits liés si table products existe
      // const { data: products, error: productsError } = await supabase
      //   .from('products')
      //   .select('id')
      //   .eq('subcategory_id', id)

      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)

      if (error) throw error

      console.log('✅ Sous-catégorie supprimée')

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories()
    } catch (err) {
      console.error('❌ Erreur lors de la suppression de la sous-catégorie:', err)
      throw err
    }
  }

  const toggleSubcategoryStatus = async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Sous-catégorie ${isActive ? 'activée' : 'désactivée'}:`, data.name)

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories()

      return data
    } catch (err) {
      console.error('❌ Erreur lors du changement de statut:', err)
      throw err
    }
  }

  const updateSubcategoryOrder = async (id: string, sortOrder: number) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update({
          sort_order: sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Ordre de la sous-catégorie mis à jour:', data.name)

      // Recharger les données pour synchroniser l'état
      await fetchSubcategories()

      return data
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour de l\'ordre:', err)
      throw err
    }
  }

  const getSubcategoriesByCategory = async (categoryId: string): Promise<SubcategoryWithDetails[]> => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories!subcategories_category_id_fkey(
            id,
            name,
            family_id
          )
        `)
        .eq('category_id', categoryId)
        .order('sort_order')
        .order('name')

      if (error) throw error

      return (data || []).map(sub => ({
        ...sub,
        products_count: 0,
        category: sub.categories ? {
          id: sub.categories.id,
          name: sub.categories.name,
          family_id: sub.categories.family_id
        } : undefined
      }))
    } catch (err) {
      console.error('❌ Erreur lors du chargement des sous-catégories par catégorie:', err)
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

  // Charger les sous-catégories au montage du hook
  useEffect(() => {
    fetchSubcategories()
  }, [categoryId])

  const refreshSubcategories = async () => {
    await fetchSubcategories()
  }

  return {
    subcategories,
    loading,
    error,
    fetchSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    updateSubcategoryOrder,
    getSubcategoriesByCategory,
    refreshSubcategories
  }
}