import { Package, Palette, Ruler, Layers } from 'lucide-react';

import { COLLECTION_STYLE_OPTIONS } from '@verone/types';

export const formatVariantType = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    color: 'Couleur',
    size: 'Taille',
    material: 'Matériau',
    pattern: 'Motif',
  };
  return typeMap[type] ?? type;
};

export const getVariantTypeIcon = (type: string) => {
  switch (type) {
    case 'color':
      return <Palette className="h-5 w-5 text-purple-600" />;
    case 'size':
      return <Ruler className="h-5 w-5 text-blue-600" />;
    case 'material':
      return <Layers className="h-5 w-5 text-green-600" />;
    case 'pattern':
      return <Layers className="h-5 w-5 text-black" />;
    default:
      return <Package className="h-5 w-5 text-gray-600" />;
  }
};

export const formatStyle = (style?: string): string => {
  if (!style) return '';
  const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style);
  return styleOption?.label ?? style;
};
