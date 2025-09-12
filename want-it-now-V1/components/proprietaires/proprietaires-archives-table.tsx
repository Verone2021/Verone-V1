'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, RotateCcw, Search, Trash2, Clock, Calendar } from 'lucide-react'
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
  getTypeBadgeColor,
} from '@/lib/utils/proprietaires'
import { 
  updateProprietaireStatus,
  deleteProprietaireHard
} from '@/actions/proprietaires'
import { toast } from 'sonner'

interface ProprietairesArchivesTableProps {
  proprietaires: any[]
}

export function ProprietairesArchivesTable({ proprietaires: initialProprietaires }: ProprietairesArchivesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'physique' | 'morale'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedProprietaire, setSelectedProprietaire] = useState<any>(null)
  
  // Restore modal state
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    proprietaire: null as any
  })
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filter proprietaires based on search and type
  const filteredProprietaires = initialProprietaires.filter(proprietaire => {
    const matchesSearch = searchTerm === '' || 
      formatProprietaireNomComplet(proprietaire).toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || proprietaire.type === typeFilter

    return matchesSearch && matchesType
  })

  const handleRestoreClick = (proprietaire: any) => {
    setRestoreModal({
      isOpen: true,
      proprietaire
    })
  }

  const handleDeleteClick = (proprietaire: any) => {
    setSelectedProprietaire(proprietaire)
    setDeleteDialogOpen(true)
  }

  const handleConfirmRestore = async () => {
    if (!restoreModal.proprietaire) return

    setIsProcessing(true)
    try {
      const result = await updateProprietaireStatus(restoreModal.proprietaire.id, 'active')

      if (result.ok) {
        toast.success('Propriétaire restauré avec succès')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la restauration')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsProcessing(false)
      setRestoreModal({ isOpen: false, proprietaire: null })
    }
  }

  const handleCancelRestore = () => {
    setRestoreModal({ isOpen: false, proprietaire: null })
  }

  const handleConfirmDelete = async () => {
    if (!selectedProprietaire) return

    setIsProcessing(true)
    try {
      const result = await deleteProprietaireHard(selectedProprietaire.id, true)
      
      if (result.success) {
        toast.success('Propriétaire supprimé définitivement')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression définitive')
      }
    } catch (error) {
      toast.error('Erreur inattendue lors de la suppression')
    } finally {
      setIsProcessing(false)
      setDeleteDialogOpen(false)
      setSelectedProprietaire(null)
    }
  }

  const formatArchiveDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysBadgeColor = (days: number) => {
    if (days <= 7) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (days <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <>
      <Card className="modern-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Propriétaires Archivés</CardTitle>
              <CardDescription>
                {filteredProprietaires.length} propriétaire(s) archivé(s)
              </CardDescription>
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email..."
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
                  <TableHead>Date archivage</TableHead>
                  <TableHead>Jours écoulés</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProprietaires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun propriétaire archivé trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProprietaires.map((proprietaire) => (
                    <TableRow key={proprietaire.id} className="bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="text-gray-900">
                            {formatProprietaireNomComplet(proprietaire)}
                          </div>
                        </div>
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
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {proprietaire.updated_at 
                              ? formatArchiveDate(proprietaire.updated_at)
                              : 'Date inconnue'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getDaysBadgeColor(proprietaire.daysSinceArchive)}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {proprietaire.daysSinceArchive} jour{proprietaire.daysSinceArchive !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 min-w-[150px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                            onClick={() => handleRestoreClick(proprietaire)}
                            disabled={isProcessing}
                            title="Restaurer le propriétaire"
                          >
                            <RotateCcw size={14} />
                            <span className="sr-only">Restaurer</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600"
                            onClick={() => handleDeleteClick(proprietaire)}
                            disabled={isProcessing}
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={14} />
                            <span className="sr-only">Supprimer définitivement</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le propriétaire{' '}
              <span className="font-semibold">{selectedProprietaire && formatProprietaireNomComplet(selectedProprietaire)}</span>{' '}
              sera définitivement supprimé de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreModal.isOpen} onOpenChange={(open) => {
        if (!open) handleCancelRestore()
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer le propriétaire</AlertDialogTitle>
            <AlertDialogDescription>
              Restaurer "{restoreModal.proprietaire && formatProprietaireNomComplet(restoreModal.proprietaire)}" 
              le rendra à nouveau visible et disponible dans la liste principale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Restauration...' : 'Restaurer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}