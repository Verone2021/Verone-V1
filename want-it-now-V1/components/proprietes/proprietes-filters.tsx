'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { PROPRIETE_STATUTS, PROPRIETE_TYPES } from '@/lib/validations/proprietes'
import { useDebounce } from '@/hooks/use-debounce'

interface ProprietesFiltersProps {
  hiddenFilters?: string[]
}

export function ProprietesFilters({ hiddenFilters = [] }: ProprietesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current filter values
  const currentSearch = searchParams?.get('search') || ''
  const currentStatut = searchParams?.get('statut') || 'all'
  const currentType = searchParams?.get('type') || 'all'

  // Update URL with new filters
  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      startTransition(() => {
        router.push(`/proprietes?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push('/proprietes')
    })
  }, [router])

  // Debounced search
  const debouncedSearch = useDebounce(
    (value: string) => updateFilters('search', value),
    500
  )

  const hasActiveFilters = currentSearch || currentStatut !== 'all' || currentType !== 'all'

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, référence ou ville..."
            defaultValue={currentSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-9 bg-white"
            disabled={isPending}
          />
        </div>

        {/* Status Filter */}
        {!hiddenFilters.includes('statut') && (
          <Select
            value={currentStatut}
            onChange={(value) => updateFilters('statut', value)}
            disabled={isPending}
            placeholder="Statut"
            options={[
              { value: 'all', label: 'Tous les statuts' },
              ...PROPRIETE_STATUTS.map((statut) => ({
                value: statut,
                label: getStatutLabel(statut)
              }))
            ]}
            className="w-full sm:w-[180px]"
          />
        )}

        {/* Type Filter */}
        {!hiddenFilters.includes('type') && (
          <Select
            value={currentType}
            onChange={(value) => updateFilters('type', value)}
            disabled={isPending}
            placeholder="Type"
            options={[
              { value: 'all', label: 'Tous les types' },
              { value: '_principal', label: 'Propriétés principales' },
              { value: '_multi', label: 'Multi-unités' },
              ...PROPRIETE_TYPES.map((type) => ({
                value: type,
                label: getTypeLabel(type)
              }))
            ]}
            className="w-full sm:w-[180px]"
          />
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
            className="whitespace-nowrap"
          >
            <X className="w-4 h-4 mr-2" />
            Effacer
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Filtres actifs:</span>
          <div className="flex gap-2">
            {currentSearch && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Recherche: "{currentSearch}"
              </span>
            )}
            {currentStatut !== 'all' && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Statut: {getStatutLabel(currentStatut)}
              </span>
            )}
            {currentType !== 'all' && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Type: {getTypeLabel(currentType)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    sourcing: 'En sourcing',
    evaluation: 'En évaluation',
    negociation: 'En négociation',
    achetee: 'Achetée',
    disponible: 'Disponible',
    louee: 'Louée',
    vendue: 'Vendue',
    archive: 'Archivée'
  }
  return labels[statut] || statut
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    // Special filters
    '_principal': 'Propriétés principales',
    '_multi': 'Multi-unités',
    // Property types
    maison: 'Maison',
    appartement: 'Appartement',
    villa: 'Villa',
    studio: 'Studio',
    loft: 'Loft',
    penthouse: 'Penthouse',
    immeuble: 'Immeuble',
    residence: 'Résidence',
    complex_hotelier: 'Complexe hôtelier',
    chalet: 'Chalet',
    bungalow: 'Bungalow',
    riad: 'Riad',
    ferme: 'Ferme',
    terrain: 'Terrain',
    local_commercial: 'Local commercial'
  }
  return labels[type] || type
}