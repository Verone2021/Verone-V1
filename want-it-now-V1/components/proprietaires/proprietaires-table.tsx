'use client'

import { useState, useTransition, useOptimistic } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Search, Power, RotateCcw, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  formatProprietaireNomComplet,
  formatProprietaireType,
  formatCapitalSocial,
  formatCapitalCompletion,
  getBrouillonBadgeColor,
  getBrouillonBadgeText,
  getTypeBadgeColor,
} from '@/lib/utils/proprietaires'
import { 
  deactivateProprietaire,
  updateProprietaireStatus
} from '@/actions/proprietaires'
import { toast } from 'sonner'

interface ProprietairesTableProps {
  proprietaires: any[]
}

export function ProprietairesTable({ proprietaires: initialProprietaires }: ProprietairesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticProprietaires, addOptimisticUpdate] = useOptimistic(
    initialProprietaires,
    (state, { id, updates }: { id: string; updates: any }) => 
      state.map(p => p.id === id ? { ...p, ...updates } : p)
  )
  
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'physique' | 'morale'>('all')
  const [isArchiveProcessing, setIsArchiveProcessing] = useState(false)
  const [selectedProprietaire, setSelectedProprietaire] = useState<any>(null)
  
  // Archive/Unarchive modal state (exactly like proprietes)
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean
    action: 'archive' | 'unarchive' | null
  }>({
    isOpen: false,
    action: null
  })
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filter proprietaires based on search and type - use optimistic data
  const filteredProprietaires = optimisticProprietaires.filter(proprietaire => {
    const matchesSearch = searchTerm === '' || 
      formatProprietaireNomComplet(proprietaire).toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.numero_identification?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || proprietaire.type === typeFilter

    return matchesSearch && matchesType
  })

  // Event handlers (following proprietes pattern exactly)
  const handleArchiveClick = (proprietaire: any) => {
    setSelectedProprietaire(proprietaire)
    setArchiveModal({
      isOpen: true,
      action: 'archive'
    })
  }

  const handleUnarchiveClick = (proprietaire: any) => {
    setSelectedProprietaire(proprietaire)
    setArchiveModal({
      isOpen: true,
      action: 'unarchive'
    })
  }


  const handleConfirmArchiveAction = async () => {
    if (!selectedProprietaire || !archiveModal.action) return

    setIsArchiveProcessing(true)
    try {
      if (archiveModal.action === 'archive') {
        // Utiliser deactivateProprietaire pour l'archivage
        const result = await deactivateProprietaire(selectedProprietaire.id)
        
        if (result.ok) {
          toast.success('Propriétaire archivé avec succès')
          router.refresh()
        } else {
          toast.error(result.error || 'Erreur lors de l\'archivage')
        }
      } else {
        // Utiliser updateProprietaireStatus pour la désarchivage
        const result = await updateProprietaireStatus(selectedProprietaire.id, 'active')
        
        if (result.ok) {
          toast.success('Propriétaire désarchivé avec succès')
          router.refresh()
        } else {
          toast.error(result.error || 'Erreur lors de la modification')
        }
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsArchiveProcessing(false)
      setArchiveModal({ isOpen: false, action: null })
      setSelectedProprietaire(null)
    }
  }

  const handleCancelArchiveAction = () => {
    setArchiveModal({ isOpen: false, action: null })
    setSelectedProprietaire(null)
  }


  return (
    <Card className="modern-shadow">
      {/* Error message display */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md m-4">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Liste des propriétaires</CardTitle>
            <CardDescription>
              Gérez vos propriétaires physiques et morales
            </CardDescription>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, email ou n° identification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              Tous
            </Button>
            <Button
              variant={typeFilter === 'physique' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('physique')}
            >
              Physiques
            </Button>
            <Button
              variant={typeFilter === 'morale' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('morale')}
            >
              Morales
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Informations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProprietaires.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucun propriétaire trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredProprietaires.map((proprietaire) => (
                  <TableRow key={proprietaire.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/proprietaires/${proprietaire.id}`}
                        className="text-gray-900 hover:text-brand-copper transition-colors"
                      >
                        {formatProprietaireNomComplet(proprietaire)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeBadgeColor(proprietaire.type)}>
                        {formatProprietaireType(proprietaire.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {proprietaire.email && (
                          <div className="text-gray-600">{proprietaire.email}</div>
                        )}
                        {proprietaire.telephone && (
                          <div className="text-gray-500">{proprietaire.telephone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getBrouillonBadgeColor(proprietaire.is_brouillon)}
                      >
                        {getBrouillonBadgeText(proprietaire.is_brouillon)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proprietaire.type === 'morale' ? (
                        <div className="text-sm text-gray-600">
                          {proprietaire.capital_social && (
                            <div>Capital: {formatCapitalSocial(proprietaire.capital_social)}</div>
                          )}
                          {proprietaire.nombre_associes > 0 && (
                            <div>{proprietaire.nombre_associes} associé(s)</div>
                          )}
                          {proprietaire.capital_completion_percent !== null && (
                            <div className="text-xs text-gray-500">
                              {formatCapitalCompletion(proprietaire.capital_completion_percent)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {proprietaire.nationalite && (
                            <div>{proprietaire.nationalite}</div>
                          )}
                          {proprietaire.date_naissance && (
                            <div className="text-xs text-gray-500">
                              Né(e) le {new Date(proprietaire.date_naissance).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Actions - Fixed alignment with consistent widths */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 min-w-[150px]">
                        <Link href={`/proprietaires/${proprietaire.id}`}>
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0" title="Voir les détails">
                            <Eye size={14} />
                            <span className="sr-only">Voir</span>
                          </Button>
                        </Link>
                        <Link href={`/proprietaires/${proprietaire.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                            <Edit size={14} />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </Link>
                        {!proprietaire.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                            onClick={() => handleUnarchiveClick(proprietaire)}
                            disabled={isArchiveProcessing && selectedProprietaire?.id === proprietaire.id}
                            title="Désarchiver le propriétaire"
                          >
                            {isArchiveProcessing && selectedProprietaire?.id === proprietaire.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RotateCcw size={14} />
                            )}
                            <span className="sr-only">Désarchiver</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveClick(proprietaire)}
                            disabled={isArchiveProcessing && selectedProprietaire?.id === proprietaire.id}
                            title="Archiver le propriétaire"
                          >
                            {isArchiveProcessing && selectedProprietaire?.id === proprietaire.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            <span className="sr-only">Archiver</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>


      {/* Archive Confirmation Dialog - EXACTLY like proprietes */}
      {selectedProprietaire && (
        <AlertDialog open={archiveModal.isOpen} onOpenChange={(open) => {
          if (!open) handleCancelArchiveAction()
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {
                  archiveModal.action === 'archive' ? 'Archiver le propriétaire' :
                  archiveModal.action === 'unarchive' ? 'Désarchiver le propriétaire' :
                  'Confirmer l\'action'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {
                  archiveModal.action === 'archive' ?
                    `Archiver "${formatProprietaireNomComplet(selectedProprietaire)}" le rendra invisible dans les listes actives mais conservera toutes les données. Il pourra être désarchivé plus tard.` :
                  archiveModal.action === 'unarchive' ?
                    `Désarchiver "${formatProprietaireNomComplet(selectedProprietaire)}" le rendra à nouveau visible et disponible.` :
                  ''
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isArchiveProcessing}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmArchiveAction}
                disabled={isArchiveProcessing}
                className={
                  archiveModal.action === 'archive' 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {isArchiveProcessing ? (
                  archiveModal.action === 'archive' ? 'Archivage...' : 'Désarchivage...'
                ) : (
                  archiveModal.action === 'archive' ? 'Archiver' : 'Désarchiver'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  )
}