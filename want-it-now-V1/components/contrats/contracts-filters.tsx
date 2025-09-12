'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
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
import { Card, CardContent } from '@/components/ui/card'

export interface ContractsFilters {
  search: string
  type: 'all' | 'fixe' | 'variable'
  status: 'all' | 'a_venir' | 'en_cours' | 'termine'
  meuble: 'all' | 'meuble' | 'non_meuble'
  dateDebut?: string
  dateFin?: string
}

interface ContractsFiltersProps {
  filters: ContractsFilters
  onFiltersChange: (filters: ContractsFilters) => void
  resultsCount?: number
}

export function ContractsFilters({ 
  filters, 
  onFiltersChange, 
  resultsCount 
}: ContractsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleFilterChange = (key: keyof ContractsFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value === 'all' ? 'all' : value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      status: 'all',
      meuble: 'all',
      dateDebut: undefined,
      dateFin: undefined
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.type !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.meuble !== 'all') count++
    if (filters.dateDebut || filters.dateFin) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par propriété, bailleur, type..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={`relative ${activeFiltersCount > 0 ? 'border-[#D4841A] text-[#D4841A]' : ''}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-[#D4841A] text-white px-1.5 py-0.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Filtres avancés</h4>
                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Effacer
                      </Button>
                    )}
                  </div>

                  {/* Type de contrat */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Type de contrat
                    </label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => handleFilterChange('type', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="fixe">🏠 Contrat Fixe</SelectItem>
                        <SelectItem value="variable">📈 Contrat Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Statut
                    </label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="a_venir">⏳ À venir</SelectItem>
                        <SelectItem value="en_cours">🔄 En cours</SelectItem>
                        <SelectItem value="termine">✅ Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Meublé */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Ameublement
                    </label>
                    <Select
                      value={filters.meuble}
                      onValueChange={(value) => handleFilterChange('meuble', value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="meuble">🏠 Meublé</SelectItem>
                        <SelectItem value="non_meuble">📦 Non meublé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Période */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Période
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="date"
                          placeholder="Date début"
                          value={filters.dateDebut || ''}
                          onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                          className="bg-white text-xs"
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          placeholder="Date fin"
                          value={filters.dateFin || ''}
                          onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Filtres actifs:</span>
          
          {filters.search && (
            <Badge variant="outline" className="text-xs">
              Recherche: "{filters.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.type !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Type: {filters.type === 'fixe' ? 'Fixe' : 'Variable'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('type', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Statut: {filters.status.replace('_', ' ')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('status', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.meuble !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {filters.meuble === 'meuble' ? 'Meublé' : 'Non meublé'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('meuble', 'all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Compteur de résultats */}
      {typeof resultsCount === 'number' && (
        <div className="text-sm text-gray-600">
          {resultsCount} contrat{resultsCount > 1 ? 's' : ''} trouvé{resultsCount > 1 ? 's' : ''}
          {activeFiltersCount > 0 && ' (filtré' + (resultsCount > 1 ? 's' : '') + ')'}
        </div>
      )}
    </div>
  )
}