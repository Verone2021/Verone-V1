'use client';

import { Package, Edit2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';

/**
 * Formatte le style décoratif pour affichage
 * @param style - Valeur du style (enum)
 * @returns Label formatté du style
 */
function formatStyle(style: string): string {
  const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style);
  return styleOption?.label ?? style;
}

interface Product {
  id: string;
  name?: string;
  // Caractéristiques fixes de la variante (nouveau système variant_groups)
  variant_attributes?: Record<string, unknown> | null;
  variant_group_id?: string | null;
  video_url?: string;

  // Champs directs du produit (pour produits SANS variante groupe)
  weight?: number | null;
  dimensions?: Record<string, unknown> | null;

  // Navigation catégorielle
  subcategory?: {
    name?: string;
    category?: {
      name?: string;
      family?: {
        name?: string;
      };
    };
  };

  // Données héritées du Variant Group (lecture seule)
  variant_group?: {
    id?: string;
    dimensions_length?: number | null;
    dimensions_width?: number | null;
    dimensions_height?: number | null;
    dimensions_unit?: string;
    common_weight?: number | null;
    style?: string | null;
    suitable_rooms?: string[] | null;
  };
}

interface ProductFixedCharacteristicsProps {
  product: Product;
  className?: string;
  onEditVideoUrl?: () => void; // Seule action d'édition autorisée
}

/**
 * Détermine les pièces de maison compatibles selon le type de produit
 * Règles métier :
 * - Si le produit appartient à un groupe de variantes avec pièces définies → utiliser ces pièces (héritage)
 * - Sinon, calcul automatique selon type de produit :
 *   - chaise → toutes les pièces
 *   - lavabo → "wc salle de bains"
 *   - lit → "chambre"
 *   - meuble général → pièces appropriées selon usage
 */
function getCompatibleRooms(product: Product): string[] {
  // Priorité 1 : Si le groupe a défini des pièces compatibles, les utiliser (héritage)
  if (
    product.variant_group?.suitable_rooms &&
    product.variant_group.suitable_rooms.length > 0
  ) {
    return product.variant_group.suitable_rooms;
  }

  // Priorité 2 : Calcul automatique selon type de produit
  const productName = product.name?.toLowerCase() ?? '';
  const subcategoryName = product.subcategory?.name?.toLowerCase() ?? '';
  const categoryName = product.subcategory?.category?.name?.toLowerCase() ?? '';
  // familyName unused (kept for potential future categorization logic)
  const _familyName =
    product.subcategory?.category?.family?.name?.toLowerCase() ?? '';

  // Toutes les pièces disponibles
  const allRooms = [
    'salon',
    'chambre',
    'cuisine',
    'salle à manger',
    'bureau',
    'entrée',
    'couloir',
    'salle de bains',
    'wc',
    'dressing',
    'terrasse',
    'jardin',
    'cave',
    'garage',
  ];

  // Chaises et sièges → toutes les pièces
  if (
    productName.includes('chaise') ||
    productName.includes('fauteuil') ||
    productName.includes('siège') ||
    productName.includes('tabouret') ||
    subcategoryName.includes('chaise') ||
    subcategoryName.includes('siège')
  ) {
    return allRooms;
  }

  // Lavabos et sanitaires → salle de bains/wc uniquement
  if (
    productName.includes('lavabo') ||
    productName.includes('vasque') ||
    productName.includes('évier') ||
    productName.includes('toilette') ||
    subcategoryName.includes('sanitaire') ||
    categoryName.includes('sanitaire')
  ) {
    return ['wc', 'salle de bains'];
  }

  // Lits → chambre uniquement
  if (
    productName.includes('lit') ||
    productName.includes('matelas') ||
    productName.includes('sommier') ||
    subcategoryName.includes('lit') ||
    subcategoryName.includes('couchage')
  ) {
    return ['chambre'];
  }

  // Tables → selon le type
  if (productName.includes('table')) {
    if (productName.includes('chevet') || productName.includes('nuit')) {
      return ['chambre'];
    }
    if (
      productName.includes('salle à manger') ||
      productName.includes('repas')
    ) {
      return ['salle à manger'];
    }
    if (productName.includes('bureau') || productName.includes('travail')) {
      return ['bureau'];
    }
    if (productName.includes('basse') || productName.includes('salon')) {
      return ['salon'];
    }
    // Table générique → salon, salle à manger, bureau
    return ['salon', 'salle à manger', 'bureau'];
  }

  // Éclairage → toutes les pièces
  if (
    categoryName.includes('éclairage') ||
    productName.includes('lampe') ||
    productName.includes('luminaire') ||
    productName.includes('applique')
  ) {
    return allRooms;
  }

  // Armoires et rangements
  if (
    productName.includes('armoire') ||
    productName.includes('placard') ||
    productName.includes('commode') ||
    subcategoryName.includes('rangement')
  ) {
    if (productName.includes('dressing') || productName.includes('penderie')) {
      return ['chambre', 'dressing'];
    }
    // Rangement générique → plusieurs pièces
    return ['salon', 'chambre', 'bureau', 'entrée'];
  }

  // Canapés → salon principalement
  if (
    productName.includes('canapé') ||
    productName.includes('sofa') ||
    subcategoryName.includes('canapé')
  ) {
    return ['salon'];
  }

  // Par défaut : pièces principales
  return ['salon', 'chambre', 'bureau'];
}

