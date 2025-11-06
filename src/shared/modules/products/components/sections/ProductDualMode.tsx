"use client"

import { useState, useEffect } from 'react'
import { Eye, Settings, ToggleLeft, ToggleRight } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { ProductViewMode } from './product-view-mode'
import { ProductEditMode } from './product-edit-mode'

interface ProductDualModeProps {
  product: any
  onUpdate: (updatedProduct: any) => void
  initialMode?: 'view' | 'edit'
  className?: string
}

export function ProductDualMode({
  product,
  onUpdate,
  initialMode = 'view',
  className
}: ProductDualModeProps) {
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(initialMode)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Animation de transition
  const handleModeSwitch = (newMode: 'view' | 'edit') => {
    if (newMode === currentMode) return

    setIsTransitioning(true)

    setTimeout(() => {
      setCurrentMode(newMode)
      setIsTransitioning(false)
    }, 150)
  }

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + E pour basculer en mode édition
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault()
        handleModeSwitch(currentMode === 'view' ? 'edit' : 'view')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentMode])

  return (
    <div className={cn("min-h-screen", className)}>

      {/* Barre de toggle sticky - Mobile-First */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2">

            {/* Informations du mode actuel - Responsive */}
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-1 md:space-x-2">
                {currentMode === 'view' ? (
                  <Eye className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Settings className="h-4 w-4 md:h-5 md:w-5 text-gray-800 flex-shrink-0" />
                )}
                <span className="font-semibold text-sm md:text-lg truncate">
                  {currentMode === 'view' ? 'Présentation' : 'Administration'}
                </span>
              </div>

              <Badge
                variant={currentMode === 'view' ? 'secondary' : 'secondary'}
                className={cn(
                  "transition-colors duration-200 text-xs px-2 py-1",
                  currentMode === 'view' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                )}
              >
                {currentMode === 'view' ? 'Client' : 'Admin'}
              </Badge>

              {/* Indicateur produit - Masqué sur mobile */}
              <div className="hidden lg:block text-sm text-gray-600 truncate">
                {product.name} • SKU: {product.sku || 'N/A'}
              </div>
            </div>

            {/* Toggle controls - Responsive */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">

              {/* Raccourci clavier hint - Desktop only */}
              <div className="hidden xl:block text-xs text-gray-500">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+E</kbd>
              </div>

              {/* Toggle visuel - Compact sur mobile */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 md:p-1">
                <ButtonV2
                  variant={currentMode === 'view' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeSwitch('view')}
                  className={cn(
                    "transition-all duration-200 text-xs md:text-sm h-7 md:h-8 px-2 md:px-3",
                    currentMode === 'view'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                  disabled={isTransitioning}
                >
                  <Eye className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline">Présentation</span>
                </ButtonV2>

                <ButtonV2
                  variant={currentMode === 'edit' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleModeSwitch('edit')}
                  className={cn(
                    "transition-all duration-200 text-xs md:text-sm h-7 md:h-8 px-2 md:px-3",
                    currentMode === 'edit'
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                  disabled={isTransitioning}
                >
                  <Settings className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline">Administration</span>
                </ButtonV2>
              </div>

              {/* Toggle switch animé - Masqué sur très petit écran */}
              <button
                onClick={() => handleModeSwitch(currentMode === 'view' ? 'edit' : 'view')}
                className="hidden sm:flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isTransitioning}
                title={`Basculer vers ${currentMode === 'view' ? 'Administration' : 'Présentation'}`}
              >
                {currentMode === 'view' ? (
                  <ToggleLeft className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <ToggleRight className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Indicateur produit mobile - Sous la barre principale */}
          <div className="lg:hidden text-xs text-gray-600 truncate mt-1 border-t border-gray-100 pt-1">
            {product.name} • SKU: {product.sku || 'N/A'}
          </div>
        </div>
      </div>

      {/* Contenu avec transition */}
      <div
        className={cn(
          "transition-opacity duration-150",
          isTransitioning ? 'opacity-50' : 'opacity-100'
        )}
      >
        <div className="py-4 md:py-6">
          {currentMode === 'view' ? (
            <ProductViewMode
              product={product}
              onSwitchToEdit={() => handleModeSwitch('edit')}
              className="px-2 md:px-4 lg:px-6"
            />
          ) : (
            <ProductEditMode
              product={product}
              onSwitchToView={() => handleModeSwitch('view')}
              onUpdate={onUpdate}
              className="px-2 md:px-4 lg:px-6"
            />
          )}
        </div>
      </div>

      {/* Indicateurs d'état en bas */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="flex items-center space-x-2">
          {/* Statut du mode */}
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium shadow-lg",
              currentMode === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-white'
            )}
          >
            {currentMode === 'view' ? 'Vue Client' : 'Mode Admin'}
          </div>

          {/* Indicateur de modification */}
          {product.updated_at && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              Sauvé {new Date(product.updated_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}