'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Search, Trash2, Loader2 } from 'lucide-react'
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
  deleteProprietaireHard
} from '@/actions/proprietaires'
import { toast } from 'sonner'

interface ProprietairesBrouillonsTableProps {
  proprietaires: any[]
}

export function ProprietairesBrouillonsTable({ proprietaires: initialProprietaires }: ProprietairesBrouillonsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'physique' | 'morale'>('all')
  const [selectedProprietaire, setSelectedProprietaire] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter proprietaires based on search term and type filter
  const filteredProprietaires = initialProprietaires.filter(proprietaire => {
    const matchesSearch = !searchTerm || 
      proprietaire.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proprietaire.numero_identification?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || proprietaire.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const handleDeleteClick = (proprietaire: any) => {
    setSelectedProprietaire(proprietaire)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProprietaire) return

    setIsProcessing(true)
    try {
      const result = await deleteProprietaireHard(selectedProprietaire.id, true)
      
      if (result.success) {
        toast.success('Brouillon supprimé avec succès')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Liste des propriétaires
          </CardTitle>
          <CardDescription>
            Gérez vos propriétaires physiques et morales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou n° identification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={typeFilter === 'physique' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('physique')}
              >
                Physiques
              </Button>
              <Button
                variant={typeFilter === 'morale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('morale')}
              >
                Morales
              </Button>
            </div>
          </div>

          {/* Table */}
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
                    Aucun brouillon trouvé
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
                      {proprietaire.type === 'physique' ? (
                        <div className="text-sm">
                          {proprietaire.nationalite && (
                            <div className="text-gray-600">{proprietaire.nationalite}</div>
                          )}
                          {proprietaire.date_naissance && (
                            <div className="text-gray-500">
                              Né(e) le {new Date(proprietaire.date_naissance).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          {proprietaire.capital_social && (
                            <div className="text-gray-600">
                              Capital: {formatCapitalSocial(proprietaire.capital_social)}
                            </div>
                          )}
                          {proprietaire.nombre_associes !== null && (
                            <div className="text-gray-500">
                              {proprietaire.nombre_associes} associé(s)
                            </div>
                          )}
                          {proprietaire.capital_completion_percent !== null && (
                            <div className="text-gray-500">
                              {formatCapitalCompletion(proprietaire.capital_completion_percent)}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600"
                          onClick={() => handleDeleteClick(proprietaire)}
                          disabled={isProcessing && selectedProprietaire?.id === proprietaire.id}
                          title="Supprimer définitivement"
                        >
                          {isProcessing && selectedProprietaire?.id === proprietaire.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span className="sr-only">Supprimer définitivement</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
    </div>
  )
}