// Labels pour les types d'attributs variantes (alignés avec ProductCharacteristicsModal)
const VARIANT_ATTRIBUTE_LABELS: Record<
  string,
  { label: string; emoji: string }
> = {
  color: { label: 'Couleur', emoji: '🎨' },
  size: { label: 'Taille', emoji: '📏' },
  material: { label: 'Matériau', emoji: '🧵' },
  pattern: { label: 'Motif', emoji: '🔷' },
  finish: { label: 'Finition', emoji: '✨' },
  style: { label: 'Style', emoji: '🎭' },
};

export function ProductFixedCharacteristics({
  product,
  className,
  onEditVideoUrl,
}: ProductFixedCharacteristicsProps) {
  // Récupérer les dimensions :
  // 1. Si produit dans un variant_group → lire depuis variant_group (heritage)
  // 2. Sinon → lire depuis product.dimensions (JSONB — formats varies en base)
  const variantGroup = product.variant_group;
  const hasGroupDimensions =
    variantGroup?.dimensions_length != null ||
    variantGroup?.dimensions_width != null ||
    variantGroup?.dimensions_height != null;

  // Extraire les dimensions du JSONB produit (cles: width_cm/width, height_cm/height, etc.)
  const dims = product.dimensions as Record<string, unknown> | null;
  const getNum = (
    obj: Record<string, unknown> | null,
    ...keys: string[]
  ): number | null => {
    if (!obj) return null;
    for (const k of keys) {
      const v = obj[k];
      if (v != null && typeof v === 'number') return v;
    }
    return null;
  };

  const productLength = getNum(dims, 'length_cm', 'length');
  const productWidth = getNum(dims, 'width_cm', 'width');
  const productHeight = getNum(dims, 'height_cm', 'height');
  const productDepth = getNum(dims, 'depth_cm', 'depth');
  const productDiameter = getNum(dims, 'diameter_cm', 'diameter');
  const hasProductDimensions =
    productLength != null ||
    productWidth != null ||
    productHeight != null ||
    productDepth != null ||
    productDiameter != null;

  const dimensions = hasGroupDimensions
    ? {
        length: variantGroup?.dimensions_length ?? null,
        width: variantGroup?.dimensions_width ?? null,
        height: variantGroup?.dimensions_height ?? null,
        diameter: null as number | null,
        unit: variantGroup?.dimensions_unit ?? 'cm',
        fromGroup: true,
      }
    : hasProductDimensions
      ? {
          length: productLength ?? productDepth,
          width: productWidth,
          height: productHeight,
          diameter: productDiameter,
          unit: 'cm',
          fromGroup: false,
        }
      : null;

  // Poids : variant_group.common_weight (heritage) OU product.weight (direct)
  const displayWeight = product.variant_group_id
    ? (product.variant_group?.common_weight ?? null)
    : (product.weight ?? null);
  const weightFromGroup = !!(
    product.variant_group_id && product.variant_group?.common_weight
  );

  const compatibleRooms = getCompatibleRooms(product);
  const variantAttributes = product.variant_attributes ?? {};
  const hasVariantAttributes = Object.keys(variantAttributes).length > 0;

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Caractéristiques
        </h3>
        {onEditVideoUrl && (
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onEditVideoUrl}
            className="text-xs"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Éditer vidéo
          </ButtonV2>
        )}
      </div>

      <div className="space-y-4">
        {/* Caractéristiques Variante (Système variant_groups) - TOUJOURS afficher les champs standards */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70">
            Attributs de variante
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Afficher TOUJOURS les 6 attributs standards (principe miroir avec modal édition) */}
            {['color', 'material', 'finish', 'pattern', 'style'].map(key => {
              const attributeInfo = VARIANT_ATTRIBUTE_LABELS[key] ?? {
                label: key,
                emoji: '🔹',
              };
              const value: unknown = variantAttributes[key];
              const displayValue = typeof value === 'string' ? value : null;
              return (
                <div
                  key={key}
                  className={cn(
                    'p-2 rounded border',
                    displayValue
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <span className="text-xs text-black opacity-60 flex items-center gap-1">
                    <span>{attributeInfo.emoji}</span>
                    {attributeInfo.label}
                  </span>
                  <div className="font-medium text-black">
                    {displayValue ?? (
                      <span className="text-gray-400 italic text-sm">
                        Non renseigné
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Afficher les attributs personnalisés (hors standards) */}
            {Object.entries(variantAttributes)
              .filter(
                ([key]) =>
                  ![
                    'color',
                    'material',
                    'finish',
                    'pattern',
                    'style',
                    'size',
                  ].includes(key)
              )
              .map(([key, value]) => {
                const attributeInfo = VARIANT_ATTRIBUTE_LABELS[key] ?? {
                  label: key,
                  emoji: '🔹',
                };
                const displayValue =
                  typeof value === 'string' ? value : String(value);
                return (
                  <div
                    key={key}
                    className="bg-blue-50 p-2 rounded border border-blue-200"
                  >
                    <span className="text-xs text-black opacity-60 flex items-center gap-1">
                      <span>{attributeInfo.emoji}</span>
                      {attributeInfo.label}
                    </span>
                    <div className="font-medium text-black">
                      {displayValue ?? (
                        <span className="text-gray-400 italic">Non défini</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          {product.variant_group_id && (
            <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              ℹ️ Attributs spécifiques à cette variante du groupe
              <a
                href={`/catalogue/variantes/${product.variant_group_id}`}
                className="underline font-medium hover:text-purple-800"
              >
                (voir le groupe)
              </a>
            </div>
          )}
        </div>

        {/* Pièces compatibles (automatique selon type produit) */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
            {product.variant_group?.suitable_rooms &&
            product.variant_group.suitable_rooms.length > 0
              ? '🏠 Pièces compatibles (héritées du groupe)'
              : 'Pièces de maison compatibles'}
            {product.variant_group?.suitable_rooms &&
              product.variant_group.suitable_rooms.length > 0 &&
              product.variant_group_id && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  🔒 Non modifiable ici
                </span>
              )}
          </h4>
          <div className="bg-green-50 p-3 rounded border border-green-200">
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
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              {product.variant_group?.suitable_rooms &&
              product.variant_group.suitable_rooms.length > 0 ? (
                <>
                  🏠 Pièces communes à toutes les variantes du groupe
                  {product.variant_group_id && (
                    <a
                      href={`/catalogue/variantes/${product.variant_group_id}`}
                      className="underline font-medium hover:text-green-800 ml-1"
                    >
                      (modifier dans le groupe)
                    </a>
                  )}
                </>
              ) : (
                '🏠 Pièces déterminées automatiquement selon le type de produit'
              )}
            </div>
          </div>
        </div>

        {/* Dimensions - TOUJOURS afficher (principe miroir avec modal édition) */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
            📐 Dimensions
            {dimensions?.fromGroup && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                🔒 Héritées du groupe
              </span>
            )}
          </h4>
          {dimensions ? (
            <div
              className={cn(
                'p-3 rounded-lg border',
                dimensions.fromGroup
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              )}
            >
              <div className="text-sm font-medium text-black">
                {dimensions.diameter != null ? (
                  <>
                    &#8960; {dimensions.diameter} {dimensions.unit}
                  </>
                ) : (
                  <>
                    L: {dimensions.length ?? '-'} × l: {dimensions.width ?? '-'}{' '}
                    × H: {dimensions.height ?? '-'} {dimensions.unit ?? 'cm'}
                  </>
                )}
              </div>
              {dimensions.fromGroup && product.variant_group_id && (
                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  📏 Dimensions communes à toutes les variantes du groupe
                  <a
                    href={`/catalogue/variantes/${product.variant_group_id}`}
                    className="underline font-medium hover:text-green-800 ml-1"
                  >
                    (modifier dans le groupe)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-400 italic text-sm">
                Non renseignées
              </div>
            </div>
          )}
        </div>

        {/* Poids - TOUJOURS afficher (principe miroir avec modal édition) */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
            ⚖️ Poids
            {weightFromGroup && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                🔒 Hérité du groupe
              </span>
            )}
          </h4>
          {displayWeight != null ? (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-black">
                {displayWeight} kg
              </div>
              {weightFromGroup && product.variant_group_id && (
                <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  ⚖️ Poids commun à toutes les variantes du groupe
                  <a
                    href={`/catalogue/variantes/${product.variant_group_id}`}
                    className="underline font-medium hover:text-blue-800 ml-1"
                  >
                    (modifier dans le groupe)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-400 italic text-sm">Non renseigné</div>
            </div>
          )}
        </div>

        {/* Style décoratif (hérité du Variant Group) */}
        {product.variant_group?.style && product.variant_group_id && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
              🎨 Style décoratif (hérité du groupe)
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                🔒 Non modifiable ici
              </span>
            </h4>
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <Badge variant="outline" className="bg-white">
                {formatStyle(product.variant_group.style)}
              </Badge>
              <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                🎨 Style commun à toutes les variantes du groupe
                {product.variant_group_id && (
                  <a
                    href={`/catalogue/variantes/${product.variant_group_id}`}
                    className="underline font-medium hover:text-purple-800 ml-1"
                  >
                    (modifier dans le groupe)
                  </a>
                )}
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
                  <span className="text-green-700 font-medium">
                    Vidéo disponible
                  </span>
                </div>
                {onEditVideoUrl && (
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={onEditVideoUrl}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifier
                  </ButtonV2>
                )}
              </div>
              <div className="text-xs text-green-600 mt-1 break-all">
                {product.video_url}
              </div>
            </div>
          </div>
        )}

        {/* Message si caractéristiques manquantes */}
        {!hasVariantAttributes && !dimensions && !product.video_url && (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <div className="text-sm text-gray-400">
              Aucune caractéristique définie
            </div>
            {product.variant_group_id && (
              <div className="text-xs text-gray-400 mt-1">
                Les caractéristiques sont gérées au niveau du groupe de
                variantes
              </div>
            )}
          </div>
        )}

        {/* Note explicative pour l'utilisateur */}
        {product.variant_group_id && (
          <div className="border-t border-gray-200 pt-3 mt-4">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">
                📋 Règles de gestion (système variant_groups) :
              </div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Attributs variantes</strong> : Différences spécifiques
                  entre produits du groupe (couleur, matériau)
                </li>
                <li>
                  <strong>Dimensions/Poids</strong> : Peuvent varier ou être
                  communes selon le groupe
                </li>
                <li>
                  <strong>Édition</strong> : Gérer les variantes depuis la page
                  du groupe
                </li>
                <li>
                  <strong>Images/Vidéos</strong> : Spécifiques à chaque produit
                  (modifiables individuellement)
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Composant en lecture seule pour afficher les caractéristiques d'un produit
 *
 * Caractéristiques affichées (système variant_groups 2025) :
 * - Attributs variantes : Stockés dans variant_attributes JSONB (couleur, taille, matériau, motif)
 *   → Affichés uniquement si product.variant_group_id existe
 *   → Dynamiques selon le type de variante du groupe
 * - Pièces compatibles : Déterminées automatiquement selon le type de produit
 * - Dimensions/Poids : Héritées du Product Group (communes ou spécifiques selon groupe)
 * - Spécifications techniques : Héritées du Product Group
 * - Vidéo : Spécifique à chaque produit (modifiable individuellement)
 *
 * Logique pièces maison :
 * - Chaises/sièges → toutes les pièces
 * - Lavabos/sanitaires → WC et salle de bains uniquement
 * - Lits → chambre uniquement
 * - Tables → selon le type (chevet→chambre, basse→salon, etc.)
 * - Éclairage → toutes les pièces
 * - Autres → pièces appropriées selon l'usage
 *
 * Conforme aux business rules (variant_groups) :
 * - R-VAR-GROUPS-001 : variant_attributes JSONB pour flexibilité (color, size, material, pattern)
 * - R-VAR-GROUPS-002 : variant_group_id FK vers variant_groups.id
 * - R-VAR-GROUPS-003 : Édition gérée au niveau groupe uniquement
 * - R-ROOMS-001 : Pièces compatibles déterminées par type produit
 */
