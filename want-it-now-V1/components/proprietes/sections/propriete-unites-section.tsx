'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getProprieteUnites, type Unite } from '@/actions/proprietes'
import { getPhotosByUnite, type PhotoDetail } from '@/actions/proprietes-photos'
import { formatCurrency } from '@/lib/utils'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Home,
  Key,
  Euro,
  Square,
  Bed,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProprieteUnitesSectionProps {
  proprieteId: string
  isAdmin: boolean
}

export function ProprieteUnitesSection({
  proprieteId,
  isAdmin
}: ProprieteUnitesSectionProps) {
  console.log('🚀 ProprieteUnitesSection MOUNT - proprieteId:', proprieteId)
  
  const [unites, setUnites] = useState<Unite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uniteCoverPhotos, setUniteCoverPhotos] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log('📄 useEffect TRIGGERED - proprieteId:', proprieteId)
    loadUnites()
  }, [proprieteId])

  const loadUnites = async () => {
    console.log('🔄 loadUnites STARTED for proprieteId:', proprieteId)
    setIsLoading(true)
    const result = await getProprieteUnites(proprieteId)
    console.log('📋 getProprieteUnites result:', result.success, result.data?.length || 0, 'units')
    
    if (result.success && result.data) {
      // Debug détaillé des données reçues
      console.log('🔍 DETAILED UNITS DATA:', result.data.map((unite: any, index: number) => ({
        index,
        id: unite.id,
        nom: unite.nom,
        numero: unite.numero,
        type: unite.type,
        is_disponible: unite.is_disponible,
        hasValidData: !!(unite.id && (unite.nom || unite.numero))
      })))
      
      setUnites(result.data)
      console.log('✅ Units set in state, now calling loadUniteCoverPhotos')
      
      // Charger les photos de couverture pour chaque unité
      await loadUniteCoverPhotos(result.data)
    } else {
      console.error('❌ Failed to load units:', result.error)
    }
    setIsLoading(false)
    console.log('🏁 loadUnites COMPLETED')
  }

  const loadUniteCoverPhotos = async (unites: Unite[]) => {
    console.log('🔍 Loading cover photos for units:', unites.length)
    const coverPhotos: Record<string, string> = {}
    
    // Charger les photos de couverture pour chaque unité
    await Promise.all(
      unites.map(async (unite) => {
        console.log('📸 Fetching photos for unit:', unite.nom || unite.numero, unite.id)
        const photosResult = await getPhotosByUnite(unite.id)
        console.log('📸 Result for unit', unite.id, ':', photosResult.success, photosResult.data?.length || 0, 'photos')
        
        if (photosResult.success && photosResult.data) {
          const coverPhoto = photosResult.data.find(photo => photo.is_cover)
          console.log('🖼️ Cover photo for unit', unite.id, ':', !!coverPhoto)
          
          if (coverPhoto?.url_thumbnail) {
            console.log('✅ Setting cover photo URL for', unite.id, ':', coverPhoto.url_thumbnail)
            coverPhotos[unite.id] = coverPhoto.url_thumbnail
          }
        }
      })
    )
    
    console.log('💾 Final cover photos object:', coverPhotos)
    setUniteCoverPhotos(coverPhotos)
  }

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      studio: 'Studio',
      t1: 'T1',
      t2: 'T2',
      t3: 'T3',
      t4: 'T4',
      t5_plus: 'T5+',
      duplex: 'Duplex',
      triplex: 'Triplex',
      loft: 'Loft',
      chambre: 'Chambre',
      commerce: 'Commerce',
      bureau: 'Bureau',
      autre: 'Autre',
      non_defini: 'Non défini'
    }
    // Validation défensive pour les types undefined/null/vides
    if (!type || typeof type !== 'string') {
      return 'Non défini'
    }
    return labels[type] || type
  }

  const renderUniteRow = (unite: Unite) => {
    try {
      // Debug logging pour identifier les unités problématiques
      console.log('🏠 Rendering unit:', {
        id: unite.id,
        nom: unite.nom,
        numero: unite.numero,
        type: unite.type,
        hasAllFields: !!(unite.id && (unite.nom || unite.numero))
      })

      // Validation défensive - s'assurer que l'unité a les données minimales
      if (!unite.id) {
        console.error('❌ Unit missing ID, skipping render:', unite)
        return null
      }

      const coverPhotoUrl = uniteCoverPhotos[unite.id]
      const displayName = unite.numero || unite.nom || `Unité ${unite.id.slice(0, 8)}`
      const unitType = unite.type || 'non_defini'
      
      return (
        <TableRow key={unite.id}>
          <TableCell>
            <div className="flex items-center gap-3">
              {coverPhotoUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={coverPhotoUrl}
                    alt={`Photo de ${displayName}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium">{displayName}</p>
                {unite.etage && (
                  <p className="text-sm text-gray-500">Étage {unite.etage}</p>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>{getTypeLabel(unitType)}</TableCell>
          <TableCell>
            {unite.surface_m2 ? `${unite.surface_m2} m²` : '-'}
          </TableCell>
          <TableCell>{unite.nb_chambres ?? '-'}</TableCell>
          <TableCell>
            {unite.prix_mois ? formatCurrency(unite.prix_mois) : '-'}
          </TableCell>
          <TableCell>
            {!unite.is_disponible ? (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Indisponible
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Disponible
              </Badge>
            )}
          </TableCell>
          {isAdmin && (
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/proprietes/${proprieteId}/unites/${unite.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          )}
        </TableRow>
      )
    } catch (error) {
      console.error('❌ Error rendering unit:', unite.id, error)
      // Retourner une ligne d'erreur au lieu de casser tout le rendu
      return (
        <TableRow key={unite.id || Math.random()}>
          <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-red-500 py-4">
            Erreur d'affichage pour l'unité {unite.id || 'inconnue'}
          </TableCell>
        </TableRow>
      )
    }
  }

  const hasUnites = unites.length > 0
  const unitesOccupees = unites.filter(u => !u.is_disponible).length
  const unitesDisponibles = unites.filter(u => u.is_disponible).length
  const tauxOccupation = hasUnites ? (unitesOccupees / unites.length * 100) : 0
  const revenuTotal = unites.reduce((acc, u) => acc + (!u.is_disponible ? (u.prix_mois || 0) : 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-400" />
            Unités de la propriété
          </h3>
          {isAdmin && (
            <Link href={`/proprietes/${proprieteId}/unites/new`}>
              <Button className="bg-copper hover:bg-copper-dark">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une unité
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total unités</p>
            <p className="text-2xl font-bold">{unites.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Occupées</p>
            <p className="text-2xl font-bold text-green">{unitesOccupees}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Disponibles</p>
            <p className="text-2xl font-bold text-blue-600">{unitesDisponibles}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Taux d'occupation</p>
            <p className="text-2xl font-bold text-copper">{tauxOccupation.toFixed(0)}%</p>
          </div>
        </div>

        {revenuTotal > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenu mensuel total</span>
              <span className="text-2xl font-bold text-green">
                {formatCurrency(revenuTotal)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Units Table */}
      {hasUnites && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Liste des unités</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unité</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Chambres</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead>Statut</TableHead>
                  {isAdmin && <TableHead className="w-[70px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {unites.map(renderUniteRow)}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!hasUnites && !isLoading && (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune unité</h3>
          <p className="text-gray-600 mb-6">
            Cette propriété multi-unités n'a pas encore d'unités définies.
          </p>
          {isAdmin && (
            <Link href={`/proprietes/${proprieteId}/unites/new`}>
              <Button className="bg-copper hover:bg-copper-dark">
                <Plus className="w-4 h-4 mr-2" />
                Créer la première unité
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}