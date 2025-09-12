'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Shield,
  User,
  Building2,
  Euro,
  Calendar,
  Eye
} from 'lucide-react'
import { QuotiteWithProprietaire } from '@/actions/proprietes-quotites'
import { updateProprietaireQuotite, removeProprietaireFromPropriete } from '@/actions/proprietes-quotites'
import { QuotiteDetailModal } from './quotite-detail-modal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// ==============================================================================
// TYPES
// ==============================================================================

interface QuotitesTableProps {
  quotites: QuotiteWithProprietaire[]
  onUpdate: (updatedQuotite: QuotiteWithProprietaire) => void
  onDelete: (quotiteId: string) => void
  quotitesRestantes: number
  proprieteFinancials?: {
    prix_achat?: number
    frais_notaire?: number
    frais_annexes?: number
  }
}

interface EditingState {
  id: string
  field: 'pourcentage' | 'notes'
  value: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuotitesTable({
  quotites,
  onUpdate,
  onDelete,
  quotitesRestantes,
  proprieteFinancials
}: QuotitesTableProps) {
  const router = useRouter()
  const [editingState, setEditingState] = useState<EditingState | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ 
    isOpen: boolean; 
    quotite: QuotiteWithProprietaire | null 
  }>({ isOpen: false, quotite: null })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleEditQuotite = (quotite: QuotiteWithProprietaire) => {
    router.push(`/proprietes/${quotite.propriete_id}/quotites/${quotite.id}/edit`)
  }

  const startEdit = (quotiteId: string, field: 'pourcentage' | 'notes', currentValue: any) => {
    setEditingState({
      id: quotiteId,
      field,
      value: currentValue?.toString() || ''
    })
  }

  const cancelEdit = () => {
    setEditingState(null)
  }

