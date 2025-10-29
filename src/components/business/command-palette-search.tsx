'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Search, Clock, Package, Layers, Tag } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'

/**
 * Type d'item dans les résultats de recherche
 */
export interface SearchItem {
  id: string
  type: 'product' | 'collection' | 'category'
  title: string
  subtitle?: string // SKU pour produit, description pour autres
  url: string
}

/**
 * Props pour CommandPaletteSearch
 */
export interface CommandPaletteSearchProps {
  /** État ouvert/fermé */
  open: boolean
  /** Callback changement état */
  onOpenChange: (open: boolean) => void
  /** Callback sélection item */
  onSelect: (item: SearchItem) => void
  /** Items custom (sinon fetch depuis Supabase) */
  items?: SearchItem[]
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * Clé localStorage pour historique recherches
 */
const HISTORY_STORAGE_KEY = 'verone-search-history'
const MAX_HISTORY_ITEMS = 5

/**
 * Icon selon type d'item
 */
const getIcon = (type: SearchItem['type']) => {
  switch (type) {
    case 'product':
      return Package
    case 'collection':
      return Layers
    case 'category':
      return Tag
    default:
      return Package
  }
}

/**
 * CommandPaletteSearch - Command Palette moderne ⌘K/Ctrl+K
 *
 * Features :
 * - Raccourci clavier ⌘K (Mac) / Ctrl+K (Windows)
 * - Dialog shadcn avec glassmorphism backdrop-blur
 * - Command shadcn pour input + liste suggestions
 * - Historique localStorage (5 dernières recherches)
 * - Suggestions : Produits (nom, SKU), Collections, Catégories
 * - Navigation clavier : ↑↓ Enter Esc Tab
 * - Footer hints : "↑↓ naviguer · Enter sélectionner · Esc fermer"
 *
 * Inspiré de Linear, Vercel, Raycast
 *
 * @example
 * ```tsx
 * const [paletteOpen, setPaletteOpen] = useState(false)
 *
 * // Listener global ⌘K
 * useEffect(() => {
 *   const down = (e: KeyboardEvent) => {
 *     if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
 *       e.preventDefault()
 *       setPaletteOpen(true)
 *     }
 *   }
 *   document.addEventListener('keydown', down)
 *   return () => document.removeEventListener('keydown', down)
 * }, [])
 *
 * <CommandPaletteSearch
 *   open={paletteOpen}
 *   onOpenChange={setPaletteOpen}
 *   onSelect={(item) => {
 *     console.log('Selected:', item)
 *     setPaletteOpen(false)
 *   }}
 * />
 * ```
 *
 * @see /src/components/ui/command.tsx pour Command shadcn
 * @see /src/components/ui/dialog.tsx pour Dialog shadcn
 */
export function CommandPaletteSearch({
  open,
  onOpenChange,
  onSelect,
  items = [],
  className,
}: CommandPaletteSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<SearchItem[]>([])

  // Charger historique depuis localStorage au mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SearchItem[]
        setSearchHistory(parsed.slice(0, MAX_HISTORY_ITEMS))
      }
    } catch (error) {
      console.error('Erreur chargement historique recherche:', error)
    }
  }, [])

  // Sauvegarder item dans historique
  const saveToHistory = useCallback((item: SearchItem) => {
    try {
      setSearchHistory((prev) => {
        // Retirer item s'il existe déjà
        const filtered = prev.filter((i) => i.id !== item.id)
        // Ajouter en premier
        const newHistory = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS)
        // Sauvegarder localStorage
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory))
        return newHistory
      })
    } catch (error) {
      console.error('Erreur sauvegarde historique recherche:', error)
    }
  }, [])

  // Handler sélection item
  const handleSelect = useCallback(
    (item: SearchItem) => {
      saveToHistory(item)
      onSelect(item)
      setSearchQuery('')
    },
    [onSelect, saveToHistory]
  )

  // Filtrer items selon query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return false
    const query = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query) ||
      false
    )
  })

  // Grouper items par type
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    },
    {} as Record<SearchItem['type'], SearchItem[]>
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      {...({ className: cn('top-[10%]', className) } as any)}
    >
      {/* Accessibilité : Titre et description cachés visuellement */}
      <VisuallyHidden>
        <DialogTitle>Recherche globale</DialogTitle>
        <DialogDescription>
          Recherchez des produits, collections ou catégories en tapant leur nom ou SKU
        </DialogDescription>
      </VisuallyHidden>

      <CommandInput
        placeholder="Rechercher produits, collections, catégories..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="border-none focus:ring-0"
      />

      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm text-neutral-500">
            <Search className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p>Aucun résultat trouvé</p>
          </div>
        </CommandEmpty>

        {/* Historique recherches (seulement si pas de query) */}
        {!searchQuery && searchHistory.length > 0 && (
          <>
            <CommandGroup heading="Recherches récentes">
              {searchHistory.map((item) => {
                const Icon = getIcon(item.type)
                return (
                  <CommandItem
                    key={`history-${item.id}`}
                    value={item.title}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4 text-neutral-400" />
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-xs text-neutral-500">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Résultats recherche groupés par type */}
        {searchQuery && (
          <>
            {groupedItems.product && groupedItems.product.length > 0 && (
              <CommandGroup heading={`Produits (${groupedItems.product.length})`}>
                {groupedItems.product.map((item) => {
                  const Icon = getIcon(item.type)
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        {item.subtitle && (
                          <span className="text-xs text-neutral-500">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {groupedItems.collection && groupedItems.collection.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={`Collections (${groupedItems.collection.length})`}>
                  {groupedItems.collection.map((item) => {
                    const Icon = getIcon(item.type)
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}

            {groupedItems.category && groupedItems.category.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={`Catégories (${groupedItems.category.length})`}>
                  {groupedItems.category.map((item) => {
                    const Icon = getIcon(item.type)
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>

      {/* Footer hints navigation clavier */}
      <div className="border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500">
        <div className="flex items-center justify-between">
          <span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-neutral-100 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              ↑↓
            </kbd>{' '}
            naviguer
          </span>
          <span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-neutral-100 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              Enter
            </kbd>{' '}
            sélectionner
          </span>
          <span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-neutral-100 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              Esc
            </kbd>{' '}
            fermer
          </span>
        </div>
      </div>
    </CommandDialog>
  )
}

/**
 * Export default pour compatibilité
 */
export default CommandPaletteSearch
