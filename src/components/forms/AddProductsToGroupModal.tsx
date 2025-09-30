"use client"

import { useState, useEffect, useMemo } from 'react'
import { X, Search, Plus, Check, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import type { VariantGroup, VariantType } from '@/types/variant-groups'

interface AddProductsToGroupModalProps {
  isOpen: boolean
  onClose: () => void
  variantGroup: VariantGroup
  onProductsAdded: () => void
}

interface Product {
  id: string
  name: string
  sku: string
  status: string
  subcategory_id: string
  image_url?: string
}

export function AddProductsToGroupModal({
  isOpen,
  onClose,
  variantGroup,
  onProductsAdded
}: AddProductsToGroupModalProps) {
  const supabase = createClient()

  // États
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    familyId: 'all',
    categoryId: 'all',
    subcategoryId: 'all'
  })
  const [variantAttributes, setVariantAttributes] = useState<Record<string, string>>({})

  // Hooks hiérarchie
  const { families } = useFamilies()
  const { getCategoriesByFamily } = useCategories()
  const { getSubcategoriesByCategory } = useSubcategories()

  // Filtres calculés
  const filteredCategories = useMemo(() => {
    if (filters.familyId === 'all') return []
    return getCategoriesByFamily(filters.familyId)
  }, [filters.familyId, getCategoriesByFamily])

  const filteredSubcategories = useMemo(() => {
    if (filters.categoryId === 'all') return []
    return []
  }, [filters.categoryId])

  // Récupérer produits disponibles
  useEffect(() => {
    if (!isOpen) return

    const fetchProducts = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('products')
          .select('id, name, sku, status, subcategory_id')
          .is('variant_group_id', null)
          .eq('status', 'active')
          .order('name', { ascending: true })

        if (filters.subcategoryId !== 'all') {
          query = query.eq('subcategory_id', filters.subcategoryId)
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error('Erreur fetch produits:', error)
          return
        }

        // Récupérer images
        const productsWithImages = await Promise.all(
          (data || []).map(async (product) => {
            const { data: images } = await supabase
              .from('product_images')
              .select('public_url')
              .eq('product_id', product.id)
              .order('display_order', { ascending: true })
              .limit(1)

            return {
              ...product,
              image_url: images?.[0]?.public_url
            }
          })
        )

        setProducts(productsWithImages)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [isOpen, filters, search, supabase])

  // Toggle sélection produit
  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Ajouter produits au groupe
  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) return

    setLoading(true)
    try {
      // Récupérer product_count actuel du groupe
      const { data: groupData } = await supabase
        .from('variant_groups')
        .select('product_count')
        .eq('id', variantGroup.id)
        .single()

      const currentCount = groupData?.product_count || 0

      // Mettre à jour chaque produit
      for (let i = 0; i < selectedProductIds.length; i++) {
        const productId = selectedProductIds[i]
        const attributes = variantAttributes[productId] || {}

        await supabase
          .from('products')
          .update({
            variant_group_id: variantGroup.id,
            variant_position: currentCount + i + 1,
            variant_attributes: Object.keys(attributes).length > 0 ? attributes : null
          })
          .eq('id', productId)
      }

      // Mettre à jour product_count du groupe
      await supabase
        .from('variant_groups')
        .update({
          product_count: currentCount + selectedProductIds.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantGroup.id)

      onProductsAdded()
      onClose()
    } catch (err) {
      console.error('Erreur ajout produits:', err)
    } finally {
      setLoading(false)
    }
  }

  // Champ attribut variante selon type
  const renderVariantAttributeField = (productId: string) => {
    if (!variantGroup.variant_type) return null

    const attributeKey = variantGroup.variant_type
    const value = variantAttributes[productId]?.[attributeKey] || ''

    const labels: Record<VariantType, string> = {
      color: 'Couleur',
      size: 'Taille',
      material: 'Matériau',
      pattern: 'Motif'
    }

    return (
      <div className="mt-2">
        <Label className="text-xs text-gray-600">{labels[variantGroup.variant_type]}</Label>
        <Input
          type="text"
          placeholder={`Ex: ${variantGroup.variant_type === 'color' ? 'Rouge' : variantGroup.variant_type === 'size' ? 'L' : 'Coton'}`}
          value={value}
          onChange={(e) => {
            setVariantAttributes(prev => ({
              ...prev,
              [productId]: {
                ...prev[productId],
                [attributeKey]: e.target.value
              }
            }))
          }}
          className="mt-1 h-8 text-sm"
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">Ajouter des produits au groupe</DialogTitle>
          <DialogDescription>
            Groupe: <span className="font-medium">{variantGroup.name}</span>
            {variantGroup.variant_type && (
              <Badge variant="outline" className="ml-2">
                Type: {variantGroup.variant_type}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Filtres et recherche */}
        <div className="space-y-3 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={filters.familyId}
              onChange={(e) => setFilters({ familyId: e.target.value, categoryId: 'all', subcategoryId: 'all' })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Toutes les familles</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>{family.name}</option>
              ))}
            </select>

            <select
              value={filters.categoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: 'all' }))}
              disabled={filters.familyId === 'all'}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="all">Toutes les catégories</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <select
              value={filters.subcategoryId}
              onChange={(e) => setFilters(prev => ({ ...prev, subcategoryId: e.target.value }))}
              disabled={filters.categoryId === 'all'}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="all">Toutes les sous-catégories</option>
              {/* Les sous-catégories seront chargées dynamiquement */}
            </select>
          </div>
        </div>

        {/* Liste produits */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Package className="h-12 w-12 mb-2" />
              <p>Aucun produit disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-2">
              {products.map((product) => {
                const isSelected = selectedProductIds.includes(product.id)
                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProduct(product.id)}
                        className="mt-1"
                      />

                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">SKU: {product.sku}</p>

                        {isSelected && renderVariantAttributeField(product.id)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedProductIds.length} produit{selectedProductIds.length !== 1 ? 's' : ''} sélectionné{selectedProductIds.length !== 1 ? 's' : ''}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedProductIds.length === 0 || loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter {selectedProductIds.length > 0 && `(${selectedProductIds.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}