  const saveEdit = async () => {
    if (!editingState) return

    setIsSubmitting(true)
    try {
      const quotite = quotites.find(q => q.id === editingState.id)
      if (!quotite) return

      // Validation pourcentage
      if (editingState.field === 'pourcentage') {
        const newPourcentage = parseFloat(editingState.value)
        const currentTotal = quotites.reduce((sum, q) => 
          q.id === quotite.id ? sum : sum + q.pourcentage, 0
        )
        
        if (newPourcentage + currentTotal > 100) {
          toast.error(`Le total ne peut pas dépasser 100% (actuellement ${currentTotal}% sans ce propriétaire)`)
          setIsSubmitting(false)
          return
        }
      }

      const updateData: any = {}
      if (editingState.field === 'pourcentage') {
        updateData.pourcentage = parseFloat(editingState.value)
      } else if (editingState.field === 'notes') {
        updateData.notes = editingState.value || null
      }

      const result = await updateProprietaireQuotite(quotite.id, updateData)
      
      if (result.success && result.data) {
        onUpdate(result.data)
        setEditingState(null)
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.quotite) return

    setIsSubmitting(true)
    try {
      const result = await removeProprietaireFromPropriete(deleteDialog.quotite.id)
      
      if (result.success) {
        onDelete(deleteDialog.quotite.id)
        setDeleteDialog({ isOpen: false, quotite: null })
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (quotite: QuotiteWithProprietaire) => {
    setDeleteDialog({ isOpen: true, quotite })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, quotite: null })
  }

  // ==============================================================================
  // CALCULATION HELPERS
  // ==============================================================================

  const calculatePrixAcquisition = (quotite: QuotiteWithProprietaire): number | null => {
    if (!proprieteFinancials) return null
    
    const { prix_achat, frais_notaire, frais_annexes } = proprieteFinancials
    
    // Calcul du total investissement
    const totalInvestissement = (prix_achat || 0) + (frais_notaire || 0) + (frais_annexes || 0)
    
    // Si pas d'investissement, retourner null
    if (totalInvestissement === 0) return null
    
    // Calcul du prix d'acquisition = total investissement × pourcentage quotité
    return totalInvestissement * (quotite.pourcentage / 100)
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const formatProprietaire = (proprietaire: QuotiteWithProprietaire['proprietaire'] | any) => {
    if (!proprietaire) return 'Propriétaire non trouvé'
    
    // Handle both direct object and JSONB structure
    const type = proprietaire.type || proprietaire['type']
    const nom = proprietaire.nom || proprietaire['nom']
    const prenom = proprietaire.prenom || proprietaire['prenom']
    
    if (type === 'physique') {
      return `${prenom || ''} ${nom}`.trim()
    }
    return nom
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <>
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[250px]">Propriétaire</TableHead>
              <TableHead className="w-[120px] text-center">Quotité</TableHead>
              <TableHead className="w-[120px] text-center">Statut</TableHead>
              <TableHead className="w-[140px] text-right">Prix acquisition</TableHead>
              <TableHead className="w-[120px] text-center">Date</TableHead>
              <TableHead className="w-[200px]">Notes</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotites.map((quotite) => (
              <TableRow key={quotite.id} className="hover:bg-gray-50 transition-colors">
                {/* Propriétaire */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
                      {formatProprietaire(quotite.proprietaire)?.includes(' ') ? (
                        <User className="w-4 h-4 text-[#D4841A]" />
                      ) : (
                        <Building2 className="w-4 h-4 text-[#D4841A]" />
                      )}
                    </div>
                    <div>
                      <Link 
                        href={`/proprietaires/${quotite.proprietaire_id}`}
                        className="font-medium text-gray-900 hover:text-[#D4841A] hover:underline transition-colors cursor-pointer"
                      >
                        {quotite.proprietaire ? formatProprietaire(quotite.proprietaire) : 'Propriétaire non trouvé'}
                      </Link>
                      {quotite.proprietaire?.email && (
                        <div className="text-xs text-gray-500">
                          {quotite.proprietaire.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Quotité */}
                <TableCell className="text-center">
                  {editingState?.id === quotite.id && editingState.field === 'pourcentage' ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100"
                        value={editingState.value}
                        onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                        className="w-16 h-8 text-center"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveEdit}
                        disabled={isSubmitting}
                        className="w-6 h-6 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="w-6 h-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => startEdit(quotite.id, 'pourcentage', quotite.pourcentage)}
                    >
                      <span className="font-semibold text-[#D4841A]">
                        {quotite.pourcentage}%
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Statut */}
                <TableCell className="text-center">
                  {quotite.is_gerant ? (
                    <Badge className="bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20">
                      <Shield className="w-3 h-3 mr-1" />
                      Gérant
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600">
                      Propriétaire
                    </Badge>
                  )}
                </TableCell>

                {/* Prix acquisition (calculé automatiquement) */}
                <TableCell className="text-right">
                  <div className="px-2 py-1 rounded text-right bg-gray-50 border-l-2 border-[#D4841A]">
                    <div className="flex items-center justify-end gap-1">
                      <Euro className="w-3 h-3 text-[#D4841A]" />
                      <span className="font-medium text-gray-900">
                        {formatCurrency(calculatePrixAcquisition(quotite))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Calculé automatiquement
                    </div>
                  </div>
                </TableCell>

                {/* Date */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {formatDate(quotite.date_acquisition)}
                  </div>
                </TableCell>

                {/* Notes */}
                <TableCell>
                  {editingState?.id === quotite.id && editingState.field === 'notes' ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={editingState.value}
                        onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                        className="h-8"
                        placeholder="Notes..."
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveEdit}
                        disabled={isSubmitting}
                        className="w-6 h-6 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="w-6 h-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm truncate"
                      onClick={() => startEdit(quotite.id, 'notes', quotite.notes)}
                    >
                      {quotite.notes || (
                        <span className="text-gray-400">Ajouter une note...</span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {/* Bouton détails avec modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 hover:bg-blue-100"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                      </DialogTrigger>
                      <QuotiteDetailModal quotite={quotite} />
                    </Dialog>
                    
                    {/* Bouton édition */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 hover:bg-gray-100"
                      onClick={() => handleEditQuotite(quotite)}
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                    
                    {/* Bouton suppression */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(quotite)}
                      className="w-8 h-8 p-0 text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer{' '}
              <strong>{deleteDialog.quotite && formatProprietaire(deleteDialog.quotite.proprietaire)}</strong>{' '}
              de cette propriété ? Cette action libérera {deleteDialog.quotite?.pourcentage}% de quotité.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}