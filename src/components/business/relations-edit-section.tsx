"use client"

import { useState, useEffect } from 'react'
import { Layers, Save, X, Search, ExternalLink, AlertCircle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { useInlineEdit, type EditableSection } from '../../hooks/use-inline-edit'
import { createClient } from '../../lib/supabase/client'

interface Product {
  id: string
  product_group_id: string
  product_groups?: {
    id: string
    name: string
    description?: string
    brand?: string
    status: string
    subcategories?: {
      id: string
      name: string
      categories?: {
        id: string
        name: string
        families?: {
          id: string
          name: string
        }
      }
    }
  }
}

interface ProductGroup {
  id: string
  name: string
  description?: string
  brand?: string
  status: string
  subcategories?: {
    id: string
    name: string
    categories?: {
      id: string
      name: string
      families?: {
        id: string
        name: string
      }
    }
  }
}

interface RelationsEditSectionProps {
  product: Product
  onUpdate: (updatedProduct: Partial<Product>) => void
  className?: string
}

export function RelationsEditSection({ product, onUpdate, className }: RelationsEditSectionProps) {
  const supabase = createClient()
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingGroups, setLoadingGroups] = useState(false)

  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges
  } = useInlineEdit({
    productId: product.id,
    onUpdate: (updatedData) => {
      onUpdate(updatedData)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour relations:', error)
    }
  })

  const section: EditableSection = 'relations'
  const editData = getEditedData(section)
  const error = getError(section)

  // Charger les groupes de produits disponibles
  useEffect(() => {
    if (isEditing(section)) {
      fetchProductGroups()
    }
  }, [isEditing(section)])

  const fetchProductGroups = async () => {
    setLoadingGroups(true)
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select(`
          id,
          name,
          description,
          brand,
          status,
          subcategories (
            id,
            name,
            categories (
              id,
              name,
              families (
                id,
                name
              )
            )
          )
        `)
        .eq('status', 'active')
        .order('name')
        .limit(50)

      if (error) throw error
      setProductGroups(data || [])
    } catch (err) {
      console.error('❌ Erreur chargement groupes produits:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleStartEdit = () => {
    startEdit(section, {
      product_group_id: product.product_group_id
    })
    setSearchTerm('')
  }

  const handleSave = async () => {
    const success = await saveChanges(section)
    if (success) {
      // Optionnel : afficher une notification de succès
    }
  }

  const handleCancel = () => {
    cancelEdit(section)
    setSearchTerm('')
  }

  const handleSelectGroup = (groupId: string) => {
    updateEditedData(section, { product_group_id: groupId })
    setSearchTerm('')
  }

  const filteredGroups = productGroups.filter(group =>
    searchTerm === '' ||
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedGroup = productGroups.find(g => g.id === editData?.product_group_id)

  const renderHierarchy = (group: ProductGroup) => {
    if (!group.subcategories?.categories?.families) return null

    return (
      <div className="text-xs text-blue-600 mt-1">
        {group.subcategories.categories.families.name} › {group.subcategories.categories.name} › {group.subcategories.name}
      </div>
    )
  }

  if (isEditing(section)) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <Layers className="h-5 w-5 mr-2" />
            Relations
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving(section)}
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges(section) || isSaving(section)}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Groupe sélectionné */}
          {selectedGroup && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-black">{selectedGroup.name}</div>
                  {selectedGroup.description && (
                    <div className="text-sm text-gray-600 mt-1">{selectedGroup.description}</div>
                  )}
                  {renderHierarchy(selectedGroup)}
                </div>
                <Badge variant="outline" className="bg-white">
                  Sélectionné
                </Badge>
              </div>
            </div>
          )}

          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Changer de groupe produit
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un groupe de produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          {/* Liste des groupes */}
          {searchTerm && (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              {loadingGroups ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement des groupes...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun groupe trouvé pour "{searchTerm}"
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleSelectGroup(group.id)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-gray-50 transition-colors",
                        group.id === editData?.product_group_id && "bg-blue-50 border-blue-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-black truncate">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-gray-600 truncate">{group.description}</div>
                          )}
                          {renderHierarchy(group)}
                          {group.brand && (
                            <div className="text-xs text-gray-500 mt-1">Marque: {group.brand}</div>
                          )}
                        </div>
                        {group.id === editData?.product_group_id && (
                          <Badge variant="outline" className="ml-2">
                            Actuel
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Avertissement */}
          {editData?.product_group_id !== product.product_group_id && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-black mr-2 mt-0.5" />
                <div className="text-sm text-gray-800">
                  <div className="font-medium">Attention: Changement de groupe</div>
                  <div className="mt-1">
                    Changer le groupe de produit peut affecter la catégorisation et les relations avec d'autres variantes.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    )
  }

  // Mode affichage
  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-black flex items-center">
          <Layers className="h-4 w-4 mr-1" />
          Relations
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Layers className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-black opacity-70">Groupe:</span>
          <div className="mt-1 bg-gray-100 p-2 rounded">
            <div className="font-medium text-black">{product.product_groups?.name}</div>
            {product.product_groups?.description && (
              <div className="text-xs text-black opacity-70 mt-1">
                {product.product_groups.description}
              </div>
            )}
          </div>
        </div>

        {/* Hiérarchie complète */}
        {product.product_groups?.subcategories && (
          <div>
            <span className="text-black opacity-70">Hiérarchie:</span>
            <div className="mt-1 text-xs text-black opacity-80 bg-blue-50 p-2 rounded">
              {product.product_groups.subcategories.categories?.families?.name}
              <br />↳ {product.product_groups.subcategories.categories?.name}
              <br />↳ {product.product_groups.subcategories.name}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-7"
            onClick={() => {
              // TODO: Naviguer vers la page du groupe de produit
              console.log('Navigate to product group:', product.product_group_id)
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir le groupe complet
          </ButtonV2>
        </div>
      </div>
    </div>
  )
}