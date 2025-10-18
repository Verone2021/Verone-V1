/**
 * 🎯 VÉRONE - Page Détail Sous-Catégorie
 *
 * Affiche tous les produits d'une sous-catégorie spécifique
 * Permet la navigation vers les détails produits et la gestion CRUD
 */

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Package, Grid3X3, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import { useProducts } from '@/hooks/use-products'
import { VéroneCard } from '@/components/ui/verone-card'
import type { Database } from '@/lib/supabase/types'

type Family = Database['public']['Tables']['families']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Subcategory = Database['public']['Tables']['subcategories']['Row']

export default function SubcategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subcategoryId = params.subcategoryId as string

  const { families, loading: familiesLoading } = useFamilies()
  const { allCategories, loading: categoriesLoading } = useCategories()
  const { subcategories, loading: subcategoriesLoading } = useSubcategories()

  // ✅ Hook pour charger les produits de la sous-catégorie
  const { products, loading: productsLoading } = useProducts(
    subcategoryId ? { subcategory_id: subcategoryId } : undefined
  )

  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [family, setFamily] = useState<Family | null>(null)

  useEffect(() => {
    if (subcategories && subcategoryId) {
      const foundSubcategory = subcategories.find(s => s.id === subcategoryId)
      setSubcategory(foundSubcategory || null)
    }
  }, [subcategories, subcategoryId])

  useEffect(() => {
    if (allCategories && subcategory?.category_id) {
      const foundCategory = allCategories.find(c => c.id === subcategory.category_id)
      setCategory(foundCategory || null)
    }
  }, [allCategories, subcategory])

  useEffect(() => {
    if (families && category?.family_id) {
      const foundFamily = families.find(f => f.id === category.family_id)
      setFamily(foundFamily || null)
    }
  }, [families, category])

  const loading = familiesLoading || categoriesLoading || subcategoriesLoading || productsLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!subcategory) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Sous-catégorie non trouvée</h1>
          <Button
            onClick={() => router.push('/produits/catalogue/categories')}
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au catalogue
          </Button>
        </div>
      </div>
    )
  }

  const handleProductClick = (productId: string) => {
    router.push(`/catalogue/${productId}`)
  }

  const handleBackToCategory = () => {
    if (category) {
      router.push(`/catalogue/categories/${category.id}`)
    } else {
      router.push('/produits/catalogue/categories')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToCategory}
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <span
                  className="hover:text-black cursor-pointer"
                  onClick={() => router.push('/produits/catalogue/categories')}
                >
                  Catalogue
                </span>
                <span>•</span>
                {family && (
                  <>
                    <span
                      className="hover:text-black cursor-pointer"
                      onClick={() => router.push(`/catalogue/families/${family.id}`)}
                    >
                      {family.name}
                    </span>
                    <span>•</span>
                  </>
                )}
                {category && (
                  <>
                    <span
                      className="hover:text-black cursor-pointer"
                      onClick={() => router.push(`/catalogue/categories/${category.id}`)}
                    >
                      {category.name}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-black font-medium">{subcategory.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-black">{subcategory.name}</h1>
              <div className="text-gray-600 mt-1">
                {products.length} produit{products.length !== 1 ? 's' : ''}
                {subcategory.is_active ? (
                  <Badge variant="outline" className="ml-2 border-black text-black">Actif</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 border-gray-500 text-gray-600">Inactif</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Description */}
        {subcategory.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-gray-700">{subcategory.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-bold text-black">{products.length}</p>
                  <p className="text-gray-600">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Grid3X3 className="w-8 h-8 text-black" />
                <div>
                  <p className="text-lg font-bold text-black">Ordre {subcategory.display_order || 0}</p>
                  <p className="text-gray-600">Position</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Tag className="w-8 h-8 text-black" />
                <div>
                  <Badge variant="outline" className="text-sm px-2 py-1 border-black text-black">
                    #{subcategory.slug}
                  </Badge>
                  <p className="text-gray-600 mt-1">Identifiant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-black" />
                <div>
                  <p className="text-sm font-bold text-black">
                    {new Date(subcategory.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-gray-600">Créée le</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Produits</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Vue grille
              </Button>
            </div>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun produit dans cette sous-catégorie</p>
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier produit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <VéroneCard
                  key={product.id}
                  title={product.name}
                  description={product.description || undefined}
                  imageUrl={product.primary_image_url || undefined}
                  entityType="product"
                  slug={product.sku || undefined}
                  isActive={product.status !== 'discontinued'}
                  iconPosition="top-right"
                  onClick={() => handleProductClick(product.id)}
                  className="xl:max-w-sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}