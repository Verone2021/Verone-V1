/**
 * 🎯 VÉRONE - Composant Carte Design System V2 2025
 *
 * Carte standardisée moderne avec icônes et actions
 * Design System 2025 : Couleurs vives, gradients, rounded corners
 */

import { Edit, Trash2, FolderOpen, Package, Tag } from 'lucide-react';

import { Badge } from './badge';
import { ButtonV2 } from './button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './card';

interface VéroneCardProps {
  /** Titre principal de la carte */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** URL de l'icône personnalisée (32x32px max) */
  imageUrl?: string;
  /** Type d'entité pour icône de fallback */
  entityType: 'family' | 'category' | 'subcategory' | 'product';
  /** Slug/identifiant pour badge */
  slug?: string;
  /** Compteur (ex: nombre d'enfants) */
  count?: number;
  /** Label du compteur (ex: "catégories", "produits") */
  countLabel?: string;
  /** État actif/inactif */
  isActive?: boolean;
  /** Position icône dans la carte */
  iconPosition?: 'top-left' | 'top-right';
  /** Callback clic sur la carte */
  onClick?: () => void;
  /** Actions personnalisées */
  onEdit?: () => void;
  onDelete?: () => void;
  /** Props additionnelles pour personnalisation */
  className?: string;
}

/**
 * Icônes de fallback selon le type d'entité Vérone
 */
const getFallbackIcon = (entityType: VéroneCardProps['entityType']) => {
  const iconProps = { className: 'w-8 h-8 text-blue-600' };

  switch (entityType) {
    case 'family':
      return <FolderOpen {...iconProps} />;
    case 'category':
      return <Tag {...iconProps} />;
    case 'subcategory':
      return <Package {...iconProps} />;
    case 'product':
      return <Package {...iconProps} />;
    default:
      return <Package {...iconProps} />;
  }
};

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
  className = '',
}: VéroneCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200
        border border-slate-200 hover:border-blue-400 bg-white hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Section icône conditionnelle */}
          {iconPosition === 'top-left' && (
            <div className="flex-shrink-0 mr-3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Icône ${title}`}
                  className="w-8 h-8 object-cover rounded border border-slate-200"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                getFallbackIcon(entityType)
              )}
            </div>
          )}

          {/* Section contenu */}
          <div className="flex-1">
            <CardTitle className="text-base text-slate-900 mb-1">
              {title}
            </CardTitle>
            {/* Badge slug sous le titre */}
            {slug && (
              <Badge variant="secondary" className="font-mono text-xs mb-1">
                #{slug}
              </Badge>
            )}
            {description && (
              <CardDescription className="text-slate-600 text-sm line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>

          {/* Section icône droite et actions */}
          <div className="flex items-start space-x-2 ml-3">
            {iconPosition === 'top-right' && (
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Icône ${title}`}
                    className="w-12 h-12 object-cover rounded border border-slate-200"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  getFallbackIcon(entityType)
                )}
                {/* Badge statut sous l'image */}
                {isActive !== undefined && (
                  <Badge
                    variant={isActive ? 'success' : 'secondary'}
                    className="text-xs px-2 py-0.5"
                  >
                    {isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions Edit/Delete */}
            {(onEdit || onDelete) && (
              <div className="flex items-center space-x-1">
                {onEdit && (
                  <ButtonV2
                    variant="secondary"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={e => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </ButtonV2>
                )}
                {onDelete && (
                  <ButtonV2
                    variant="destructive"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </ButtonV2>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Compteur si présent */}
        {count !== undefined && countLabel && (
          <div className="text-sm text-slate-600">
            {count} {countLabel}
            {count !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
