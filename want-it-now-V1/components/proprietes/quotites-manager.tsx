'use client'

import { useState, useTransition } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Percent,
  Calendar,
  DollarSign,
  AlertCircle,
  Check,
  X,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { 
  addProprietaireToPropriete,
  updateProprietaireQuotite,
  removeProprietaireFromPropriete,
  searchAvailableProprietaires,
  type QuotiteWithProprietaire,
  type QuotitesStats
} from '@/actions/proprietes-quotites'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

// ==============================================================================
// TYPES
// ==============================================================================

interface QuotitesManagerProps {
  proprieteId: string
  initialQuotites: QuotiteWithProprietaire[]
  initialStats: QuotitesStats | null
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export function QuotitesManager({ 
  proprieteId, 
  initialQuotites,
  initialStats
}: QuotitesManagerProps) {
  const [quotites, setQuotites] = useState(initialQuotites)
  const [stats, setStats] = useState(initialStats)
  const [isPending, startTransition] = useTransition()
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedQuotite, setSelectedQuotite] = useState<QuotiteWithProprietaire | null>(null)
  
  // Form states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedProprietaire, setSelectedProprietaire] = useState<string>('')
  const [formData, setFormData] = useState({
    pourcentage: '',
    date_acquisition: '',
    prix_acquisition: '',
    frais_acquisition: '',
    notes: ''
  })

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    
    startTransition(async () => {
      const result = await searchAvailableProprietaires(proprieteId, searchQuery)
      if (result.success) {
        setSearchResults(result.data || [])
      }
    })
  }

  const handleAdd = async () => {
    if (!selectedProprietaire || !formData.pourcentage) {
      toast.error('Veuillez sélectionner un propriétaire et saisir un pourcentage')
      return
    }

    startTransition(async () => {
      const result = await addProprietaireToPropriete({
        propriete_id: proprieteId,
        proprietaire_id: selectedProprietaire,
        pourcentage: parseFloat(formData.pourcentage),
        date_acquisition: formData.date_acquisition || undefined,
        prix_acquisition: formData.prix_acquisition ? parseFloat(formData.prix_acquisition) : undefined,
        frais_acquisition: formData.frais_acquisition ? parseFloat(formData.frais_acquisition) : undefined,
        notes: formData.notes || undefined
      })

      if (result.success && result.data) {
        setQuotites([...quotites, result.data])
        updateStats()
        setShowAddDialog(false)
        resetForm()
        toast.success('Propriétaire ajouté avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout')
      }
    })
  }

  const handleEdit = async () => {
    if (!selectedQuotite) return

    startTransition(async () => {
      const result = await updateProprietaireQuotite(selectedQuotite.id, {
        pourcentage: formData.pourcentage ? parseFloat(formData.pourcentage) : undefined,
        date_acquisition: formData.date_acquisition || undefined,
        prix_acquisition: formData.prix_acquisition ? parseFloat(formData.prix_acquisition) : undefined,
        frais_acquisition: formData.frais_acquisition ? parseFloat(formData.frais_acquisition) : undefined,
        notes: formData.notes || undefined
      })

      if (result.success && result.data) {
        setQuotites(quotites.map(q => q.id === result.data!.id ? result.data! : q))
        updateStats()
        setShowEditDialog(false)
        setSelectedQuotite(null)
        resetForm()
        toast.success('Quotité mise à jour avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    })
  }

  const handleDelete = async () => {
    if (!selectedQuotite) return

    startTransition(async () => {
      const result = await removeProprietaireFromPropriete(selectedQuotite.id)

      if (result.success) {
        setQuotites(quotites.filter(q => q.id !== selectedQuotite.id))
        updateStats()
        setShowDeleteDialog(false)
        setSelectedQuotite(null)
        toast.success('Propriétaire retiré avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    })
  }

  const updateStats = () => {
    const total = quotites.reduce((sum, q) => sum + q.pourcentage, 0)
    if (stats) {
      setStats({
        ...stats,
        nombre_proprietaires: quotites.length,
        total_pourcentage: total,
        pourcentage_disponible: 100 - total,
        statut_quotites: total === 100 ? 'complet' : total > 100 ? 'erreur' : total > 0 ? 'partiel' : 'vide'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pourcentage: '',
      date_acquisition: '',
      prix_acquisition: '',
      frais_acquisition: '',
      notes: ''
    })
    setSelectedProprietaire('')
    setSearchQuery('')
    setSearchResults([])
  }

  const openEditDialog = (quotite: QuotiteWithProprietaire) => {
    setSelectedQuotite(quotite)
    setFormData({
      pourcentage: quotite.pourcentage.toString(),
      date_acquisition: quotite.date_acquisition || '',
      prix_acquisition: quotite.prix_acquisition?.toString() || '',
      frais_acquisition: quotite.frais_acquisition?.toString() || '',
      notes: quotite.notes || ''
    })
    setShowEditDialog(true)
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  const totalPourcentage = stats?.total_pourcentage || 0
  const pourcentageDisponible = stats?.pourcentage_disponible || 100

  return (
    <div className="space-y-6 bg-white rounded-lg p-6">
      {/* Stats Bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Répartition des quotités</span>
            {totalPourcentage === 100 ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {totalPourcentage}% attribués
              </Badge>
            ) : totalPourcentage > 100 ? (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                {totalPourcentage}% attribués
              </Badge>
            ) : (
              <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
                {totalPourcentage}% attribués
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {pourcentageDisponible > 0 ? `${pourcentageDisponible}% disponibles` : ''}
          </span>
        </div>
        <Progress value={Math.min(totalPourcentage, 100)} className="h-2" />
        {totalPourcentage > 100 && (
          <div className="flex items-center gap-2 mt-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Le total dépasse 100% - Vérifiez les quotités</span>
          </div>
        )}
      </div>

      {/* Liste des propriétaires */}
      <div className="space-y-3">
        {quotites.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun propriétaire associé</p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-[#D4841A] hover:bg-[#B8741A] text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un propriétaire
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {quotites.map((quotite) => (
              <Card key={quotite.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {quotite.proprietaire.prenom} {quotite.proprietaire.nom}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {quotite.pourcentage}%
                            </span>
                            {quotite.date_acquisition && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(quotite.date_acquisition), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            )}
                            {quotite.prix_acquisition && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(quotite.prix_acquisition)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(quotite)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuotite(quotite)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {quotite.notes && (
                    <p className="text-sm text-muted-foreground mt-2 pl-13">
                      {quotite.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <Button 
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              className="w-full border-[#D4841A] text-[#D4841A] hover:bg-[#D4841A] hover:text-white transition-all duration-200"
              disabled={pourcentageDisponible <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un propriétaire
            </Button>
          </>
        )}
      </div>

      {/* Dialog Ajouter */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un propriétaire</DialogTitle>
            <DialogDescription>
              Associez un propriétaire existant à cette propriété avec sa quotité
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Recherche propriétaire */}
            <div className="space-y-2">
              <Label>Rechercher un propriétaire</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  placeholder="Nom, prénom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  variant="outline"
                  className="border-[#D4841A] text-[#D4841A] hover:bg-[#D4841A] hover:text-white transition-all duration-200"
                >
                  Rechercher
                </Button>
              </div>
              {searchResults.length > 0 && (
                <RadixSelect value={selectedProprietaire} onValueChange={setSelectedProprietaire}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un propriétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchResults.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.prenom} {p.nom} ({p.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect>
              )}
            </div>

            {/* Pourcentage */}
            <div className="space-y-2">
              <Label>Pourcentage de détention *</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="number"
                min="0.01"
                max={pourcentageDisponible}
                step="0.01"
                value={formData.pourcentage}
                onChange={(e) => setFormData({...formData, pourcentage: e.target.value})}
                placeholder={`Max: ${pourcentageDisponible}%`}
              />
            </div>

            {/* Date acquisition */}
            <div className="space-y-2">
              <Label>Date d'acquisition</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="date"
                value={formData.date_acquisition}
                onChange={(e) => setFormData({...formData, date_acquisition: e.target.value})}
              />
            </div>

            {/* Prix acquisition */}
            <div className="space-y-2">
              <Label>Prix d'acquisition</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="number"
                min="0"
                step="0.01"
                value={formData.prix_acquisition}
                onChange={(e) => setFormData({...formData, prix_acquisition: e.target.value})}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={isPending || !selectedProprietaire || !formData.pourcentage}
              className="bg-[#D4841A] hover:bg-[#B8741A] text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier la quotité</DialogTitle>
            <DialogDescription>
              Modifiez les informations de détention pour ce propriétaire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Propriétaire (lecture seule) */}
            <div className="space-y-2">
              <Label>Propriétaire</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                {selectedQuotite?.proprietaire.prenom} {selectedQuotite?.proprietaire.nom}
              </div>
            </div>

            {/* Pourcentage */}
            <div className="space-y-2">
              <Label>Pourcentage de détention *</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={formData.pourcentage}
                onChange={(e) => setFormData({...formData, pourcentage: e.target.value})}
              />
            </div>

            {/* Date acquisition */}
            <div className="space-y-2">
              <Label>Date d'acquisition</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="date"
                value={formData.date_acquisition}
                onChange={(e) => setFormData({...formData, date_acquisition: e.target.value})}
              />
            </div>

            {/* Prix acquisition */}
            <div className="space-y-2">
              <Label>Prix d'acquisition</Label>
              <Input
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                type="number"
                min="0"
                step="0.01"
                value={formData.prix_acquisition}
                onChange={(e) => setFormData({...formData, prix_acquisition: e.target.value})}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={isPending}
              className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Supprimer */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer {selectedQuotite?.proprietaire.prenom} {selectedQuotite?.proprietaire.nom} 
              de cette propriété ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}