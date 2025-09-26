"use client"

import { Package, Edit2 } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface Product {
  id: string
  name?: string
  // Caractéristiques fixes de la variante (couleur/matière uniquement)
  color?: string
  material?: string
  video_url?: string

  // Navigation catégorielle
  subcategory?: {
    name?: string
    category?: {
      name?: string
      family?: {
        name?: string
      }
    }
  }

  // Données héritées du Product Group (lecture seule)
  product_groups?: {
    dimensions?: Record<string, any>
    weight?: number
    technical_specs?: Record<string, any>
  }
}

interface ProductFixedCharacteristicsProps {
  product: Product
  className?: string
  onEditVideoUrl?: () => void // Seule action d'édition autorisée
}

/**
 * Détermine les pièces de maison compatibles selon le type de produit
 * Règles métier :
 * - chaise → toutes les pièces
 * - lavabo → "wc salle de bains"
 * - lit → "chambre"
 * - meuble général → pièces appropriées selon usage
 */
function getCompatibleRooms(product: Product): string[] {
  const productName = product.name?.toLowerCase() || ''
  const subcategoryName = product.subcategory?.name?.toLowerCase() || ''
  const categoryName = product.subcategory?.category?.name?.toLowerCase() || ''
  const familyName = product.subcategory?.category?.family?.name?.toLowerCase() || ''

  // Toutes les pièces disponibles
  const allRooms = [
    'salon', 'chambre', 'cuisine', 'salle à manger', 'bureau',
    'entrée', 'couloir', 'salle de bains', 'wc', 'dressing',
    'terrasse', 'jardin', 'cave', 'garage'
  ]

  // Chaises et sièges → toutes les pièces
  if (productName.includes('chaise') ||
      productName.includes('fauteuil') ||
      productName.includes('siège') ||
      productName.includes('tabouret') ||
      subcategoryName.includes('chaise') ||
      subcategoryName.includes('siège')) {
    return allRooms
  }

  // Lavabos et sanitaires → salle de bains/wc uniquement
  if (productName.includes('lavabo') ||
      productName.includes('vasque') ||
      productName.includes('évier') ||
      productName.includes('toilette') ||
      subcategoryName.includes('sanitaire') ||
      categoryName.includes('sanitaire')) {
    return ['wc', 'salle de bains']
  }

  // Lits → chambre uniquement
  if (productName.includes('lit') ||
      productName.includes('matelas') ||
      productName.includes('sommier') ||
      subcategoryName.includes('lit') ||
      subcategoryName.includes('couchage')) {
    return ['chambre']
  }

  // Tables → selon le type
  if (productName.includes('table')) {
    if (productName.includes('chevet') || productName.includes('nuit')) {
      return ['chambre']
    }
    if (productName.includes('salle à manger') || productName.includes('repas')) {
      return ['salle à manger']
    }
    if (productName.includes('bureau') || productName.includes('travail')) {
      return ['bureau']
    }
    if (productName.includes('basse') || productName.includes('salon')) {
      return ['salon']
    }
    // Table générique → salon, salle à manger, bureau
    return ['salon', 'salle à manger', 'bureau']
  }

  // Éclairage → toutes les pièces
  if (categoryName.includes('éclairage') ||
      productName.includes('lampe') ||
      productName.includes('luminaire') ||
      productName.includes('applique')) {
    return allRooms
  }

  // Armoires et rangements
  if (productName.includes('armoire') ||
      productName.includes('placard') ||
      productName.includes('commode') ||
      subcategoryName.includes('rangement')) {
    if (productName.includes('dressing') || productName.includes('penderie')) {
      return ['chambre', 'dressing']
    }
    // Rangement générique → plusieurs pièces
    return ['salon', 'chambre', 'bureau', 'entrée']
  }

  // Canapés → salon principalement
  if (productName.includes('canapé') ||
      productName.includes('sofa') ||
      subcategoryName.includes('canapé')) {
    return ['salon']
  }

  // Par défaut : pièces principales
  return ['salon', 'chambre', 'bureau']
}

