/**
 * 🎯 VÉRONE - Composant Carte Moderne 2025
 *
 * Carte standardisée avec icônes conditionnelles selon design system Vérone
 * DESIGN STRICT : noir (#000000) / blanc (#FFFFFF) / gris (#666666) UNIQUEMENT
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Edit, Trash2, FolderOpen, Package, Tag } from 'lucide-react'

interface VéroneCardProps {
  /** Titre principal de la carte */
  title: string
  /** Description optionnelle */
  description?: string
  /** URL de l'icône personnalisée (32x32px max) */
  imageUrl?: string
  /** Type d'entité pour icône de fallback */
  entityType: 'family' | 'category' | 'subcategory' | 'product'
  /** Slug/identifiant pour badge */
  slug?: string
  /** Compteur (ex: nombre d'enfants) */
  count?: number
  /** Label du compteur (ex: "catégories", "produits") */
  countLabel?: string
  /** État actif/inactif */
  isActive?: boolean
  /** Position icône dans la carte */
  iconPosition?: 'top-left' | 'top-right'
  /** Callback clic sur la carte */
  onClick?: () => void
  /** Actions personnalisées */
  onEdit?: () => void
  onDelete?: () => void
  /** Props additionnelles pour personnalisation */
  className?: string
}

/**
 * Icônes de fallback selon le type d'entité Vérone
 */
const getFallbackIcon = (entityType: VéroneCardProps['entityType']) => {
  const iconProps = { className: "w-8 h-8 text-black" }

  switch (entityType) {
    case 'family':
      return <FolderOpen {...iconProps} />
    case 'category':
      return <Tag {...iconProps} />
    case 'subcategory':
      return <Package {...iconProps} />
    case 'product':
      return <Package {...iconProps} />
    default:
      return <Package {...iconProps} />
  }
}

export function VéroneCard({
  title,
  description,
  imageUrl,
  entityType,
  slug,
  count,
  countLabel,
  isActive = true,
  iconPosition = 'top-right',
  onClick,
  onEdit,
  onDelete,
  className = ''
}: VéroneCardProps) {
  return (
    <Card
      className={`vérone-card cursor-pointer hover:shadow-md transition-all duration-200
        border border-gray-200 hover:border-black bg-white ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Section icône conditionnelle */}
          {iconPosition === 'top-left' && (
            <div className="icône-section flex-shrink-0 mr-3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Icône ${title}`}
                  className="w-8 h-8 object-cover rounded border border-gray-200"
                  onError={(e) => {
                    // Fallback si image ne charge pas
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = getFallbackIcon(entityType).props.children
                  }}
                />
              ) : (
                getFallbackIcon(entityType)
              )}
            </div>
          )}

          {/* Section contenu */}
          <div className="contenu-section flex-1">
            <CardTitle className="text-lg text-black mb-1">{title}</CardTitle>
            {description && (
              <CardDescription className="text-gray-600 text-sm line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>

          {/* Section icône droite et actions */}
          <div className="actions-section flex items-start space-x-2 ml-3">
            {iconPosition === 'top-right' && (
              <div className="icône-section flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Icône ${title}`}
                    className="w-8 h-8 object-cover rounded border border-gray-200"
                    onError={(e) => {
                      // Fallback si image ne charge pas
                      const fallbackIcon = getFallbackIcon(entityType)
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-8 h-8 text-black flex items-center justify-center">
                          ${fallbackIcon.type === FolderOpen ? '📁' : fallbackIcon.type === Tag ? '🏷️' : '📦'}
                        </div>
                      `
                    }}
                  />
                ) : (
                  getFallbackIcon(entityType)
                )}
              </div>
            )}

            {/* Actions Edit/Delete */}
            {(onEdit || onDelete) && (
              <div className="flex items-center space-x-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  >
                    <Edit className="w-4 h-4 text-gray-600 hover:text-black" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-gray-100 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {/* Badge slug */}
          {slug && (
            <Badge variant="outline" className="border-black text-black">
              #{slug}
            </Badge>
          )}

          {/* Compteur + statut */}
          <div className="flex items-center space-x-3">
            {count !== undefined && countLabel && (
              <div className="text-sm text-gray-600">
                {count} {countLabel}{count !== 1 ? 's' : ''}
              </div>
            )}

            {isActive !== undefined && (
              <Badge
                variant="outline"
                className={
                  isActive
                    ? "border-black text-black"
                    : "border-gray-500 text-gray-600"
                }
              >
                {isActive ? 'Actif' : 'Inactif'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Styles CSS additionnels pour le design system Vérone
 */
export const véroneCardStyles = `
  .vérone-card {
    --vérone-primary: #000000;
    --vérone-secondary: #FFFFFF;
    --vérone-accent: #666666;
  }

  .vérone-card:hover {
    border-color: var(--vérone-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .icône-section img {
    max-width: 32px;
    max-height: 32px;
  }
`