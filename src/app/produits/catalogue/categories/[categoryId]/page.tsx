/**
 * 🎯 VÉRONE - Page Détail Catégorie
 *
 * Affiche toutes les sous-catégories d'une catégorie spécifique
 * Permet la navigation vers les produits et la gestion CRUD
 */

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, FolderOpen, Package, Tag } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFamilies } from '@/hooks/use-families'
import { useCategories } from '@/hooks/use-categories'
import { useSubcategories } from '@/hooks/use-subcategories'
import { FamilyCrudForm } from '@/components/forms/FamilyCrudForm'
import { SubcategoryForm } from '@/components/forms/SubcategoryForm'
import { VéroneCard } from '@/components/ui/verone-card'
import type { Database } from '@/lib/supabase/types'

type Family = Database['public']['Tables']['families']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Subcategory = Database['public']['Tables']['subcategories']['Row']

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const { families, loading: familiesLoading } = useFamilies()
  const { allCategories, loading: categoriesLoading, updateCategory } = useCategories()
  const {
    subcategories,
    loading: subcategoriesLoading,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useSubcategories()

  const [category, setCategory] = useState<Category | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [categorySubcategories, setCategorySubcategories] = useState<Subcategory[]>([])

  // État des dialogues
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [isNewSubcategoryOpen, setIsNewSubcategoryOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [isEditSubcategoryOpen, setIsEditSubcategoryOpen] = useState(false)

  useEffect(() => {
    if (allCategories && categoryId) {
      const foundCategory = allCategories.find(c => c.id === categoryId)
      setCategory(foundCategory || null)
    }
  }, [allCategories, categoryId])

  useEffect(() => {
    if (families && category?.family_id) {
      const foundFamily = families.find(f => f.id === category.family_id)
      setFamily(foundFamily || null)
    }
  }, [families, category])

  useEffect(() => {
    if (subcategories && categoryId) {
      const subs = subcategories.filter(sub => sub.category_id === categoryId)
      setCategorySubcategories(subs)
    }
  }, [subcategories, categoryId])

  const loading = familiesLoading || categoriesLoading || subcategoriesLoading

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

  if (!category) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Catégorie non trouvée</h1>
          <ButtonV2
            onClick={() => router.push('/produits/catalogue/categories')}
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au catalogue
          </ButtonV2>
        </div>
      </div>
    )
  }

  const handleSubcategoryClick = (subcategoryId: string) => {
    router.push(`/catalogue/subcategories/${subcategoryId}`)
  }

  const handleBackToFamily = () => {
    if (family) {
      router.push(`/catalogue/families/${family.id}`)
    } else {
      router.push('/produits/catalogue/categories')
    }
  }

  // Gestionnaires CRUD pour catégorie
  const handleEditCategory = () => {
    setIsEditCategoryOpen(true)
  }

  const handleSubmitCategory = async (formData: any) => {
    try {
      await updateCategory(categoryId, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      })
      setIsEditCategoryOpen(false)
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error)
    }
  }

  // Gestionnaires CRUD pour sous-catégories
  const handleNewSubcategory = () => {
    setIsNewSubcategoryOpen(true)
  }

  const handleSubmitNewSubcategory = async (formData: any) => {
    try {
      await createSubcategory({
        name: formData.name,
        description: formData.description,
        category_id: categoryId,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      })
      setIsNewSubcategoryOpen(false)
    } catch (error) {
      console.error('Erreur lors de la création de la sous-catégorie:', error)
    }
  }

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setIsEditSubcategoryOpen(true)
  }

  const handleSubmitEditSubcategory = async (formData: any) => {
    if (!editingSubcategory) return

    try {
      await updateSubcategory(editingSubcategory.id, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      })
      setIsEditSubcategoryOpen(false)
      setEditingSubcategory(null)
    } catch (error) {
      console.error('Erreur lors de la modification de la sous-catégorie:', error)
    }
  }

  const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la sous-catégorie "${subcategoryName}" ? Cette action est irréversible.`)) {
      try {
        await deleteSubcategory(subcategoryId)
      } catch (error) {
        console.error('Erreur lors de la suppression de la sous-catégorie:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <ButtonV2
              onClick={handleBackToFamily}
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </ButtonV2>
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
                <span className="text-black font-medium">{category.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-black">{category.name}</h1>
              <p className="text-gray-600 mt-1">
                {categorySubcategories.length} sous-catégorie{categorySubcategories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ButtonV2
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={handleEditCategory}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </ButtonV2>
            <ButtonV2
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={handleNewSubcategory}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle sous-catégorie
            </ButtonV2>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-gray-700">{category.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-bold text-black">{categorySubcategories.length}</p>
                  <p className="text-gray-600">Sous-catégories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-bold text-black">
                    {categorySubcategories.reduce((sum, sub) => sum + (sub.products_count || 0), 0)}
                  </p>
                  <p className="text-gray-600">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Tag className="w-8 h-8 text-black" />
                <div>
                  <p className="text-lg font-bold text-black">Niveau {category.level || 1}</p>
                  <p className="text-gray-600">Hiérarchie</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-lg px-3 py-1 border-black text-black">
                  #{category.slug}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sous-catégories */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-black">Sous-catégories</h2>

          {categorySubcategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">Aucune sous-catégorie dans cette catégorie</p>
                <ButtonV2
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white"
                  onClick={handleNewSubcategory}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la première sous-catégorie
                </ButtonV2>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorySubcategories.map((subcategory) => (
                <VéroneCard
                  key={subcategory.id}
                  title={subcategory.name}
                  imageUrl={subcategory.image_url || undefined}
                  entityType="subcategory"
                  slug={subcategory.slug}
                  count={subcategory.products_count || 0}
                  countLabel="produit"
                  isActive={subcategory.is_active}
                  iconPosition="top-right"
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                  onEdit={() => handleEditSubcategory(subcategory)}
                  onDelete={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs CRUD */}
      {/* Modification catégorie */}
      <FamilyCrudForm
        isOpen={isEditCategoryOpen}
        onClose={() => setIsEditCategoryOpen(false)}
        type="category"
        mode="edit"
        initialData={category ? {
          id: category.id,
          name: category.name,
          description: category.description || '',
          is_active: category.is_active,
          display_order: category.display_order || 1,
          parent_id: category.family_id,
          image_url: category.image_url || undefined
        } : undefined}
        parentOptions={families?.map(f => ({ id: f.id, name: f.name })) || []}
        onSubmit={handleSubmitCategory}
      />

      {/* Nouvelle sous-catégorie */}
      <SubcategoryForm
        isOpen={isNewSubcategoryOpen}
        onClose={() => setIsNewSubcategoryOpen(false)}
        mode="create"
        categories={allCategories?.map(c => ({ id: c.id, name: c.name, family_name: family?.name || '' })) || []}
        onSubmit={(subcategory) => {
          // Adapter la réponse pour le hook useSubcategories
          handleSubmitNewSubcategory({
            name: subcategory.name,
            description: subcategory.description,
            category_id: subcategory.parent_id,
            is_active: subcategory.is_active,
            display_order: subcategory.display_order,
            image_url: subcategory.image_url
          })
        }}
      />

      {/* Modification sous-catégorie */}
      <SubcategoryForm
        isOpen={isEditSubcategoryOpen}
        onClose={() => {
          setIsEditSubcategoryOpen(false)
          setEditingSubcategory(null)
        }}
        mode="edit"
        initialData={editingSubcategory ? {
          id: editingSubcategory.id,
          parent_id: editingSubcategory.category_id,
          family_id: category?.family_id || '',
          name: editingSubcategory.name,
          slug: editingSubcategory.slug,
          description: editingSubcategory.description || '',
          image_url: editingSubcategory.image_url || '',
          display_order: editingSubcategory.display_order || 1,
          is_active: editingSubcategory.is_active,
          level: 2 as const
        } : null}
        categories={allCategories?.map(c => ({ id: c.id, name: c.name, family_name: family?.name || '' })) || []}
        onSubmit={(subcategory) => {
          // Adapter la réponse pour le hook useSubcategories
          handleSubmitEditSubcategory({
            name: subcategory.name,
            description: subcategory.description,
            is_active: subcategory.is_active,
            display_order: subcategory.display_order,
            image_url: subcategory.image_url
          })
        }}
      />
    </div>
  )
}