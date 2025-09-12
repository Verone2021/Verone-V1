'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  FileText,
  Calendar,
  Home,
  Building2,
  Euro,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { ContratAvecRelations, ContratStatus } from '@/types/contrats'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ContratCardProps {
  contrat: ContratAvecRelations
  variant?: 'default' | 'compact' | 'minimal'
  showActions?: boolean
  onSelect?: (contrat: ContratAvecRelations) => void
  onDelete?: (contratId: string) => Promise<void>
  className?: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ContratCard({
  contrat,
  variant = 'default',
  showActions = true,
  onSelect,
  onDelete,
  className = "",
}: ContratCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ==============================================================================
  // HELPERS
  // ==============================================================================

  const getStatusBadge = (contrat: ContratAvecRelations) => {
    const now = new Date()
    const dateDebut = new Date(contrat.date_debut)
    const dateFin = new Date(contrat.date_fin)
    
    let status: ContratStatus
    let variant: "default" | "secondary" | "destructive" | "outline"
    let emoji = ""
    
    if (now < dateDebut) {
      status = 'a_venir'
      variant = 'outline'
      emoji = '⏳'
    } else if (now >= dateDebut && now <= dateFin) {
      status = 'en_cours'
      variant = 'default'
      emoji = '🔄'
    } else {
      status = 'termine'
      variant = 'secondary'
      emoji = '✅'
    }

    const labels = {
      'a_venir': 'À venir',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    }

    return (
      <Badge variant={variant} className="text-xs">
        {emoji} {labels[status]}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getDurationDisplay = () => {
    if (contrat.duree_jours) {
      const months = Math.floor(contrat.duree_jours / 30)
      return `${contrat.duree_jours} jours (${months} mois)`
    }
    return null
  }

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleCardClick = () => {
    onSelect?.(contrat)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(contrat.id)
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderHeader = () => (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${
            contrat.type_contrat === 'fixe' 
              ? 'bg-[#D4841A]/10 text-[#D4841A]' 
              : 'bg-[#2D5A27]/10 text-[#2D5A27]'
          }`}>
            <FileText className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 capitalize">
              Contrat {contrat.type_contrat}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  contrat.type_contrat === 'fixe'
                    ? 'text-[#D4841A] border-[#D4841A]/20 bg-[#D4841A]/5'
                    : 'text-[#2D5A27] border-[#2D5A27]/20 bg-[#2D5A27]/5'
                }`}
              >
                {contrat.type_contrat === 'fixe' ? '🏠 Fixe' : '📈 Variable'}
              </Badge>
              
              {getStatusBadge(contrat)}
            </div>
          </div>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/contrats/${contrat.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/contrats/${contrat.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le contrat</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce contrat {contrat.type_contrat} ?
                        Cette action est définitive et ne peut pas être annulée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
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
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
  )

  const renderPropertyInfo = () => {
    if (variant === 'minimal') return null
    
    return (
      <div className="space-y-2">
        {/* Propriété/Unité */}
        {contrat.propriete_nom && (
          <div className="flex items-start space-x-2 text-sm">
            <Home className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{contrat.propriete_nom}</div>
              {contrat.propriete_adresse && contrat.propriete_ville && (
                <div className="text-gray-500 text-xs">
                  {contrat.propriete_adresse}, {contrat.propriete_ville}
                </div>
              )}
            </div>
          </div>
        )}
        
        {contrat.unite_nom && (
          <div className="flex items-start space-x-2 text-sm">
            <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Unité {contrat.unite_numero} - {contrat.unite_nom}
              </div>
              {contrat.unite_propriete_nom && (
                <div className="text-gray-500 text-xs">
                  {contrat.unite_propriete_nom}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <div>Du {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}</div>
            <div>Au {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}</div>
            {getDurationDisplay() && (
              <div className="text-xs text-gray-500 mt-1">
                {getDurationDisplay()}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderContractDetails = () => {
    if (variant === 'minimal') return null
    
    return (
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {/* Meublé */}
            <Badge variant={contrat.meuble ? 'default' : 'outline'} className="text-xs">
              {contrat.meuble ? '🏠 Meublé' : '📦 Vide'}
            </Badge>
            
            {/* Sous-location */}
            {contrat.autorisation_sous_location && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                ✅ Sous-location
              </Badge>
            )}
          </div>
          
          {/* Commission */}
          <div className="flex items-center space-x-1 text-[#D4841A] font-medium">
            <Euro className="h-3 w-3" />
            <span>{contrat.commission_pourcentage}%</span>
          </div>
        </div>

        {/* Date émission */}
        <div className="text-xs text-gray-500 mt-2">
          Émis le {new Date(contrat.date_emission).toLocaleDateString('fr-FR')}
        </div>
      </div>
    )
  }

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  const cardClasses = `
    ${className}
    ${onSelect ? 'cursor-pointer' : ''}
    ${isHovered && onSelect ? 'ring-2 ring-[#D4841A]/20' : ''}
    transition-all duration-200 hover:shadow-md
    ${variant === 'compact' ? 'max-w-sm' : ''}
    ${variant === 'minimal' ? 'max-w-xs' : ''}
  `.trim()

  return (
    <Card 
      className={cardClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect ? handleCardClick : undefined}
    >
      {renderHeader()}
      
      <CardContent className="pt-0 space-y-4">
        {renderPropertyInfo()}
        {renderContractDetails()}
        
        {variant === 'default' && !onSelect && showActions && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/contrats/${contrat.id}`}>
                <Eye className="h-3 w-3 mr-2" />
                Voir
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/contrats/${contrat.id}/edit`}>
                <Edit className="h-3 w-3 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==============================================================================
// EXPORT VARIANTS
// ==============================================================================

export function ContratCardCompact(props: Omit<ContratCardProps, 'variant'>) {
  return <ContratCard {...props} variant="compact" />
}

export function ContratCardMinimal(props: Omit<ContratCardProps, 'variant'>) {
  return <ContratCard {...props} variant="minimal" />
}