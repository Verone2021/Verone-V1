"use client"

import { useState, useRef, useCallback } from 'react'
import { GripVertical, Save, RotateCcw, Check, AlertCircle } from 'lucide-react'
import { ProductCard } from '@/shared/modules/products/components/cards'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { CollectionProduct, ReorderCollectionProductsInput } from '../../types/collections'

interface DraggableProductGridProps {
  products: CollectionProduct[]
  collectionId: string
  onReorder?: (input: ReorderCollectionProductsInput) => Promise<boolean>
  onRemoveProduct?: (productId: string) => Promise<boolean>
  className?: string
  disabled?: boolean
}

interface DragState {
  draggedIndex: number | null
  dragOverIndex: number | null
  isDragging: boolean
}

export function DraggableProductGrid({
  products: initialProducts,
  collectionId,
  onReorder,
  onRemoveProduct,
  className,
  disabled = false
}: DraggableProductGridProps) {
  const [products, setProducts] = useState(initialProducts)
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
    dragOverIndex: null,
    isDragging: false
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const draggedElementRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Check if order has changed from initial
  const orderChanged = products.some((product, index) => {
    const originalIndex = initialProducts.findIndex(p => p.id === product.id)
    return originalIndex !== index
  })

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return

    const dragData = {
      type: 'collection-product',
      productId: products[index].id,
      fromIndex: index,
      collectionId
    }

    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'

    // Store reference to dragged element
    draggedElementRef.current = e.currentTarget as HTMLDivElement

    // Add drag image styling
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg)'
    dragImage.style.opacity = '0.8'
    dragImage.style.border = '2px dashed #000'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 50, 50)
    setTimeout(() => document.body.removeChild(dragImage), 0)

    setDragState({
      draggedIndex: index,
      dragOverIndex: null,
      isDragging: true
    })
  }, [products, collectionId, disabled])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return

    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    setDragState(prev => ({
      ...prev,
      dragOverIndex: index
    }))
  }, [disabled])

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return
    e.preventDefault()
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled) return

    // Only clear dragOverIndex if we're leaving the grid entirely
    const rect = gridRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientX, clientY } = e
      const isOutside = (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      )

      if (isOutside) {
        setDragState(prev => ({
          ...prev,
          dragOverIndex: null
        }))
      }
    }
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (disabled) return

    e.preventDefault()

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))

      if (dragData.type === 'collection-product' && dragData.collectionId === collectionId) {
        const fromIndex = dragData.fromIndex

        if (fromIndex !== dropIndex) {
          // Reorder products
          const newProducts = [...products]
          const [draggedProduct] = newProducts.splice(fromIndex, 1)
          newProducts.splice(dropIndex, 0, draggedProduct)

          // Update positions
          const updatedProducts = newProducts.map((product, index) => ({
            ...product,
            position: index + 1
          }))

          setProducts(updatedProducts)
          setHasChanges(true)
          setSaveStatus('idle')
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }

    setDragState({
      draggedIndex: null,
      dragOverIndex: null,
      isDragging: false
    })
  }, [products, collectionId, disabled])

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedIndex: null,
      dragOverIndex: null,
      isDragging: false
    })
  }, [])

  const saveChanges = async () => {
    if (!onReorder || saving || !hasChanges) return

    setSaving(true)
    setSaveStatus('idle')

    try {
      const reorderInput: ReorderCollectionProductsInput = {
        collection_id: collectionId,
        product_orders: products.map((product, index) => ({
          product_id: product.id,
          position: index + 1
        }))
      }

      const success = await onReorder(reorderInput)

      if (success) {
        setHasChanges(false)
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving reorder:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const resetOrder = () => {
    setProducts(initialProducts)
    setHasChanges(false)
    setSaveStatus('idle')
  }

  const handleRemoveProduct = async (productId: string) => {
    if (!onRemoveProduct || disabled) return

    try {
      const success = await onRemoveProduct(productId)
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        setHasChanges(true)
      }
    } catch (error) {
      console.error('Error removing product:', error)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with save controls */}
      {(hasChanges || orderChanged) && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {hasChanges ? 'Modifications non sauvegardées' : 'Ordre modifié'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {saveStatus === 'success' && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Check className="h-3 w-3 mr-1" />
                Sauvegardé
              </Badge>
            )}

            {saveStatus === 'error' && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Erreur
              </Badge>
            )}

            <ButtonV2
              variant="outline"
              size="sm"
              onClick={resetOrder}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Annuler
            </ButtonV2>

            <ButtonV2
              size="sm"
              onClick={saveChanges}
              disabled={saving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Sauvegarder
                </>
              )}
            </ButtonV2>
          </div>
        </div>
      )}

      {/* Products grid */}
      <div
        ref={gridRef}
        className={cn(
          "grid gap-4 transition-opacity",
          dragState.isDragging && "select-none",
          disabled && "opacity-50 pointer-events-none"
        )}
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
        }}
        onDragLeave={handleDragLeave}
      >
        {products.map((product, index) => {
          const isDragged = dragState.draggedIndex === index
          const isDragOver = dragState.dragOverIndex === index
          const isBeingDragged = dragState.isDragging && isDragged

          return (
            <div
              key={product.id}
              className={cn(
                "group relative transition-all duration-200",
                isBeingDragged && "opacity-50 scale-95",
                isDragOver && !isDragged && "scale-105",
                isDragOver && "z-10"
              )}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className={cn(
                "absolute -left-3 top-2 z-20 p-1 bg-white border border-gray-300 rounded shadow-sm transition-all",
                "opacity-0 group-hover:opacity-100",
                isDragged && "opacity-100",
                disabled && "hidden"
              )}>
                <GripVertical className="h-4 w-4 text-gray-500 cursor-grab active:cursor-grabbing" />
              </div>

              {/* Drop indicator */}
              {isDragOver && !isDragged && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50/50 rounded-lg pointer-events-none z-10" />
              )}

              {/* Position indicator */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-medium z-10">
                {index + 1}
              </div>

              {/* Product card */}
              <div className={cn(
                "transition-transform duration-200",
                isDragOver && !isDragged && "transform translate-y-1"
              )}>
                <ProductCard
                  product={{
                    id: product.id,
                    name: product.name,
                    sku: product.sku || '',
                    cost_price: product.cost_price || 0,
                    price_ht: product.cost_price || 0,
                    status: 'in_stock' as any,
                    condition: 'new' as any,
                    created_at: product.added_at,
                    updated_at: product.added_at,
                    archived_at: null,
                    supplier: null
                  } as any}
                  showActions={!disabled}
                  onDelete={() => handleRemoveProduct(product.id)}
                  className={cn(
                    "cursor-move",
                    disabled && "cursor-default"
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium mb-2">Aucun produit dans cette collection</p>
            <p className="text-sm">Ajoutez des produits pour commencer à organiser votre collection</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {products.length > 1 && !disabled && (
        <div className="text-center text-xs text-gray-500 pt-4">
          Glissez-déposez les produits pour réorganiser l'ordre d'affichage
        </div>
      )}
    </div>
  )
}