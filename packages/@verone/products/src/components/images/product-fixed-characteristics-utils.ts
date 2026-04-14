'use client';

import { COLLECTION_STYLE_OPTIONS } from '@verone/types';

export function formatStyle(style: string): string {
  const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style);
  return styleOption?.label ?? style;
}

export interface ProductForCharacteristics {
  id: string;
  name?: string;
  variant_attributes?: Record<string, unknown> | null;
  variant_group_id?: string | null;
  video_url?: string;
  weight?: number | null;
  dimensions?: Record<string, unknown> | null;
  subcategory?: {
    name?: string;
    category?: {
      name?: string;
      family?: {
        name?: string;
      };
    };
  };
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

export function getCompatibleRooms(
  product: ProductForCharacteristics
): string[] {
  if (
    product.variant_group?.suitable_rooms &&
    product.variant_group.suitable_rooms.length > 0
  ) {
    return product.variant_group.suitable_rooms;
  }

  const productName = product.name?.toLowerCase() ?? '';
  const subcategoryName = product.subcategory?.name?.toLowerCase() ?? '';
  const categoryName = product.subcategory?.category?.name?.toLowerCase() ?? '';

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

  if (
    productName.includes('lit') ||
    productName.includes('matelas') ||
    productName.includes('sommier') ||
    subcategoryName.includes('lit') ||
    subcategoryName.includes('couchage')
  ) {
    return ['chambre'];
  }

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
    return ['salon', 'salle à manger', 'bureau'];
  }

  if (
    categoryName.includes('éclairage') ||
    productName.includes('lampe') ||
    productName.includes('luminaire') ||
    productName.includes('applique')
  ) {
    return allRooms;
  }

  if (
    productName.includes('armoire') ||
    productName.includes('placard') ||
    productName.includes('commode') ||
    subcategoryName.includes('rangement')
  ) {
    if (productName.includes('dressing') || productName.includes('penderie')) {
      return ['chambre', 'dressing'];
    }
    return ['salon', 'chambre', 'bureau', 'entrée'];
  }

  if (
    productName.includes('canapé') ||
    productName.includes('sofa') ||
    subcategoryName.includes('canapé')
  ) {
    return ['salon'];
  }

  return ['salon', 'chambre', 'bureau'];
}

export const VARIANT_ATTRIBUTE_LABELS: Record<
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
