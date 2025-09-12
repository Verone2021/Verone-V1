'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Eye,
  MoreVertical,
  Calendar
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
  formatProprietaireNomComplet,
  formatProprietaireType,
  formatFormeJuridique,
  formatCapitalSocial,
  formatCapitalCompletion,
  calculateAge,
  getBrouillonBadgeColor,
  getBrouillonBadgeText,
  getTypeBadgeColor,
  getCapitalCompletionBadgeColor,
  canHaveAssocies,
  isProprietaireValide,
} from '@/lib/utils/proprietaires'
import { type Proprietaire, type ProprietaireWithStats } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ProprietaireCardProps {
  proprietaire: ProprietaireWithStats
  variant?: 'default' | 'compact' | 'minimal'
  showActions?: boolean
  showStats?: boolean
  onSelect?: (proprietaire: ProprietaireWithStats) => void
  className?: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ProprietaireCard({
  proprietaire,
  variant = 'default',
  showActions = true,
  showStats = true,
  onSelect,
  className = "",
}: ProprietaireCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const nomComplet = formatProprietaireNomComplet(proprietaire)
  const isValide = isProprietaireValide(proprietaire)

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleCardClick = () => {
    onSelect?.(proprietaire)
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderHeader = () => (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {proprietaire.type === 'physique' ? (
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
          ) : (
            <Building2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {nomComplet}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${getTypeBadgeColor(proprietaire.type)}`}
              >
                {formatProprietaireType(proprietaire.type)}
              </Badge>
              
              {proprietaire.is_brouillon && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getBrouillonBadgeColor(proprietaire.is_brouillon)}`}
                >
                  {getBrouillonBadgeText(proprietaire.is_brouillon)}
                </Badge>
              )}
              
              {!isValide && !proprietaire.is_brouillon && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                  ⚠️ Incomplet
                </Badge>
              )}
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
                <Link href={`/proprietaires/${proprietaire.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/proprietaires/${proprietaire.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              {canHaveAssocies(proprietaire) && (
                <DropdownMenuItem asChild>
                  <Link href={`/proprietaires/${proprietaire.id}/associes`}>
                    <Users className="h-4 w-4 mr-2" />
                    Gérer associés
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/proprietaires/${proprietaire.id}/proprietes`}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Voir propriétés
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
  )

  const renderContactInfo = () => {
    if (variant === 'minimal') return null
    
    return (
      <div className="space-y-2">
        {proprietaire.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="truncate">{proprietaire.email}</span>
          </div>
        )}
        
        {proprietaire.telephone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{proprietaire.telephone}</span>
          </div>
        )}
        
        {(proprietaire.ville || proprietaire.pays) && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="truncate">
              {[proprietaire.ville, proprietaire.pays].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>
    )
  }

  const renderPersonnePhysiqueInfo = () => {
    if (proprietaire.type !== 'physique' || variant === 'minimal') return null
    
    return (
      <div className="pt-3 border-t border-gray-100">
        <div className="space-y-1 text-sm text-gray-600">
          {proprietaire.date_naissance && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span>
                {calculateAge(proprietaire.date_naissance)} ans
                {proprietaire.lieu_naissance && ` • ${proprietaire.lieu_naissance}`}
              </span>
            </div>
          )}
          
          {proprietaire.nationalite && (
            <div className="text-xs text-gray-500">
              Nationalité {proprietaire.nationalite}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPersonneMoraleInfo = () => {
    if (proprietaire.type !== 'morale' || variant === 'minimal') return null
    
    return (
      <div className="pt-3 border-t border-gray-100">
        <div className="space-y-2">
          {proprietaire.forme_juridique && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {formatFormeJuridique(proprietaire.forme_juridique)}
              </span>
            </div>
          )}
          
          {proprietaire.numero_identification && (
            <div className="text-xs text-gray-500 font-mono">
              {proprietaire.numero_identification}
            </div>
          )}
          
          {showStats && proprietaire.capital_social && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {formatCapitalSocial(proprietaire.capital_social)}
              </div>
              
              {proprietaire.capital_completion_percent !== null && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-brand-copper h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, proprietaire.capital_completion_percent || 0)}%` 
                      }}
                    />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getCapitalCompletionBadgeColor(proprietaire.capital_completion_percent)}`}
                  >
                    {formatCapitalCompletion(proprietaire.capital_completion_percent)}
                  </Badge>
                </div>
              )}
              
              {typeof proprietaire.nombre_associes === 'number' && proprietaire.nombre_associes > 0 && (
                <div className="text-xs text-gray-500">
                  {proprietaire.nombre_associes} associé{proprietaire.nombre_associes > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
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
    ${isHovered && onSelect ? 'ring-2 ring-brand-copper/20' : ''}
    transition-all duration-200
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
      
      <CardContent className="pt-0">
        {renderContactInfo()}
        {renderPersonnePhysiqueInfo()}
        {renderPersonneMoraleInfo()}
        
        {variant === 'default' && !onSelect && (
          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/proprietaires/${proprietaire.id}`}>
                <Eye className="h-3 w-3 mr-2" />
                Voir
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/proprietaires/${proprietaire.id}/edit`}>
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

export function ProprietaireCardCompact(props: Omit<ProprietaireCardProps, 'variant'>) {
  return <ProprietaireCard {...props} variant="compact" />
}

export function ProprietaireCardMinimal(props: Omit<ProprietaireCardProps, 'variant'>) {
  return <ProprietaireCard {...props} variant="minimal" />
}