export function ProductFixedCharacteristics({
  product,
  className,
  onEditVideoUrl
}: ProductFixedCharacteristicsProps) {
  const dimensions = product.product_groups?.dimensions
  const weight = product.product_groups?.weight
  const technicalSpecs = product.product_groups?.technical_specs
  const compatibleRooms = getCompatibleRooms(product)

  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Caractéristiques
        </h3>
        {onEditVideoUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditVideoUrl}
            className="text-xs"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Éditer vidéo
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Caractéristiques Variante (Couleur/Matière) */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70">
            Variante (couleur/matière)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Couleur */}
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-xs text-black opacity-60">Couleur</span>
              <div className="font-medium text-black">
                {product.color || (
                  <span className="text-gray-400 italic">Non définie</span>
                )}
              </div>
            </div>

            {/* Matière */}
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-xs text-black opacity-60">Matière</span>
              <div className="font-medium text-black">
                {product.material || (
                  <span className="text-gray-400 italic">Non définie</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            ℹ️ Couleur et matière sont gérées au niveau Product Group
          </div>
        </div>

        {/* Pièces compatibles (automatique selon type produit) */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70">
            Pièces de maison compatibles
          </h4>
          <div className="bg-green-50 p-3 rounded">
            <div className="flex flex-wrap gap-2">
              {compatibleRooms.map((room, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {room}
                </span>
              ))}
            </div>
            <div className="text-xs text-green-600 mt-2">
              🏠 Pièces déterminées automatiquement selon le type de produit
            </div>
          </div>
        </div>

        {/* Dimensions (héritées du Product Group) */}
        {dimensions && Object.keys(dimensions).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70">
              Dimensions (communes au groupe)
            </h4>
            <div className="bg-blue-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(dimensions).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize text-black opacity-70">{key}:</span>
                    <span className="font-medium text-black">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                📏 Dimensions identiques pour toutes les variantes du groupe
              </div>
            </div>
          </div>
        )}

        {/* Poids (hérité du Product Group) */}
        {weight && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70">
              Poids (commun au groupe)
            </h4>
            <div className="bg-blue-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-black opacity-70">Poids:</span>
                <span className="font-medium text-black">{weight} kg</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                ⚖️ Poids identique pour toutes les variantes du groupe
              </div>
            </div>
          </div>
        )}

        {/* Spécifications Techniques (héritées du Product Group) */}
        {technicalSpecs && Object.keys(technicalSpecs).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70">
              Spécifications techniques
            </h4>
            <div className="bg-gray-50 p-3 rounded">
              <div className="space-y-1 text-sm">
                {Object.entries(technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize text-black opacity-70">{key}:</span>
                    <span className="font-medium text-black">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                🔧 Spécifications communes définies au niveau Product Group
              </div>
            </div>
          </div>
        )}

        {/* Vidéo (spécifique à la variante) */}
        {product.video_url && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70">
              Vidéo produit
            </h4>
            <div className="bg-green-50 p-3 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Package className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-700 font-medium">Vidéo disponible</span>
                </div>
                {onEditVideoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditVideoUrl}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                )}
              </div>
              <div className="text-xs text-green-600 mt-1 break-all">
                {product.video_url}
              </div>
            </div>
          </div>
        )}

        {/* Message si caractéristiques manquantes */}
        {!product.color && !product.material && !dimensions && !weight && !technicalSpecs && !product.video_url && (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <div className="text-sm text-gray-400">
              Aucune caractéristique définie
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Les caractéristiques sont héritées du Product Group
            </div>
          </div>
        )}

        {/* Note explicative pour l'utilisateur */}
        <div className="border-t border-gray-200 pt-3 mt-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-medium">📋 Règles de gestion :</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Couleur/Matière</strong> : Seules différences autorisées entre variantes</li>
              <li><strong>Dimensions/Poids</strong> : Identiques pour toutes les variantes du groupe</li>
              <li><strong>Édition</strong> : Gérer les variantes depuis la page Product Group</li>
              <li><strong>Vidéo</strong> : Seule caractéristique modifiable au niveau variante</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Composant en lecture seule pour afficher les caractéristiques fixes d'un produit
 *
 * Caractéristiques affichées :
 * - Couleur/Matière : Spécifiques à la variante (fixes, gérées au niveau Product Group)
 * - Pièces compatibles : Déterminées automatiquement selon le type de produit
 * - Dimensions/Poids : Héritées du Product Group (communes à toutes variantes)
 * - Spécifications techniques : Héritées du Product Group
 * - Vidéo : Spécifique à la variante (modifiable)
 *
 * Logique pièces maison :
 * - Chaises/sièges → toutes les pièces
 * - Lavabos/sanitaires → WC et salle de bains uniquement
 * - Lits → chambre uniquement
 * - Tables → selon le type (chevet→chambre, basse→salon, etc.)
 * - Éclairage → toutes les pièces
 * - Autres → pièces appropriées selon l'usage
 *
 * Conforme aux business rules :
 * - R-VAR-002 : Seules couleur/matière modifiables par variante
 * - R-VAR-003 : Dimensions/poids héritées du Product Group
 * - R-ROOMS-001 : Pièces compatibles déterminées par type produit
 * - Pas d'édition dynamique d'attributs arbitraires
 */