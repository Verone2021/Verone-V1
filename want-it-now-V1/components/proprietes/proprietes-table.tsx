'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Eye, 
  Edit, 
  Power,
  RotateCcw,
  Loader2,
  Building2,
  MapPin,
  Users,
  Image,
  Home,
  Euro
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { updateProprieteStatus } from '@/actions/proprietes'
import { formatCurrency, cn } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface ProprietesTableProps {
  properties: ProprieteListItem[]
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function ProprietesTable({ 
  properties, 
  isAdmin, 
  isSuperAdmin 
}: ProprietesTableProps) {
  const router = useRouter()
  const [selectedProperty, setSelectedProperty] = useState<ProprieteListItem | null>(null)
  const [isArchiveProcessing, setIsArchiveProcessing] = useState(false)
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean
    action: 'archive' | 'unarchive' | null
  }>({
    isOpen: false,
    action: null
  })

  // Helper functions inside the component
  const getTypeBadge = (type: string, libelle?: string) => {
    const isMultiUnit = ['immeuble', 'residence', 'complex_hotelier'].includes(type)
    
    return (
      <Badge 
        variant={isMultiUnit ? 'default' : 'outline'}
        className={cn(
          "text-xs",
          isMultiUnit ? 'bg-brand-copper text-white' : ''
        )}
      >
        {libelle || type}
      </Badge>
    )
  }

  const getStatusBadge = (status: string, libelle?: string) => {
    const getStatusVariant = (status: string) => {
      switch (status) {
        case 'disponible':
        case 'commercialisable':
          return 'default'
        case 'louee':
          return 'secondary'
        case 'vendue':
          return 'outline'
        case 'brouillon':
          return 'outline'
        case 'sourcing':
          return 'secondary'
        case 'evaluation':
          return 'secondary'
        case 'negociation':
          return 'secondary'
        case 'achetee':
          return 'default'
        default:
          return 'outline'
      }
    }

    return (
      <Badge variant={getStatusVariant(status)} className="text-xs">
        {libelle || status}
      </Badge>
    )
  }

  const getPropertyCreationDate = (createdAt: string) => {
    const created = new Date(createdAt)
    return created.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Event handlers
  const handleArchiveClick = (property: ProprieteListItem) => {
    setSelectedProperty(property)
    setArchiveModal({
      isOpen: true,
      action: 'archive'
    })
  }

  const handleUnarchiveClick = (property: ProprieteListItem) => {
    setSelectedProperty(property)
    setArchiveModal({
      isOpen: true,
      action: 'unarchive'
    })
  }

  const handleConfirmArchiveAction = async () => {
    if (!selectedProperty || !archiveModal.action) return

    setIsArchiveProcessing(true)
    try {
      const newStatus = archiveModal.action === 'archive' ? 'archive' : 'active'
      const result = await updateProprieteStatus(selectedProperty.id, newStatus)

      if (result.success) {
        const message = archiveModal.action === 'archive' 
          ? 'Propriété archivée avec succès'
          : 'Propriété désarchivée avec succès'
        toast.success(message)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsArchiveProcessing(false)
      setArchiveModal({ isOpen: false, action: null })
      setSelectedProperty(null)
    }
  }

  const handleCancelArchiveAction = () => {
    setArchiveModal({ isOpen: false, action: null })
    setSelectedProperty(null)
  }

  // Main render logic
  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune propriété trouvée</h3>
        <p className="text-gray-500 mb-4">
          Commencez par créer votre première propriété
        </p>
        <Button
          onClick={() => router.push('/proprietes/new')}
          className="gradient-copper text-white"
        >
          Créer une propriété
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Photo</TableHead>
              <TableHead>Propriété</TableHead>
              <TableHead>Type & Configuration</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Statut & Disponibilité</TableHead>
              <TableHead>Informations Clés</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                {/* Photo Column */}
                <TableCell>
                  {property.cover_photo_url ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={property.cover_photo_url} 
                        alt={property.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                
                {/* Property Name + Unit Indicator */}
                <TableCell>
                  <div>
                    <div className="font-medium mb-1">{property.nom}</div>
                    {property.a_unites ? (
                      <Badge variant="secondary" className="text-xs">
                        <Building2 className="w-3 h-3 mr-1" />
                        {property.nombre_unites || 0} unité{(property.nombre_unites || 0) > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Home className="w-3 h-3 mr-1" />
                        Bien unique
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                {/* Type & Configuration */}
                <TableCell>
                  <div>
                    {getTypeBadge(property.type, property.type_libelle)}
                    {property.a_unites && property.nombre_unites && property.nombre_unites > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        Multi-unités
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {/* Enhanced Location */}
                <TableCell>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{property.ville || '-'}</div>
                      <div className="text-xs text-gray-500">{property.pays || 'FR'}</div>
                    </div>
                  </div>
                </TableCell>
                
                {/* Status & Availability */}
                <TableCell>
                  <div>
                    {getStatusBadge(property.statut, property.statut_libelle)}
                    <div className="text-xs text-gray-500 mt-1">
                      {property.is_active ? 'Actif' : 'Inactif'}
                    </div>
                  </div>
                </TableCell>
                
                {/* Key Information */}
                <TableCell>
                  <div className="text-sm space-y-1">
                    {property.surface_m2 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">📏</span>
                        <span>{property.surface_m2}m²</span>
                      </div>
                    )}
                    {property.nb_chambres && property.nb_chambres > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">🛏️</span>
                        <span>{property.nb_chambres} ch.</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {/* Date de création */}
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {getPropertyCreationDate(property.created_at)}
                  </div>
                </TableCell>
                
                {/* Actions - Design identique aux propriétaires */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 min-w-[150px]">
                    <Link href={`/proprietes/${property.id}`}>
                      <Button variant="outline" size="sm" className="w-8 h-8 p-0" title="Voir les détails">
                        <Eye size={14} />
                        <span className="sr-only">Voir</span>
                      </Button>
                    </Link>
                    {(isAdmin || isSuperAdmin) && (
                      <>
                        <Link href={`/proprietes/${property.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                            <Edit size={14} />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        </Link>
                        {property.statut === 'archive' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                            onClick={() => handleUnarchiveClick(property)}
                            disabled={isArchiveProcessing && selectedProperty?.id === property.id}
                            title="Désarchiver la propriété"
                          >
                            {isArchiveProcessing && selectedProperty?.id === property.id ? (
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
                            onClick={() => handleArchiveClick(property)}
                            disabled={isArchiveProcessing && selectedProperty?.id === property.id}
                            title="Archiver la propriété"
                          >
                            {isArchiveProcessing && selectedProperty?.id === property.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Power size={14} />
                            )}
                            <span className="sr-only">Archiver</span>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Archive Confirmation Dialog */}
      {selectedProperty && (
        <AlertDialog open={archiveModal.isOpen} onOpenChange={(open) => {
          if (!open) handleCancelArchiveAction()
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {
                  archiveModal.action === 'archive' ? 'Archiver la propriété' :
                  archiveModal.action === 'unarchive' ? 'Désarchiver la propriété' :
                  'Confirmer l\'action'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {
                  archiveModal.action === 'archive' ?
                    `Archiver "${selectedProperty.nom}" la rendra invisible dans les listes actives mais conservera toutes les données. Elle pourra être désarchivée plus tard.` :
                  archiveModal.action === 'unarchive' ?
                    `Désarchiver "${selectedProperty.nom}" la rendra à nouveau visible et disponible.` :
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
    </>
  )
}