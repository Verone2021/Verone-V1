'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Users, Building2, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'

import { type ProprietaireType } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ProprietairesFiltersProps {
  // Filter state
  filterType: ProprietaireType | 'all'
  hideInactive: boolean
  hideBrouillons: boolean
  searchQuery: string
  
  // Stats for display
  totalCount?: number
  activeCount?: number
  brouillonCount?: number
  filteredCount?: number
  
  // Callbacks
  onFilterTypeChange: (type: ProprietaireType | 'all') => void
  onHideInactiveChange: (hide: boolean) => void
  onHideBrouillonsChange: (hide: boolean) => void
  onSearchQueryChange: (query: string) => void
  onClearFilters?: () => void
  
  // Config
  showStats?: boolean
  showAdvancedFilters?: boolean
  placeholder?: string
  className?: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ProprietairesFilters({
  filterType,
  hideInactive,
  hideBrouillons,
  searchQuery,
  totalCount = 0,
  activeCount = 0,
  brouillonCount = 0,
  filteredCount = 0,
  onFilterTypeChange,
  onHideInactiveChange,
  onHideBrouillonsChange,
  onSearchQueryChange,
  onClearFilters,
  showStats = true,
  showAdvancedFilters = true,
  placeholder = "Rechercher un propriétaire...",
  className = "",
}: ProprietairesFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // ==============================================================================
  // COMPUTED VALUES
  // ==============================================================================

  const hasActiveFilters = filterType !== 'all' || hideInactive || hideBrouillons || searchQuery.trim().length > 0
  
  const activeFiltersCount = [
    filterType !== 'all',
    hideInactive,
    hideBrouillons,
    searchQuery.trim().length > 0,
  ].filter(Boolean).length

  // ==============================================================================
  // EFFECTS
  // ==============================================================================

  // Debounce search query updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchQueryChange(localSearchQuery)
    }, 300)

    return () => clearTimeout(timeout)
  }, [localSearchQuery, onSearchQueryChange])

  // Sync external search query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleClearSearch = () => {
    setLocalSearchQuery('')
    onSearchQueryChange('')
  }

  const handleClearAllFilters = () => {
    setLocalSearchQuery('')
    onFilterTypeChange('all')
    onHideInactiveChange(false)
    onHideBrouillonsChange(false)
    onSearchQueryChange('')
    onClearFilters?.()
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderStats = () => {
    if (!showStats) return null

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{filteredCount}</span>
          <span>sur {totalCount}</span>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4" />
          <span>{activeCount} actifs</span>
        </div>
        
        {brouillonCount > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <span>📝</span>
              <span>{brouillonCount} brouillons</span>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Filtres actifs:</span>
        
        {filterType !== 'all' && (
          <Badge variant="secondary" className="text-xs">
            {filterType === 'physique' ? '👤 Physique' : '🏢 Morale'}
            <button
              onClick={() => onFilterTypeChange('all')}
              className="ml-1 hover:bg-gray-300 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {hideInactive && (
          <Badge variant="secondary" className="text-xs">
            Actifs seulement
            <button
              onClick={() => onHideInactiveChange(false)}
              className="ml-1 hover:bg-gray-300 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {hideBrouillons && (
          <Badge variant="secondary" className="text-xs">
            Sans brouillons
            <button
              onClick={() => onHideBrouillonsChange(false)}
              className="ml-1 hover:bg-gray-300 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {searchQuery.trim() && (
          <Badge variant="secondary" className="text-xs">
            "{searchQuery}"
            <button
              onClick={handleClearSearch}
              className="ml-1 hover:bg-gray-300 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAllFilters}
          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Tout effacer
        </Button>
      </div>
    )
  }

  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters) return null

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Type de propriétaire</Label>
              <RadixSelect value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <span>Tous types</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="physique">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Personne physique</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="morale">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Personne morale</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </RadixSelect>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Options d'affichage</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="hide-inactive" className="text-sm">
                    Masquer les inactifs
                  </Label>
                </div>
                <Switch
                  id="hide-inactive"
                  checked={hideInactive}
                  onCheckedChange={onHideInactiveChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">📝</span>
                  <Label htmlFor="hide-brouillons" className="text-sm">
                    Masquer les brouillons
                  </Label>
                </div>
                <Switch
                  id="hide-brouillons"
                  checked={hideBrouillons}
                  onCheckedChange={onHideBrouillonsChange}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser tous les filtres
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and filters row */}
      <div className="flex items-center space-x-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white"
          />
          {localSearchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick filter buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant={filterType === 'physique' ? 'primaryCopper' : 'outline'}
            size="sm"
            onClick={() => onFilterTypeChange(filterType === 'physique' ? 'all' : 'physique')}
          >
            <Users className="h-4 w-4 mr-2" />
            Physiques
          </Button>
          
          <Button
            variant={filterType === 'morale' ? 'primaryCopper' : 'outline'}
            size="sm"
            onClick={() => onFilterTypeChange(filterType === 'morale' ? 'all' : 'morale')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Morales
          </Button>
        </div>

        {/* Advanced filters */}
        {renderAdvancedFilters()}
      </div>

      {/* Stats row */}
      {showStats && (
        <div className="flex items-center justify-between">
          {renderStats()}
          <div className="flex items-center space-x-2">
            {hideInactive && (
              <Badge variant="outline" className="text-xs">
                <EyeOff className="h-3 w-3 mr-1" />
                Inactifs masqués
              </Badge>
            )}
            {hideBrouillons && (
              <Badge variant="outline" className="text-xs">
                📝 Brouillons masqués
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Active filters row */}
      {hasActiveFilters && renderActiveFilters()}
    </div>
  )
}

// ==============================================================================
// EXPORT VARIANTS
// ==============================================================================

export function ProprietairesFiltersCompact(props: Omit<ProprietairesFiltersProps, 'showStats' | 'showAdvancedFilters'>) {
  return (
    <ProprietairesFilters 
      {...props} 
      showStats={false} 
      showAdvancedFilters={false} 
    />
  )
}

export function ProprietairesFiltersMinimal(props: Omit<ProprietairesFiltersProps, 'showStats' | 'showAdvancedFilters'>) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={props.placeholder || "Rechercher..."}
        value={props.searchQuery}
        onChange={(e) => props.onSearchQueryChange(e.target.value)}
        className="pl-10 pr-10 bg-white"
      />
      {props.searchQuery && (
        <button
          onClick={() => props.onSearchQueryChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}