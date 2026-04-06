import type { RoomType, VariantGroup, VariantType } from '@verone/types';

export interface CommonDimensions {
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit: 'cm' | 'm';
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface VariantGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingGroup?: VariantGroup | null;
}

export interface FormData {
  name: string;
  base_sku: string;
  subcategory_id: string;
  variant_type: VariantType;
  style: string;
  suitable_rooms: RoomType[];
  common_length: string;
  common_width: string;
  common_height: string;
  common_dimensions_unit: 'cm' | 'm';
  has_common_supplier: boolean;
  supplier_id: string;
}

export const DECORATIVE_STYLES = [
  {
    value: 'minimaliste',
    label: 'Minimaliste',
    description: 'Épuré et fonctionnel',
    icon: '⬜',
  },
  {
    value: 'contemporain',
    label: 'Contemporain',
    description: 'Moderne et actuel',
    icon: '🏙️',
  },
  {
    value: 'moderne',
    label: 'Moderne',
    description: 'Design avant-gardiste',
    icon: '🚀',
  },
  {
    value: 'scandinave',
    label: 'Scandinave',
    description: 'Chaleureux et lumineux',
    icon: '🌲',
  },
  {
    value: 'industriel',
    label: 'Industriel',
    description: 'Brut et authentique',
    icon: '⚙️',
  },
  {
    value: 'classique',
    label: 'Classique',
    description: 'Intemporel et élégant',
    icon: '👑',
  },
  {
    value: 'boheme',
    label: 'Bohème',
    description: 'Libre et éclectique',
    icon: '🌺',
  },
  {
    value: 'art_deco',
    label: 'Art Déco',
    description: 'Raffiné et géométrique',
    icon: '💎',
  },
] as const;
