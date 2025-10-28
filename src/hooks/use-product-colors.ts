/**
 * 🎨 Hook use-product-colors - Gestion dynamique des couleurs produits
 *
 * Permet de :
 * - Lister toutes les couleurs disponibles
 * - Rechercher couleurs avec autocomplete
 * - Créer nouvelles couleurs à la volée
 * - Cache local + invalidation temps réel
 *
 * Utilisation :
 * ```tsx
 * const { colors, searchColors, createColor, loading } = useProductColors()
 * ```
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ProductColor {
  id: string
  name: string
  hex_code?: string | null
  is_predefined: boolean
  created_at: string
}

interface UseProductColorsReturn {
  colors: ProductColor[]
  loading: boolean
  error: string | null
  searchColors: (query: string) => ProductColor[]
  createColor: (name: string, hexCode?: string) => Promise<ProductColor | null>
  refetch: () => void
}

/**
 * Hook principal pour gérer les couleurs produits
 */
export function useProductColors(): UseProductColorsReturn {
  const [colors, setColors] = useState<ProductColor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Charger toutes les couleurs
  const fetchColors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('product_colors')
        .select('*')
        .order('is_predefined', { ascending: false }) // Prédéfinies en premier
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setColors((data || []) as any)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('❌ Erreur chargement couleurs:', err)

      // Si la table n'existe pas, retourner couleurs par défaut
      if (errorMessage.includes('relation "product_colors" does not exist')) {
        console.warn('⚠️  Table product_colors inexistante, utilisation couleurs par défaut')
        setColors(getDefaultColors())
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Charger au montage
  useEffect(() => {
    fetchColors()
  }, [fetchColors])

  // Rechercher couleurs (filtrage local)
  const searchColors = useCallback((query: string): ProductColor[] => {
    if (!query.trim()) {
      return colors
    }

    const lowerQuery = query.toLowerCase().trim()

    return colors.filter(color =>
      color.name.toLowerCase().includes(lowerQuery)
    )
  }, [colors])

  // Créer nouvelle couleur
  const createColor = useCallback(async (
    name: string,
    hexCode?: string
  ): Promise<ProductColor | null> => {
    try {
      // Capitaliser première lettre
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

      const { data, error: insertError } = await supabase
        .from('product_colors')
        .insert({
          name: formattedName,
          hex_code: hexCode || null,
          is_predefined: false
        })
        .select()
        .single()

      if (insertError) {
        // Si couleur existe déjà, la retourner
        if (insertError.code === '23505') { // Violation contrainte unique
          const { data: existingColor } = await supabase
            .from('product_colors')
            .select('*')
            .ilike('name', formattedName)
            .single()

          if (existingColor) {
            return existingColor
          }
        }

        throw insertError
      }

      // Mettre à jour le cache local
      setColors(prev => [...prev, data] as any)

      return data
    } catch (err) {
      console.error('❌ Erreur création couleur:', err)
      return null
    }
  }, [supabase])

  // Forcer rechargement
  const refetch = useCallback(() => {
    fetchColors()
  }, [fetchColors])

  return {
    colors,
    loading,
    error,
    searchColors,
    createColor,
    refetch
  }
}

/**
 * Couleurs par défaut (fallback si table inexistante)
 */
function getDefaultColors(): ProductColor[] {
  return [
    { id: '1', name: 'Noir', hex_code: '#000000', is_predefined: true, created_at: new Date().toISOString() },
    { id: '2', name: 'Blanc', hex_code: '#FFFFFF', is_predefined: true, created_at: new Date().toISOString() },
    { id: '3', name: 'Gris', hex_code: '#6B7280', is_predefined: true, created_at: new Date().toISOString() },
    { id: '4', name: 'Beige', hex_code: '#F5F5DC', is_predefined: true, created_at: new Date().toISOString() },
    { id: '5', name: 'Taupe', hex_code: '#8B7D6B', is_predefined: true, created_at: new Date().toISOString() },
    { id: '6', name: 'Bleu', hex_code: '#2563EB', is_predefined: true, created_at: new Date().toISOString() },
    { id: '7', name: 'Vert', hex_code: '#16A34A', is_predefined: true, created_at: new Date().toISOString() },
    { id: '8', name: 'Rouge', hex_code: '#DC2626', is_predefined: true, created_at: new Date().toISOString() },
    { id: '9', name: 'Rose', hex_code: '#EC4899', is_predefined: true, created_at: new Date().toISOString() },
    { id: '10', name: 'Jaune', hex_code: '#FACC15', is_predefined: true, created_at: new Date().toISOString() },
    { id: '11', name: 'Marron', hex_code: '#92400E', is_predefined: true, created_at: new Date().toISOString() },
    { id: '12', name: 'Or', hex_code: '#D97706', is_predefined: true, created_at: new Date().toISOString() },
    { id: '13', name: 'Argent', hex_code: '#9CA3AF', is_predefined: true, created_at: new Date().toISOString() },
    { id: '14', name: 'Bronze', hex_code: '#CD7F32', is_predefined: true, created_at: new Date().toISOString() },
    { id: '15', name: 'Transparent', hex_code: '#F3F4F6', is_predefined: true, created_at: new Date().toISOString() }
  ]
}

/**
 * Hook pour récupérer les couleurs déjà utilisées dans un groupe de variantes
 * Utile pour filtrer les options disponibles lors de la création d'un nouveau produit
 */
export function useGroupUsedColors(groupId?: string, variantType: 'color' | 'material' = 'color') {
  const [usedColors, setUsedColors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchUsedColors = useCallback(async () => {
    if (!groupId) {
      setUsedColors([])
      return
    }

    try {
      setLoading(true)

      // Récupérer tous les produits du groupe
      const { data: products, error } = await supabase
        .from('products')
        .select('variant_attributes')
        .eq('variant_group_id', groupId)

      if (error) {
        console.error('❌ Erreur récupération couleurs utilisées:', error)
        return
      }

      // Extraire les valeurs de variante selon le type
      const usedValues: string[] = []

      if (products) {
        for (const product of products) {
          const attrs = product.variant_attributes as Record<string, any>
          const value = attrs?.[variantType]

          if (value && typeof value === 'string') {
            usedValues.push(value)
          }
        }
      }

      setUsedColors(usedValues)
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des couleurs utilisées:', err)
    } finally {
      setLoading(false)
    }
  }, [groupId, variantType, supabase])

  useEffect(() => {
    fetchUsedColors()
  }, [fetchUsedColors])

  return {
    usedColors,
    loading,
    refetch: fetchUsedColors
  }
}

/**
 * Hook simplifié pour sélection couleur dans formulaires
 * Inclut debounce de recherche et gestion état création
 */
export function useColorSelection(initialValue?: string, excludeColors?: string[]) {
  const { colors, searchColors, createColor, loading } = useProductColors()
  const [selectedColor, setSelectedColor] = useState<string>(initialValue || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Couleurs filtrées (avec exclusion si nécessaire)
  const filteredColors = useMemo(() => {
    const allColors = searchColors(searchQuery)

    // Filtrer les couleurs exclues
    if (excludeColors && excludeColors.length > 0) {
      return allColors.filter(color =>
        !excludeColors.some(excluded =>
          excluded.toLowerCase() === color.name.toLowerCase()
        )
      )
    }

    return allColors
  }, [searchColors, searchQuery, excludeColors])

  // Vérifier si couleur existe
  const colorExists = useMemo(() => {
    if (!searchQuery.trim()) return true
    return colors.some(c => c.name.toLowerCase() === searchQuery.toLowerCase().trim())
  }, [colors, searchQuery])

  // Créer couleur et sélectionner
  const handleCreateAndSelect = useCallback(async () => {
    if (!searchQuery.trim() || colorExists) return

    setIsCreating(true)

    try {
      const newColor = await createColor(searchQuery)

      if (newColor) {
        setSelectedColor(newColor.name)
        setSearchQuery('')
      }
    } finally {
      setIsCreating(false)
    }
  }, [searchQuery, colorExists, createColor])

  return {
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    filteredColors,
    colorExists,
    handleCreateAndSelect,
    isCreating,
    loading
  }
}
