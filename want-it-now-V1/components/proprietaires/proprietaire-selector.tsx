'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Plus, Search, Users, Building2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { searchProprietaires } from '@/actions/proprietaires'
import {
  formatProprietaireNomComplet,
  formatProprietaireType,
  getBrouillonBadgeColor,
  getBrouillonBadgeText,
  getTypeBadgeColor,
} from '@/lib/utils/proprietaires'
import { type Proprietaire } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ProprietaireSelectorProps {
  value?: string // ID du propriétaire sélectionné
  onValueChange?: (proprietaireId: string | undefined) => void
  onProprietaireSelect?: (proprietaire: Proprietaire | undefined) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  allowClear?: boolean
  showCreateButton?: boolean
  filterType?: 'all' | 'physique' | 'morale'
  hideInactive?: boolean
  hideBrouillons?: boolean
}

interface ProprietaireOption {
  value: string
  label: string
  proprietaire: Proprietaire
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ProprietaireSelector({
  value,
  onValueChange,
  onProprietaireSelect,
  label = "Propriétaire",
  placeholder = "Sélectionner un propriétaire...",
  required = false,
  disabled = false,
  className = "",
  allowClear = true,
  showCreateButton = true,
  filterType = 'all',
  hideInactive = true,
  hideBrouillons = false,
}: ProprietaireSelectorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProprietaire, setSelectedProprietaire] = useState<Proprietaire | undefined>()

  // ==============================================================================
  // SEARCH LOGIC
  // ==============================================================================

  const searchProprietairesDebounced = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setProprietaires([])
        return
      }

      setLoading(true)
      try {
        const results = await searchProprietaires(query)
        
        // Appliquer les filtres
        let filtered = results
        
        if (filterType !== 'all') {
          filtered = filtered.filter(p => p.type === filterType)
        }
        
        if (hideInactive) {
          filtered = filtered.filter(p => p.is_active)
        }
        
        if (hideBrouillons) {
          filtered = filtered.filter(p => !p.is_brouillon)
        }
        
        setProprietaires(filtered)
      } catch (error) {
        console.error('Erreur lors de la recherche de propriétaires:', error)
        setProprietaires([])
      } finally {
        setLoading(false)
      }
    },
    [filterType, hideInactive, hideBrouillons]
  )

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchProprietairesDebounced(searchQuery)
      } else {
        setProprietaires([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchProprietairesDebounced])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleSelect = (proprietaireId: string) => {
    const proprietaire = proprietaires.find(p => p.id === proprietaireId)
    
    setSelectedProprietaire(proprietaire)
    onValueChange?.(proprietaireId)
    onProprietaireSelect?.(proprietaire)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedProprietaire(undefined)
    onValueChange?.(undefined)
    onProprietaireSelect?.(undefined)
    setSearchQuery('')
    setProprietaires([])
  }

  const handleCreateNew = () => {
    const createUrl = filterType === 'all' 
      ? '/proprietaires/new'
      : `/proprietaires/new?type=${filterType}`
    router.push(createUrl)
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderProprietaireOption = (proprietaire: Proprietaire) => {
    const nomComplet = formatProprietaireNomComplet(proprietaire)
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {proprietaire.type === 'physique' ? (
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Building2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{nomComplet}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {formatProprietaireType(proprietaire.type)}
              </span>
              {proprietaire.email && (
                <span className="text-xs text-gray-400 truncate max-w-32">
                  {proprietaire.email}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          {proprietaire.is_brouillon && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              📝
            </Badge>
          )}
          {!proprietaire.is_active && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-red-600">
              ⏸️
            </Badge>
          )}
        </div>
      </div>
    )
  }

  const renderSelectedProprietaire = () => {
    if (!selectedProprietaire) return null
    
    const nomComplet = formatProprietaireNomComplet(selectedProprietaire)
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedProprietaire.type === 'physique' ? (
            <Users className="h-4 w-4 text-blue-500" />
          ) : (
            <Building2 className="h-4 w-4 text-purple-500" />
          )}
          <span className="truncate">{nomComplet}</span>
          <Badge 
            variant="outline" 
            className={`text-xs ${getTypeBadgeColor(selectedProprietaire.type)}`}
          >
            {formatProprietaireType(selectedProprietaire.type)}
          </Badge>
        </div>
        
        {allowClear && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <Label htmlFor="proprietaire-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="proprietaire-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white"
            disabled={disabled}
          >
            {selectedProprietaire ? (
              renderSelectedProprietaire()
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Rechercher un propriétaire..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <CommandList>
              {loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Recherche en cours...
                </div>
              )}
              
              {!loading && searchQuery.length >= 2 && proprietaires.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      Aucun propriétaire trouvé pour "{searchQuery}"
                    </p>
                    {showCreateButton && (
                      <Button size="sm" onClick={handleCreateNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un nouveau propriétaire
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              )}
              
              {!loading && searchQuery.length < 2 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Tapez au moins 2 caractères pour rechercher...
                </div>
              )}
              
              {proprietaires.length > 0 && (
                <CommandGroup>
                  {proprietaires.map((proprietaire) => (
                    <CommandItem
                      key={proprietaire.id}
                      value={proprietaire.id}
                      onSelect={() => handleSelect(proprietaire.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === proprietaire.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {renderProprietaireOption(proprietaire)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Create Button */}
              {showCreateButton && searchQuery.length >= 2 && proprietaires.length > 0 && (
                <>
                  <Separator />
                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleCreateNew}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un nouveau propriétaire
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Create Button */}
      {showCreateButton && !selectedProprietaire && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCreateNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un nouveau propriétaire
        </Button>
      )}

      {/* Selected Info Card */}
      {selectedProprietaire && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-blue-900">
                    {formatProprietaireNomComplet(selectedProprietaire)}
                  </h4>
                  <Badge 
                    variant="outline" 
                    className={getTypeBadgeColor(selectedProprietaire.type)}
                  >
                    {formatProprietaireType(selectedProprietaire.type)}
                  </Badge>
                  {selectedProprietaire.is_brouillon && (
                    <Badge 
                      variant="outline" 
                      className={getBrouillonBadgeColor(selectedProprietaire.is_brouillon)}
                    >
                      {getBrouillonBadgeText(selectedProprietaire.is_brouillon)}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-blue-800 space-y-1">
                  {selectedProprietaire.email && (
                    <p>📧 {selectedProprietaire.email}</p>
                  )}
                  {selectedProprietaire.telephone && (
                    <p>📞 {selectedProprietaire.telephone}</p>
                  )}
                  {selectedProprietaire.type === 'morale' && selectedProprietaire.numero_identification && (
                    <p>🏢 {selectedProprietaire.numero_identification}</p>
                  )}
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => router.push(`/proprietaires/${selectedProprietaire.id}`)}
              >
                Voir détail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}