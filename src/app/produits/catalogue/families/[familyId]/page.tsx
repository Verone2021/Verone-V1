/**
 * 🎯 VÉRONE - Page Détail Famille
 *
 * Affiche toutes les catégories d'une famille spécifique
 * Permet la navigation vers les sous-catégories et la gestion CRUD
 */

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, FolderOpen, Package } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFamilies } from '@/shared/modules/categories/hooks'
import { useCategories, type CategoryWithCount } from '@/shared/modules/categories/hooks'
import { FamilyCrudForm } from '@/components/forms/FamilyCrudForm'
import { VéroneCard } from '@/components/ui/verone-card'
import type { Database } from '@/lib/supabase/types'

type Family = Database['public']['Tables']['families']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function FamilyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string

  const { families, loading: familiesLoading, updateFamily } = useFamilies()
  const {
    allCategories,
    loading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByFamily
  } = useCategories()

  const [family, setFamily] = useState<Family | null>(null)
  const [familyCategories, setFamilyCategories] = useState<CategoryWithCount[]>([])

  // État des dialogues
  const [isEditFamilyOpen, setIsEditFamilyOpen] = useState(false)
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)

  useEffect(() => {
    if (families && familyId) {
      const foundFamily = families.find(f => f.id === familyId)
      setFamily(foundFamily || null)
    }
  }, [families, familyId])

  useEffect(() => {
    if (allCategories && familyId) {
      const categories = allCategories.filter(cat => cat.family_id === familyId)
      setFamilyCategories(categories)
    }
  }, [allCategories, familyId])

  const loading = familiesLoading || categoriesLoading

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

  if (!family) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Famille non trouvée</h1>
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

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/catalogue/categories/${categoryId}`)
  }

  // Gestionnaires CRUD pour famille
  const handleEditFamily = () => {
    setIsEditFamilyOpen(true)
  }

  const handleSubmitFamily = async (formData: any) => {
    try {
      await updateFamily(familyId, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      })
      setIsEditFamilyOpen(false)
    } catch (error) {
      console.error('Erreur lors de la modification de la famille:', error)
    }
  }

  // Gestionnaires CRUD pour catégories
  const handleNewCategory = () => {
    setIsNewCategoryOpen(true)
  }

  const handleSubmitNewCategory = async (formData: any) => {
    try {
      await createCategory({
        name: formData.name,
        description: formData.description,
        family_id: familyId,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      } as any)
      setIsNewCategoryOpen(false)
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsEditCategoryOpen(true)
  }

  const handleSubmitEditCategory = async (formData: any) => {
    if (!editingCategory) return

    try {
      await updateCategory(editingCategory.id, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        display_order: formData.display_order,
        image_url: formData.image_url
      })
      setIsEditCategoryOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action est irréversible.`)) {
      try {
        await deleteCategory(categoryId)
      } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie:', error)
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
              onClick={() => router.push('/produits/catalogue/categories')}
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </ButtonV2>
            <div>
              <h1 className="text-3xl font-bold text-black">{family.name}</h1>
              <p className="text-gray-600 mt-1">
                {familyCategories.length} catégorie{familyCategories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ButtonV2
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={handleEditFamily}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </ButtonV2>
            <ButtonV2
              variant="outline"
              size="sm"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={handleNewCategory}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle catégorie
            </ButtonV2>
          </div>
        </div>

        {/* Description */}
        {family.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-gray-700">{family.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-bold text-black">{familyCategories.length}</p>
                  <p className="text-gray-600">Catégories</p>
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
                    {familyCategories.reduce((sum, cat) => sum + (cat.subcategory_count || 0), 0)}
                  </p>
                  <p className="text-gray-600">Sous-catégories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-lg px-3 py-1 border-black text-black">
                  #{family.slug}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catégories avec VéroneCard */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-black">Catégories</h2>

          {familyCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">Aucune catégorie dans cette famille</p>
                <ButtonV2
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white"
                  onClick={handleNewCategory}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la première catégorie
                </ButtonV2>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyCategories.map((category) => (
                <VéroneCard
                  key={category.id}
                  title={category.name}
                  imageUrl={category.image_url || undefined}
                  entityType="category"
                  slug={category.slug}
                  count={category.subcategory_count || 0}
                  countLabel="sous-catégorie"
                  isActive={category.is_active ?? undefined}
                  iconPosition="top-right"
                  onClick={() => handleCategoryClick(category.id)}
                  onEdit={() => handleEditCategory(category)}
                  onDelete={() => handleDeleteCategory(category.id, category.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs CRUD */}
      {/* Modification famille */}
      <FamilyCrudForm
        isOpen={isEditFamilyOpen}
        onClose={() => setIsEditFamilyOpen(false)}
        type="family"
        mode="edit"
        initialData={family ? {
          id: family.id,
          name: family.name,
          description: family.description || '',
          is_active: family.is_active ?? true,
          display_order: family.display_order || 1,
          image_url: family.image_url || undefined
        } : undefined}
        onSubmit={handleSubmitFamily}
      />

      {/* Nouvelle catégorie */}
      <FamilyCrudForm
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        type="category"
        mode="create"
        parentOptions={families?.map(f => ({ id: f.id, name: f.name })) || []}
        onSubmit={handleSubmitNewCategory}
      />

      {/* Modification catégorie */}
      <FamilyCrudForm
        isOpen={isEditCategoryOpen}
        onClose={() => {
          setIsEditCategoryOpen(false)
          setEditingCategory(null)
        }}
        type="category"
        mode="edit"
        initialData={editingCategory ? {
          id: editingCategory.id,
          name: editingCategory.name,
          description: editingCategory.description || '',
          is_active: editingCategory.is_active ?? true,
          display_order: editingCategory.display_order || 1,
          parent_id: editingCategory.family_id ?? undefined,
          image_url: editingCategory.image_url || undefined
        } : undefined}
        parentOptions={families?.map(f => ({ id: f.id, name: f.name })) || []}
        onSubmit={handleSubmitEditCategory}
      />
    </div>
  )
}