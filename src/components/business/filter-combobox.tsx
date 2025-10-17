'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, X, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Option de filtre
 */
export interface FilterOption {
  /** Valeur unique */
  value: string
  /** Label affiché */
  label: string
  /** Nombre de produits (optionnel) */
  count?: number
}

/**
 * Props pour FilterCombobox
 */
export interface FilterComboboxProps {
  /** Label du filtre (ex: "Statut", "Catégories") */
  label: string
  /** Options disponibles */
  options: FilterOption[]
  /** Valeurs sélectionnées */
  selectedValues: string[]
  /** Callback changement sélection */
  onSelectionChange: (values: string[]) => void
  /** Icon optionnel */
  icon?: LucideIcon
  /** Placeholder input recherche */
  placeholder?: string
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * FilterCombobox - Combobox shadcn multi-select moderne
 *
 * Features :
 * - Combobox shadcn : Dropdown multi-select
 * - Recherche instantanée : Filtre options en temps réel
 * - Multi-select : Chips avec X pour retirer
 * - Clear all : Bouton réinitialiser
 * - Categories : Statut, Sous-catégories, Fournisseurs
 *
 * Design :
 * - Popover shadcn : border Design System
 * - Badges chips : Design System V2 colors
 * - Clear all : text-sm ghost button
 *
 * Remplace badges filtres basiques dans catalogue page
 *
 * @example
 * ```tsx
 * const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
 *
 * <FilterCombobox
 *   label="Statut"
 *   options={[
 *     { value: 'in_stock', label: 'En stock', count: 42 },
 *     { value: 'out_of_stock', label: 'Rupture', count: 5 },
 *   ]}
 *   selectedValues={selectedStatuses}
 *   onSelectionChange={setSelectedStatuses}
 *   icon={Filter}
 *   placeholder="Rechercher un statut..."
 * />
 * ```
 *
 * @see /src/components/ui/command.tsx pour Command shadcn
 * @see /src/components/ui/popover.tsx pour Popover shadcn
 */
export function FilterCombobox({
  label,
  options,
  selectedValues,
  onSelectionChange,
  icon: Icon,
  placeholder = 'Rechercher...',
  className,
}: FilterComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Toggle sélection d'une valeur
  const toggleValue = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    onSelectionChange(newValues)
  }

  // Clear all
  const clearAll = () => {
    onSelectionChange([])
  }

  // Retirer une valeur depuis le chip
  const removeValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedValues.filter((v) => v !== value))
  }

  // Filtrer options selon recherche
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Trouver label d'une option
  const getOptionLabel = (value: string) => {
    return options.find((o) => o.value === value)?.label || value
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label + Clear all */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-black flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </h3>
        {selectedValues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-auto p-0 text-xs text-neutral-500 hover:text-black"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between border-black hover:bg-neutral-50',
              selectedValues.length === 0 && 'text-neutral-500'
            )}
          >
            <span className="truncate">
              {selectedValues.length === 0
                ? `Sélectionner ${label.toLowerCase()}...`
                : `${selectedValues.length} sélectionné${selectedValues.length > 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty>Aucun résultat trouvé</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-black',
                          isSelected
                            ? 'bg-black text-white'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-neutral-500">
                          {option.count}
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Chips sélectionnés */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="cursor-pointer hover:bg-neutral-100"
              onClick={(e) => removeValue(value, e)}
            >
              {getOptionLabel(value)}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Export default pour compatibilité
 */
export default FilterCombobox
