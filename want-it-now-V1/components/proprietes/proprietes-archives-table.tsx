'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, RotateCcw, Search, Trash2, Clock, Calendar, MapPin, Building } from 'lucide-react'
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
import { restorePropriete, deleteProprieteHard } from '@/actions/proprietes'
import { toast } from 'sonner'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface ProprieteWithDays extends ProprieteListItem {
  daysSinceArchive: number
}

interface ProprietesArchivesTableProps {
  proprietes: ProprieteWithDays[]
}

export function ProprietesArchivesTable({ proprietes: initialProprietes }: ProprietesArchivesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'appartement' | 'maison' | 'villa' | 'studio' | 'autre'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPropriete, setSelectedPropriete] = useState<ProprieteWithDays | null>(null)
  
  // Restore modal state
  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    propriete: null as ProprieteWithDays | null
  })
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filter proprietes based on search and type
  const filteredProprietes = initialProprietes.filter(propriete => {
    const matchesSearch = searchTerm === '' || 
      propriete.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propriete.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propriete.ville?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || propriete.type === typeFilter

    return matchesSearch && matchesType
  })

  const handleRestoreClick = (propriete: ProprieteWithDays) => {
    setRestoreModal({
      isOpen: true,
      propriete
    })
  }

  const handleDeleteClick = (propriete: ProprieteWithDays) => {
    setSelectedPropriete(propriete)
    setDeleteDialogOpen(true)
  }

  const handleConfirmRestore = async () => {
    if (!restoreModal.propriete) return

    setIsProcessing(true)
    try {
      const result = await restorePropriete(restoreModal.propriete.id)

      if (result.success) {
        toast.success('Propriété restaurée avec succès')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la restauration')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsProcessing(false)
      setRestoreModal({ isOpen: false, propriete: null })
    }
  }

  const handleCancelRestore = () => {
    setRestoreModal({ isOpen: false, propriete: null })
  }

  const handleConfirmDelete = async () => {
    if (!selectedPropriete) return

    setIsProcessing(true)
    try {
      const result = await deleteProprieteHard(selectedPropriete.id, true)
      
      if (result.success) {
        toast.success('Propriété supprimée définitivement')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression définitive')
      }
    } catch (error) {
      toast.error('Erreur inattendue lors de la suppression')
    } finally {
      setIsProcessing(false)
      setDeleteDialogOpen(false)
      setSelectedPropriete(null)
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'appartement': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maison': return 'bg-green-100 text-green-800 border-green-200'
      case 'villa': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'studio': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <Card className="modern-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Propriétés Archivées</CardTitle>
              <CardDescription>
                {filteredProprietes.length} propriété(s) archivée(s)
              </CardDescription>
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, référence, ville..."
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
                variant={typeFilter === 'appartement' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('appartement')}
              >
                Appartements
              </Button>
              <Button
                variant={typeFilter === 'maison' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('maison')}
              >
                Maisons
              </Button>
              <Button
                variant={typeFilter === 'villa' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('villa')}
              >
                Villas
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriété</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Date archivage</TableHead>
                  <TableHead>Jours écoulés</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProprietes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucune propriété archivée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProprietes.map((propriete) => (
                    <TableRow key={propriete.id} className="bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-[#D4841A]" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {propriete.nom}
                            </div>
                            {propriete.reference && (
                              <div className="text-sm text-gray-500">
                                Réf: {propriete.reference}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeColor(propriete.type)}>
                          {propriete.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {propriete.ville || 'Non spécifiée'}
                            {propriete.pays && propriete.pays !== 'FR' && ` (${propriete.pays})`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {propriete.updated_at 
                              ? formatArchiveDate(propriete.updated_at)
                              : 'Date inconnue'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getDaysBadgeColor(propriete.daysSinceArchive)}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {propriete.daysSinceArchive} jour{propriete.daysSinceArchive !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 min-w-[150px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                            onClick={() => handleRestoreClick(propriete)}
                            disabled={isProcessing}
                            title="Restaurer la propriété"
                          >
                            <RotateCcw size={14} />
                            <span className="sr-only">Restaurer</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600"
                            onClick={() => handleDeleteClick(propriete)}
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
              Cette action est irréversible. La propriété{' '}
              <span className="font-semibold">{selectedPropriete?.nom}</span>{' '}
              sera définitivement supprimée de la base de données, ainsi que toutes ses données associées (unités, photos, etc.).
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
            <AlertDialogTitle>Restaurer la propriété</AlertDialogTitle>
            <AlertDialogDescription>
              Restaurer "{restoreModal.propriete?.nom}" 
              la rendra à nouveau visible et active dans la liste principale.
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