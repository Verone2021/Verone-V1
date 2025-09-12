'use client'

import { useState, useMemo } from 'react'
import { ContratsTable } from '@/components/contrats/contrats-table'
import { ContratCard } from '@/components/contrats/contrat-card'
import { ContractsViewToggle } from '@/components/contrats/contracts-view-toggle'
import { ContractsFilters, type ContractsFilters as ContractsFiltersType } from '@/components/contrats/contracts-filters'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { ContratAvecRelations } from '@/types/contrats'
import { deleteContrat } from '@/actions/contrats'
import { toast } from 'sonner'

interface ContratsPageClientProps {
  initialContrats: ContratAvecRelations[]
  error?: string
}

export function ContratsPageClient({ initialContrats, error }: ContratsPageClientProps) {
  const [view, setView] = useState<'table' | 'cards'>('cards')
  const [contrats, setContrats] = useState(initialContrats)
  const [filters, setFilters] = useState<ContractsFiltersType>({
    search: '',
    type: 'all',
    status: 'all',
    meuble: 'all'
  })

  // ==============================================================================
  // FILTERING LOGIC
  // ==============================================================================
  
  const filteredContrats = useMemo(() => {
    return contrats.filter(contrat => {
      // Recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchable = [
          contrat.propriete_nom,
          contrat.unite_nom,
          contrat.propriete_ville,
          contrat.bailleur_nom,
          contrat.type_contrat
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchable.includes(searchLower)) return false
      }

      // Type de contrat
      if (filters.type !== 'all' && contrat.type_contrat !== filters.type) {
        return false
      }

      // Statut
      if (filters.status !== 'all') {
        const now = new Date()
        const dateDebut = new Date(contrat.date_debut)
        const dateFin = new Date(contrat.date_fin)
        
        let status: string
        if (now < dateDebut) {
          status = 'a_venir'
        } else if (now >= dateDebut && now <= dateFin) {
          status = 'en_cours'
        } else {
          status = 'termine'
        }
        
        if (status !== filters.status) return false
      }

      // Meublé
      if (filters.meuble !== 'all') {
        const isCurrentlyMeuble = contrat.meuble
        if (filters.meuble === 'meuble' && !isCurrentlyMeuble) return false
        if (filters.meuble === 'non_meuble' && isCurrentlyMeuble) return false
      }

      // Dates
      if (filters.dateDebut && contrat.date_debut < filters.dateDebut) return false
      if (filters.dateFin && contrat.date_fin > filters.dateFin) return false

      return true
    })
  }, [contrats, filters])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleDelete = async (contratId: string) => {
    try {
      const result = await deleteContrat(contratId)
      
      if (result.success) {
        setContrats(prev => prev.filter(c => c.id !== contratId))
        toast.success('Contrat supprimé avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur inattendue lors de la suppression')
    }
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contrats</h1>
          <p className="text-gray-600 mt-1">
            Gestion des contrats de location
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/contrats/new">
            <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau contrat
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtres et Toggle */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex-1">
          <ContractsFilters
            filters={filters}
            onFiltersChange={setFilters}
            resultsCount={filteredContrats.length}
          />
        </div>
        <div className="flex-shrink-0">
          <ContractsViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Contenu principal */}
      {filteredContrats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {contrats.length === 0 ? 'Aucun contrat' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 mb-4">
            {contrats.length === 0
              ? 'Vous n\'avez pas encore créé de contrat.'
              : 'Aucun contrat ne correspond à vos critères de recherche.'}
          </p>
          {contrats.length === 0 && (
            <Link href="/contrats/new">
              <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
                Créer votre premier contrat
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {view === 'table' ? (
            <ContratsTable contrats={filteredContrats} />
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContrats.map((contrat) => (
                  <ContratCard
                    key={contrat.id}
                    contrat={contrat}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}