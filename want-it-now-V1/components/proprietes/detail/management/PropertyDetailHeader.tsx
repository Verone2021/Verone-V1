'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  Trash2,
  Power,
  RotateCcw,
  MoreVertical,
  ArrowLeft,
  Loader2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deletePropriete, updateProprieteStatus } from '@/actions/proprietes'
import { cn, formatCurrency } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface PropertyDetailHeaderProps {
  property: ProprieteListItem
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function PropertyDetailHeader({
  property,
  isAdmin,
  isSuperAdmin
}: PropertyDetailHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiveProcessing, setIsArchiveProcessing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean
    action: 'archive' | 'unarchive' | null
  }>({
    isOpen: false,
    action: null
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deletePropriete(property.id)
      
      if (result.success) {
        toast.success('Propriété supprimée avec succès')
        router.push('/proprietes')
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur inattendue lors de la suppression')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleArchiveAction = async (action: 'archive' | 'unarchive') => {
    setIsArchiveProcessing(true)
    setArchiveModal({ isOpen: false, action: null })
    
    try {
      const newStatus = action === 'archive' ? 'archive' : 'disponible'
      const result = await updateProprieteStatus(property.id, newStatus)
      
      if (result.success) {
        toast.success(
          action === 'archive' 
            ? 'Propriété archivée avec succès' 
            : 'Propriété désarchivée avec succès'
        )
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsArchiveProcessing(false)
    }
  }

  const getStatusBadge = (statut: string, libelle: string) => {
    const variants: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-700 border-gray-300',
      sourcing: 'bg-blue-100 text-blue-700 border-blue-300',
      evaluation: 'bg-purple-100 text-purple-700 border-purple-300',
      negociation: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      achetee: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      travaux: 'bg-orange-100 text-orange-700 border-orange-300',
      commercialisable: 'bg-green-100 text-green-700 border-green-300',
      disponible: 'bg-green-100 text-green-700 border-green-300',
      louee: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      vendue: 'bg-teal-100 text-teal-700 border-teal-300',
      archive: 'bg-red-100 text-red-700 border-red-300',
      retiree_marche: 'bg-gray-100 text-gray-700 border-gray-300'
    }

    return (
      <Badge 
        variant="outline" 
        className={cn('text-sm font-medium', variants[statut] || variants.brouillon)}
      >
        {libelle}
      </Badge>
    )
  }

  const getTypeBadge = (type: string, libelle: string) => {
    const isMultiUnit = ['immeuble', 'residence', 'complex_hotelier'].includes(type)
    
    return (
      <Badge 
        variant={isMultiUnit ? 'default' : 'outline'}
        className={isMultiUnit ? 'bg-brand-copper text-white border-brand-copper' : 'text-sm'}
      >
        {libelle}
      </Badge>
    )
  }

  return (
    <>
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/proprietes" className="hover:text-gray-700">
              Propriétés
            </Link>
            <span className="mx-2">→</span>
            <span className="text-gray-900">{property.nom}</span>
          </div>

          {/* Header principale */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {property.nom}
                </h1>
                {getStatusBadge(property.statut, property.statut_libelle)}
                {getTypeBadge(property.type, property.type_libelle)}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Réf:</span>
                  <span className="font-mono">{property.reference}</span>
                </div>
                
                {property.ville && (
                  <div className="flex items-center gap-1">
                    <span>{property.ville}</span>
                    {property.pays && <span>• {property.pays}</span>}
                  </div>
                )}

                {property.valeur_actuelle && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Valeur:</span>
                    <span className="font-semibold text-brand-copper">
                      {formatCurrency(property.valeur_actuelle)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats rapides */}
              <div className="flex items-center gap-4 text-sm">
                {property.a_unites && (
                  <div className="text-gray-600">
                    <span className="font-medium">{property.unites_count || 0}</span> unité{(property.unites_count || 0) > 1 ? 's' : ''}
                  </div>
                )}
                
                {property.capacite_max && (
                  <div className="text-gray-600">
                    <span className="font-medium">{property.capacite_max}</span> personne{property.capacite_max > 1 ? 's' : ''}
                  </div>
                )}

                <div className="text-gray-600">
                  <span className="font-medium">{property.photos_count || 0}</span> photo{(property.photos_count || 0) > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Bouton Aperçu - Nouveau */}
              <Button
                variant="outline"
                asChild
                className="border-brand-copper text-brand-copper hover:bg-brand-copper hover:text-white"
              >
                <Link href={`/proprietes/${property.id}/preview`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Link>
              </Button>

              {/* Actions admin */}
              {(isAdmin || isSuperAdmin) && (
                <>
                  <Button variant="outline" asChild>
                    <Link href={`/proprietes/${property.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {property.statut === 'archive' ? (
                        <DropdownMenuItem
                          onClick={() => setArchiveModal({ isOpen: true, action: 'unarchive' })}
                          disabled={isArchiveProcessing}
                          className="text-green-600"
                        >
                          {isArchiveProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-2" />
                          )}
                          Désarchiver
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setArchiveModal({ isOpen: true, action: 'archive' })}
                          disabled={isArchiveProcessing}
                          className="text-orange-600"
                        >
                          {isArchiveProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Power className="w-4 h-4 mr-2" />
                          )}
                          Archiver
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={isDeleting}
                        className="text-red-600"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Supprimer définitivement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La propriété{' '}
              <span className="font-semibold">{property.nom}</span>{' '}
              sera définitivement supprimée, ainsi que toutes ses unités et photos associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveModal.isOpen} onOpenChange={(open) => {
        if (!open) setArchiveModal({ isOpen: false, action: null })
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveModal.action === 'archive' ? 'Archiver la propriété' : 'Désarchiver la propriété'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveModal.action === 'archive' ?
                `Archiver "${property.nom}" la rendra invisible dans les listes actives mais conservera toutes les données. Elle pourra être désarchivée plus tard.` :
                `Désarchiver "${property.nom}" la rendra à nouveau visible et disponible.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiveProcessing}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveModal.action && handleArchiveAction(archiveModal.action)}
              disabled={isArchiveProcessing}
              className={
                archiveModal.action === 'archive' 
                  ? "bg-orange-600 hover:bg-orange-700" 
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
    </>
  )
}